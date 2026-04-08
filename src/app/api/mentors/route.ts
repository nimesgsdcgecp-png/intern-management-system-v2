import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraQuery } from "@/lib/hasura";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role: string })?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const offset = (page - 1) * pageSize;

    const conditions: Record<string, unknown>[] = [{ role: { _eq: "mentor" } }];

    if (search) {
      conditions.push({
        _or: [
          { profile: { name: { _ilike: `%${search}%` } } },
          { email: { _ilike: `%${search}%` } }
        ]
      });
    }

    if (department) {
      conditions.push({ department: { name: { _eq: department } } });
    }

    const data = await hasuraQuery<{ 
      users: {
        id: string;
        email: string;
        role: string;
        profile: {
          name: string | null;
          phone: string | null;
        } | null;
        department: {
          name: string;
        } | null;
      }[], 
      users_aggregate: { aggregate: { count: number } } 
    }>(`
      query GetMentors($where: users_bool_exp, $limit: Int, $offset: Int) {
        users(where: $where, order_by: {profile: {name: asc}}, limit: $limit, offset: $offset) {
          id
          email
          role
          profile {
            name
            phone
          }
          department {
            name
          }
        }
        users_aggregate(where: $where) {
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

    const safeMentors = data.users.map(u => ({
      id: u.id,
      name: u.profile?.name || "Unknown",
      email: u.email,
      role: u.role,
      department: u.department?.name || "",
      phone: u.profile?.phone || "",
    }));

    return NextResponse.json({
      items: safeMentors,
      totalCount: data.users_aggregate.aggregate.count
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
