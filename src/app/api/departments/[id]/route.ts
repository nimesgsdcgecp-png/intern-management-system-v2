import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import { DELETE_DEPARTMENT, UPDATE_DEPARTMENT_HEAD, UPDATE_DEPARTMENT_NAME } from "@/lib/graphql/mutations";
import { GET_DEPARTMENT_BY_NAME, GET_DEPARTMENT_USER_COUNT, GET_USER_BY_ID } from "@/lib/graphql/queries";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const hasName = Object.prototype.hasOwnProperty.call(body ?? {}, "name");
    const hasHeadId = Object.prototype.hasOwnProperty.call(body ?? {}, "head_id");

    if (!hasName && !hasHeadId) {
      return NextResponse.json({ error: "Provide at least one field: name or head_id" }, { status: 400 });
    }

    let nextName: string | undefined;
    if (hasName) {
      nextName = String(body?.name || "").trim().replace(/\s+/g, " ");
      if (!nextName) {
        return NextResponse.json({ error: "Department name is required" }, { status: 400 });
      }
      if (nextName.length > 60) {
        return NextResponse.json({ error: "Department name must be at most 60 characters" }, { status: 400 });
      }

      const existing = await hasuraQuery<{ departments: Array<{ id: string }> }>(
        GET_DEPARTMENT_BY_NAME,
        { name: nextName }
      );
      const duplicate = existing.departments.some((dept) => dept.id !== id);
      if (duplicate) {
        return NextResponse.json({ error: "Department already exists" }, { status: 409 });
      }
    }

    const headId = hasHeadId ? (body?.head_id ? String(body.head_id) : null) : undefined;
    if (hasHeadId && headId) {
      const headUser = await hasuraQuery<{
        users_by_pk: { id: string; role: string; department_id: string | null } | null;
      }>(GET_USER_BY_ID, { id: headId });
      if (!headUser.users_by_pk || headUser.users_by_pk.role !== "mentor") {
        return NextResponse.json({ error: "Department head must be a mentor" }, { status: 400 });
      }
      if (headUser.users_by_pk.department_id !== id) {
        return NextResponse.json({ error: "Department head must belong to the same department" }, { status: 400 });
      }
    }

    type UpdateResponse = {
      update_departments_by_pk: {
        id: string;
        name: string;
        head_id: string | null;
        head?: { id: string; profile?: { name?: string | null } | null } | null;
      } | null;
    };

    let updated: UpdateResponse | null = null;
    if (hasName && hasHeadId) {
      const renamed = await hasuraMutation<UpdateResponse>(UPDATE_DEPARTMENT_NAME, {
        id,
        name: nextName,
      });
      if (!renamed.update_departments_by_pk) {
        return NextResponse.json({ error: "Department not found" }, { status: 404 });
      }
      updated = await hasuraMutation<UpdateResponse>(UPDATE_DEPARTMENT_HEAD, {
        id,
        headId,
      });
    } else if (hasName) {
      updated = await hasuraMutation<UpdateResponse>(UPDATE_DEPARTMENT_NAME, {
        id,
        name: nextName,
      });
    } else {
      updated = await hasuraMutation<UpdateResponse>(UPDATE_DEPARTMENT_HEAD, {
        id,
        headId,
      });
    }

    if (!updated?.update_departments_by_pk) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json(updated.update_departments_by_pk);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const usage = await hasuraQuery<{ users_aggregate: { aggregate: { count: number | null } | null } }>(
      GET_DEPARTMENT_USER_COUNT,
      { departmentId: id }
    );

    const userCount = usage.users_aggregate.aggregate?.count || 0;
    if (userCount > 0) {
      return NextResponse.json(
        { error: "Department cannot be deleted because users are still assigned to it" },
        { status: 409 }
      );
    }

    const deleted = await hasuraMutation<{ delete_departments_by_pk: { id: string } | null }>(
      DELETE_DEPARTMENT,
      { id }
    );

    if (!deleted.delete_departments_by_pk) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Department deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
