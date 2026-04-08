import { getTaskById } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation } from "@/lib/hasura";
import {
  DELETE_TASK,
  INSERT_TASK_ASSIGNMENTS,
  REPLACE_TASK_ASSIGNMENTS,
  UPDATE_TASK_BY_CREATOR,
  UPDATE_TASK_ASSIGNMENT_STATUS,
  UPDATE_TASK_STATUS_BULK,
} from "@/lib/graphql/mutations";
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
    const task = await getTaskById(id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch task" },
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
    const userRole = session?.user ? (session.user as { role: string }).role : null;
    const userId = session?.user ? (session.user as { id: string }).id : null;
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();
    const task = await getTaskById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Interns can only update status
    if (userRole === "intern") {
      const isAssignedToIntern = task.assignedToAll ||
        task.assignedInterns.includes(String(userId));

      if (!isAssignedToIntern) {
        return NextResponse.json({ error: "Not authorized to update this task" }, { status: 403 });
      }

      if (updates.status && ["pending", "in-progress", "review", "completed"].includes(updates.status)) {
        // Status is now per-intern on task_assignments table
        await hasuraMutation(
          UPDATE_TASK_ASSIGNMENT_STATUS,
          {
            taskId: id,
            internId: userId,
            status: updates.status,
          }
        );
      } else if (Object.keys(updates).some(key => key !== "status")) {
        return NextResponse.json({ error: "Interns can only update task status" }, { status: 403 });
      }
    } else if (userRole === "admin" || userRole === "mentor") {
      await hasuraMutation(
        UPDATE_TASK_BY_CREATOR,
        {
          id,
          title: updates?.title ?? task.title,
          description: updates?.description ?? task.description,
          deadline: updates?.deadline ?? task.deadline,
          priority: updates?.priority ?? task.priority,
          assignedToAll:
            typeof updates?.assignedToAll === "boolean"
              ? updates.assignedToAll
              : task.assignedToAll,
        }
      );
      
      if (updates.status && ["pending", "in-progress", "review", "completed"].includes(updates.status)) {
        await hasuraMutation(
          UPDATE_TASK_STATUS_BULK,
          {
            taskId: id,
            status: updates.status,
          }
        );
      }

      if (Array.isArray(updates?.assignedInterns) || updates?.assignedIntern) {
        const assignedInterns = Array.isArray(updates?.assignedInterns)
          ? [...new Set(updates.assignedInterns)]
          : updates?.assignedIntern
          ? [updates.assignedIntern]
          : [];

        await hasuraMutation(
          REPLACE_TASK_ASSIGNMENTS,
          { taskId: id }
        );

        if (assignedInterns.length > 0) {
          await hasuraMutation(
            INSERT_TASK_ASSIGNMENTS,
            {
              objects: assignedInterns.map((internId: string) => ({
                task_id: id,
                intern_id: internId,
              })),
            }
          );
        }
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedTask = await getTaskById(id);

    return NextResponse.json(updatedTask);
  } catch {
    return NextResponse.json(
      { error: "Failed to update task" },
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
    const userRole = session?.user ? (session.user as { role: string }).role : null;
    const userId = session?.user ? (session.user as { id: string }).id : null;
    
    if (!session || (userRole !== "admin" && userRole !== "mentor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const task = await getTaskById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.assignedBy !== userId) {
      return NextResponse.json({ error: "You can only delete your own tasks" }, { status: 403 });
    }

    await hasuraMutation(
      DELETE_TASK,
      { id }
    );

    // [LOG] Record task deletion
    if (session?.user) {
      await logActivity({
        userId: (session.user as { id: string }).id,
        action: "delete_task",
        entityType: "task",
        entityId: id,
        metadata: { title: task.title }
      });
    }

    return NextResponse.json({ message: "Task deleted" });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
