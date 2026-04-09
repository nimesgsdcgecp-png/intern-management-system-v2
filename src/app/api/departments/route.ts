import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import { CREATE_DEPARTMENT } from "@/lib/graphql/mutations";
import { GET_DEPARTMENT_BY_NAME, GET_DEPARTMENTS_WITH_STATS } from "@/lib/graphql/queries";
import { generateId } from "@/lib/db";

export async function GET() {
  try {
    const data = await hasuraQuery<{
      departments: Array<{
        id: string;
        name: string;
        head_id: string | null;
        head?: {
          id: string;
          profile?: { name?: string | null } | null;
        } | null;
        mentors?: Array<{
          id: string;
          profile?: { name?: string | null } | null;
        }>;
        interns_aggregate?: { aggregate?: { count?: number | null } | null } | null;
        mentors_aggregate?: { aggregate?: { count?: number | null } | null } | null;
      }>;
    }>(GET_DEPARTMENTS_WITH_STATS);

    const departments = (data?.departments || []).map((department) => ({
      id: department.id,
      name: department.name,
      head_id: department.head_id,
      head: department.head
        ? {
            id: department.head.id,
            profile: {
              name: department.head.profile?.name || "",
            },
          }
        : null,
      mentors: (department.mentors || []).map((mentor) => ({
        id: mentor.id,
        name: mentor.profile?.name || "Mentor",
      })),
      internsCount: department.interns_aggregate?.aggregate?.count || 0,
      mentorsCount: department.mentors_aggregate?.aggregate?.count || 0,
    }));

    return NextResponse.json(departments);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body?.name || "").trim().replace(/\s+/g, " ");
    if (!name) {
      return NextResponse.json({ error: "Department name is required" }, { status: 400 });
    }
    if (name.length > 60) {
      return NextResponse.json({ error: "Department name must be at most 60 characters" }, { status: 400 });
    }

    const existing = await hasuraQuery<{ departments: Array<{ id: string; name: string }> }>(
      GET_DEPARTMENT_BY_NAME,
      { name }
    );
    if (existing.departments.length > 0) {
      return NextResponse.json({ error: "Department already exists" }, { status: 409 });
    }

    const created = await hasuraMutation<{
      insert_departments_one: {
        id: string;
        name: string;
        head_id: string | null;
        head?: { id: string; profile?: { name?: string | null } | null } | null;
      };
    }>(CREATE_DEPARTMENT, {
      id: generateId(),
      name,
    });

    return NextResponse.json(created.insert_departments_one, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
