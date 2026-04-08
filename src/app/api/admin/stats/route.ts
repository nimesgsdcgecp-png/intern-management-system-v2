import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraQuery } from "@/lib/hasura";
import { GET_ADMIN_STATS, GET_TASK_STATUS_STATS, GET_DAILY_HOURS_STATS } from "@/lib/graphql/queries";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // 1. General Stats
    const adminStats = await hasuraQuery<{ 
      users_aggregate: { aggregate: { count: number } },
      mentors: { aggregate: { count: number } },
      tasks_aggregate: { aggregate: { count: number } }
    }>(GET_ADMIN_STATS, {});
    
    // 2. Task Status Distribution
    const taskStats = await hasuraQuery<{ tasks_aggregate: { nodes: { status: string }[] } }>(GET_TASK_STATUS_STATS, {});
    const tasks = taskStats?.tasks_aggregate?.nodes || [];
    const taskDistribution = [
      { name: 'Completed', value: tasks.filter((t) => t.status === 'completed').length, color: '#10b981' },
      { name: 'In Progress', value: tasks.filter((t) => t.status === 'in-progress').length, color: '#6366f1' },
      { name: 'Pending', value: tasks.filter((t) => t.status === 'pending').length, color: '#f59e0b' },
    ];

  // 3. Weekly Activity (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];
    
    interface ReportRow { report_date: string; hours_worked: string }
    const activityStats = await hasuraQuery<{ reports: ReportRow[] }>(GET_DAILY_HOURS_STATS, { startDate: dateStr });
    const rawReports = activityStats?.reports || [];
    
    // Group by date and sum hours
    const activityMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        activityMap[d.toISOString().split('T')[0]] = 0;
    }
    
    rawReports.forEach((r) => {
        if (activityMap[r.report_date] !== undefined) {
            activityMap[r.report_date] += parseFloat(r.hours_worked);
        }
    });

    const activityData = Object.entries(activityMap)
        .map(([date, hours]) => ({
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            hours: hours
        }))
        .reverse();

    return NextResponse.json({
      counts: {
        interns: adminStats?.users_aggregate?.aggregate?.count || 0,
        mentors: adminStats?.mentors?.aggregate?.count || 0,
        tasks: adminStats?.tasks_aggregate?.aggregate?.count || 0,
      },
      taskDistribution,
      activityData
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
