import { getInternById } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import {
  DELETE_INTERN_AND_USER,
  UPDATE_INTERN_AND_USER,
} from "@/lib/graphql/mutations";
import { GET_DEPARTMENT_BY_NAME } from "@/lib/graphql/queries";
import { logActivity } from "@/lib/activityService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const intern = await getInternById(id);

    if (!intern) {
      return NextResponse.json({ error: "Intern not found" }, { status: 404 });
    }

    return NextResponse.json(intern);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch intern" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as { role: string })?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();

    const existing = await getInternById(id);
    if (!existing) {
      return NextResponse.json({ error: "Intern not found" }, { status: 404 });
    }

    // Get department ID if department name is provided
    let departmentId = existing.departmentId;
    if (updates?.department && updates.department !== existing.department) {
      const deptData = await hasuraQuery(GET_DEPARTMENT_BY_NAME, { name: updates.department.toUpperCase() });
      if (deptData.departments && deptData.departments.length > 0) {
        departmentId = deptData.departments[0].id;
      }
    }

    const payload = {
      name: updates?.name ?? existing.name,
      email: updates?.email ?? existing.email,
      phone: updates?.phone ?? existing.phone,
      departmentId: departmentId,
      mentorId: updates?.mentorId ?? existing.mentorId,
      createdByAdmin: updates?.createdByAdmin ?? existing.createdByAdmin,
      startDate: updates?.startDate ?? existing.startDate,
      endDate: updates?.endDate ?? existing.endDate,
      status: updates?.status ?? existing.status,
      collegeName: updates?.collegeName ?? existing.collegeName,
      university: updates?.university ?? existing.university,
    };

    await hasuraMutation<void>(
      UPDATE_INTERN_AND_USER,
      {
        id,
        name: payload.name,
        email: String(payload.email || "").toLowerCase(),
        departmentId: payload.departmentId || null,
        phone: payload.phone || null,
        mentorId: payload.mentorId || null,
        createdByAdmin: payload.createdByAdmin || null,
        startDate: payload.startDate || null,
        endDate: payload.endDate || null,
        status: payload.status || null,
        collegeName: payload.collegeName || null,
        university: payload.university || null,
      }
    );

    // [LOG] Record mentor reassignment
    if (updates?.mentorId && updates.mentorId !== existing.mentorId) {
      await logActivity({
        userId: (session.user as { id: string }).id,
        action: "reassign_mentor",
        entityType: "intern",
        entityId: id,
        metadata: {
          internName: existing.name,
          oldMentorId: existing.mentorId,
          newMentorId: updates.mentorId
        }
      });
    }

    const updated = await getInternById(id);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update intern" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as { role: string })?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await getInternById(id);
    if (!existing) {
      return NextResponse.json({ error: "Intern not found" }, { status: 404 });
    }

    await hasuraMutation<void>(
      DELETE_INTERN_AND_USER,
      { id }
    );

    // [LOG] Record intern deletion
    await logActivity({
      userId: (session.user as { id: string }).id,
      action: "delete_intern",
      entityType: "user",
      entityId: id,
      metadata: { name: existing.name, email: existing.email }
    });

    return NextResponse.json({ message: "Intern deleted" });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete intern" },
      { status: 500 }
    );
  }
}
