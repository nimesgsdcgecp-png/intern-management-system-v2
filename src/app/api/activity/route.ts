import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraQuery } from "@/lib/hasura";
import { GET_ACTIVITY_LOGS } from "@/lib/graphql/queries";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const role = (session.user as { role: string }).role;
    const department = (session.user as { department?: string }).department;

    if (role === "intern") {
      return NextResponse.json([]); // Interns don't see the feed
    }

    interface ActivityEntry {
      id: string;
      action: string;
      created_at: string;
      user?: { profile?: { name?: string } };
    }

    let data;
    if (role === "admin") {
      data = await hasuraQuery<{ activity_logs: ActivityEntry[] }>(GET_ACTIVITY_LOGS, { limit });
    } else if (role === "mentor" && department) {
      const { GET_ACTIVITY_LOGS_BY_DEPT } = await import("@/lib/graphql/queries");
      data = await hasuraQuery<{ activity_logs: ActivityEntry[] }>(GET_ACTIVITY_LOGS_BY_DEPT, { 
        limit, 
        department 
      });
    } else {
      return NextResponse.json([]); 
    }

    return NextResponse.json(data?.activity_logs || []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
