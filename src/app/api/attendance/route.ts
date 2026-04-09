import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import { INSERT_ATTENDANCE, UPDATE_ATTENDANCE } from "@/lib/graphql/mutations";
import { logActivity } from "@/lib/activityService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date") || new Date().toISOString().split('T')[0];
    const fetchAll = searchParams.get("all") === "true";
    const department = searchParams.get("department");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const offset = (page - 1) * pageSize;
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const month = monthParam ? parseInt(monthParam) : null;
    const year = yearParam ? parseInt(yearParam) : null;

    const isAdminOrMentor = ["admin", "mentor"].includes((session.user as { role: string }).role);

    if (fetchAll && isAdminOrMentor) {
      const isMentor = (session.user as { role: string }).role === "mentor";
      const conditions: Record<string, unknown>[] = [{ date: { _eq: date } }];

      if (isMentor) {
        const mentorData = await hasuraQuery<{ users_by_pk: { department: { name: string } } | null }>(`
          query GetMentorDept($id: uuid!) {
            users_by_pk(id: $id) {
              department {
                name
              }
            }
          }
        `, { id: (session.user as { id: string }).id });
        
        const dept = mentorData.users_by_pk?.department?.name;
        if (dept) {
          conditions.push({ user: { department: { name: { _eq: dept } } } });
        }
      } else if (department) {
        conditions.push({ user: { department: { name: { _ilike: `%${department}%` } } } });
      }

      const data = await hasuraQuery<{ 
        attendance: { 
          id: string; 
          user_id: string; 
          date: string; 
          clock_in: string; 
          clock_out: string | null; 
          status: string; 
          total_hours: number | null;
          user: { profile: { name: string }; department: { name: string } };
        }[], 
        attendance_aggregate: { aggregate: { count: number } } 
      }>(`
        query GetAllAttendance($where: attendance_bool_exp, $limit: Int, $offset: Int) {
          attendance(where: $where, order_by: {clock_in: desc}, limit: $limit, offset: $offset) {
            id
            user_id
            date
            clock_in
            clock_out
            status
            total_hours
            user {
              profile {
                name
              }
              department {
                name
              }
            }
          }
          attendance_aggregate(where: $where) {
            aggregate {
              count
            }
          }
        }
      `, { 
        where: { _and: conditions },
        limit: pageSize,
        offset
      });

      // Transform data to match frontend expectations (department on profile)
      const transformedAttendance = (data.attendance || []).map(a => ({
        ...a,
        user: {
          profile: {
            name: a.user.profile.name,
            department: a.user.department?.name || ""
          }
        }
      }));

      return NextResponse.json({
        items: transformedAttendance,
        totalCount: data.attendance_aggregate?.aggregate?.count || 0
      });
    }

    const targetUserId = userId || (session.user as { id: string }).id;
    
    // For personal history view (not fetchAll)
    if (searchParams.get("history") === "true") {
      const conditions: Record<string, unknown>[] = [{ user_id: { _eq: targetUserId } }];
      if (month && year) {
        const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
        const endDate = new Date(year, month, 0).toISOString().split("T")[0];
        conditions.push({ date: { _gte: startDate, _lte: endDate } });
      }

      const data = await hasuraQuery<{ 
        attendance: {
          id: string;
          date: string;
          clock_in: string;
          clock_out: string | null;
          status: string;
          total_hours: number | null;
        }[], 
        attendance_aggregate: { aggregate: { count: number } } 
      }>(`
        query GetUserAttendanceHistory($where: attendance_bool_exp, $limit: Int, $offset: Int) {
          attendance(where: $where, order_by: {date: desc}, limit: $limit, offset: $offset) {
            id
            date
            clock_in
            clock_out
            status
            total_hours
          }
          attendance_aggregate(where: $where) {
            aggregate {
              count
            }
          }
        }
      `, { where: { _and: conditions }, limit: pageSize, offset });

      return NextResponse.json({
        items: data.attendance || [],
        totalCount: data.attendance_aggregate?.aggregate?.count || 0
      });
    }

    // Default: return today's record for punch actions
    const data = await hasuraQuery<{ 
      attendance: {
        id: string;
        clock_in: string;
        clock_out: string | null;
        status: string;
      }[]
    }>(`
      query GetTodayRecord($userId: uuid!, $date: date!) {
        attendance(where: {user_id: {_eq: $userId}, date: {_eq: $date}}) {
          id
          clock_in
          clock_out
          status
        }
      }
    `, {
      userId: targetUserId,
      date
    });

    return NextResponse.json(data.attendance[0] || null);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const { action } = body; 
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    if (action === "clock-in") {
      const existing = await hasuraQuery<{ attendance: { id: string }[] }>(`
        query GetTodayCheckIn($userId: uuid!, $date: date!) {
          attendance(where: {user_id: {_eq: $userId}, date: {_eq: $date}}) {
            id
          }
        }
      `, { userId, date: today });

      if (existing.attendance.length > 0) {
        return NextResponse.json({ error: "Already clocked in for today" }, { status: 400 });
      }

      const result = await hasuraMutation(INSERT_ATTENDANCE, {
        userId,
        date: today,
        clockIn: now,
        status: "present"
      });

      await logActivity({
        userId,
        action: "Clocked In",
        entityType: "attendance",
        entityId: (result as { insert_attendance_one: { id: string } }).insert_attendance_one.id
      });

      return NextResponse.json(result);
    } else if (action === "clock-out") {
      const existing = await hasuraQuery<{ 
        attendance: {
          id: string;
          clock_in: string;
          clock_out: string | null;
        }[] 
      }>(`
        query GetTodayCheckOut($userId: uuid!, $date: date!) {
          attendance(where: {user_id: {_eq: $userId}, date: {_eq: $date}}) {
            id
            clock_in
            clock_out
          }
        }
      `, { userId, date: today });

      if (existing.attendance.length === 0) {
        return NextResponse.json({ error: "No clock-in record found for today" }, { status: 400 });
      }

      const record = existing.attendance[0];
      if (record.clock_out) {
        return NextResponse.json({ error: "Already clocked out for today" }, { status: 400 });
      }

      const clockIn = new Date(record.clock_in);
      const clockOut = new Date(now);
      const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

      const result = await hasuraMutation(UPDATE_ATTENDANCE, {
        id: record.id,
        clockOut: now,
        totalHours: parseFloat(hours.toFixed(2))
      });

      await logActivity({
        userId,
        action: "Clocked Out",
        entityType: "attendance",
        entityId: record.id,
        metadata: { totalHours: hours.toFixed(2) }
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
