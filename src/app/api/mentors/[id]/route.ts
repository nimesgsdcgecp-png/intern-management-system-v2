import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import { GET_MENTOR_BY_ID, GET_DEPARTMENT_BY_NAME, GET_DEPARTMENTS } from "@/lib/graphql/queries";
import { UPDATE_MENTOR_USER, DELETE_MENTOR_USER } from "@/lib/graphql/mutations";
import { logActivity } from "@/lib/activityService";
import { createMentorSchema } from "@/lib/validations/schemas";

/**
 * Manage individual mentor data.
 * Supports GET (details), PUT (update), and DELETE (remove).
 */

const mapMentor = (m: {
  id: string;
  name?: string;
  email: string;
  role: string;
  profile?: {
    name?: string | null;
  } | null;
  department?: {
    name?: string | null;
  } | null;
}) => ({
  id: m.id,
  name: m.profile?.name || m.name || "Mentor",
  email: m.email,
  role: m.role,
  department: m.department?.name || "",
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role: string })?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const data = await hasuraQuery<{ users_by_pk: {
      id: string;
      email: string;
      role: string;
      profile?: {
        name?: string | null;
      } | null;
      department?: {
        name?: string | null;
      } | null;
    } | null }>(GET_MENTOR_BY_ID, { id });
    const mentor = data.users_by_pk;

    if (!mentor || mentor.role !== "mentor") return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(mapMentor(mentor));
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role: string })?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    if (!body.name || !body.email) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const allDepartments = await hasuraQuery<{ departments: Array<{ name: string }> }>(GET_DEPARTMENTS);
    const departmentNames = (allDepartments.departments || []).map((d) => d.name);
    const validation = createMentorSchema(departmentNames).safeParse({
      name: body?.name,
      email: body?.email,
      department: body?.department,
      phone: body?.phone,
      role: "mentor",
    });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message || "Invalid mentor payload" }, { status: 400 });
    }

    // Get department ID from name if provided
    let departmentId = null;
    if (body.department) {
      const deptData = await hasuraQuery<{ departments: Array<{ id: string }> }>(
        GET_DEPARTMENT_BY_NAME,
        { name: String(body.department).trim() }
      );
      if (deptData.departments && deptData.departments.length > 0) {
        departmentId = deptData.departments[0].id;
      }
    }

    const updated = await hasuraMutation<{ update_users_by_pk: {
      id: string;
      email: string;
      role: string;
      profile?: {
        name?: string | null;
      } | null;
      department?: {
        name?: string | null;
      } | null;
    } | null }>(UPDATE_MENTOR_USER, {
      id,
      name: validation.data.name.trim(),
      email: validation.data.email.trim().toLowerCase(),
      departmentId: departmentId,
      phone: validation.data.phone?.trim() || null,
    });

    if (!updated.update_users_by_pk) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(mapMentor(updated.update_users_by_pk));
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as { role: string })?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const deleted = await hasuraMutation<{ 
      delete_users_by_pk: { id: string } | null;
      delete_profiles_by_pk: { name: string } | null;
    }>(DELETE_MENTOR_USER, { id });

    if (!deleted.delete_users_by_pk) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // [LOG] Record mentor deletion
    if (session?.user) {
      const mentorName = deleted.delete_profiles_by_pk?.name || "Mentor";
      await logActivity({
        userId: (session.user as { id: string }).id,
        action: "delete_mentor",
        entityType: "user",
        entityId: id,
        metadata: { name: mentorName }
      });
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
