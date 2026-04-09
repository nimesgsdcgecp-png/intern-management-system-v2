import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraQuery } from "@/lib/hasura";
import { GET_INTERN_BY_ID, GET_MENTOR_BY_ID, GET_TASK_BY_ID } from "@/lib/graphql/queries";

// Transform user data to include department on profile for frontend compatibility
function transformUserData(user: Record<string, unknown>) {
  if (!user) return null;
  const department = user.department as { name?: string } | null;
  const profile = user.profile as { name?: string; phone?: string } | null;
  return {
    ...user,
    profile: {
      ...profile,
      department: department?.name || null
    }
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  if (!id || !type) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    switch (type) {
      case "intern":
        const internData = await hasuraQuery<{ users_by_pk: Record<string, unknown> | null }>(
          GET_INTERN_BY_ID,
          { id }
        );
        return NextResponse.json({ 
          type: "intern",
          data: transformUserData(internData.users_by_pk || {}) 
        });
      case "mentor":
        const mentorData = await hasuraQuery<{ users_by_pk: Record<string, unknown> | null }>(
          GET_MENTOR_BY_ID,
          { id }
        );
        return NextResponse.json({ 
          type: "mentor",
          data: transformUserData(mentorData.users_by_pk || {}) 
        });
      case "task":
        const taskData = await hasuraQuery<{ tasks_by_pk: Record<string, unknown> | null }>(
          GET_TASK_BY_ID,
          { id }
        );
        return NextResponse.json({ 
          type: "task",
          data: taskData.tasks_by_pk 
        });
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Search Details API Error:", error);
    return NextResponse.json({ error: "Details fetch failed" }, { status: 500 });
  }
}
