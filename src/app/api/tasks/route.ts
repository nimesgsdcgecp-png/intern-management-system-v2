import { generateId, getTaskById, mapTaskRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import { GET_ALL_INTERN_IDS, GET_ALL_TASKS, GET_CREATOR_TASKS, GET_INTERN_TASKS, GET_TASK_ASSIGNMENTS_BY_TASK_IDS, GET_USER_BY_ID } from "@/lib/graphql/queries";
import { CREATE_TASK, INSERT_TASK_ASSIGNMENTS } from "@/lib/graphql/mutations";
import { getEmailService } from "@/lib/email/emailService";
import { taskFormSchema } from "@/lib/validations/schemas";

export const dynamic = 'force-dynamic';

/**
 * API route for managing tasks.
 * Supports GET (list tasks based on role) and POST (create new task).
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("all") === "true" ? 1 : parseInt(searchParams.get("page") || "1");
    const pageSize = searchParams.get("all") === "true" ? 1000 : parseInt(searchParams.get("pageSize") || "10");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Filters
    const title = searchParams.get("title");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const offset = (page - 1) * pageSize;
    const userId = session.user.id;
    const userRole = session.user.role;

    const where: { _and: Record<string, unknown>[] } = { _and: [] };

    // Role-based logic
    if (userRole === "mentor") {
      where._and.push({ assigned_by: { _eq: userId } });
    } else if (userRole === "intern") {
      where._and.push({
        _or: [
          { assigned_to_all: { _eq: true } },
          { task_assignments: { intern_id: { _eq: userId } } }
        ]
      });
    }

    // Dynamic filters
    if (title) where._and.push({ title: { _ilike: `%${title}%` } });
    if (status) where._and.push({ status: { _eq: status } });
    if (priority) where._and.push({ priority: { _eq: priority } });

    const query = userRole === "admin" ? GET_ALL_TASKS : (userRole === "mentor" ? GET_CREATOR_TASKS : GET_INTERN_TASKS);

    const data = await hasuraQuery<{ 
      items: { id: string; [key: string]: unknown }[]; 
      meta: { aggregate: { count: number } } 
    }>(query, {
      limit: pageSize,
      offset,
      order_by: [{ [sortBy]: sortOrder }],
      where
    });

    const tasks = data.items || [];
    const totalCount = data.meta?.aggregate?.count || 0;

    if (tasks.length === 0) {
      return NextResponse.json({ items: [], totalCount: 0 });
    }

    // Fetch assignments for the tasks in this page
    const fetchedTaskIds = tasks.map((t: { id: string }) => t.id);
    const assignData = await hasuraQuery<{ task_assignments: { task_id: string; [key: string]: unknown }[] }>(GET_TASK_ASSIGNMENTS_BY_TASK_IDS, { taskIds: fetchedTaskIds });

    const mappedTasks = tasks.map((task: { id: string; [key: string]: unknown }) => mapTaskRow({
      ...task,
      task_assignments: (assignData.task_assignments || []).filter((a: { task_id: string }) => a.task_id === task.id)
    }));

    return NextResponse.json({
      items: mappedTasks,
      totalCount
    });
  } catch (error) {
    console.error("Task API Error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === "intern") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = taskFormSchema.safeParse({
      title: body?.title,
      description: body?.description ?? "",
      assignedInterns: Array.isArray(body?.assignedInterns) ? body.assignedInterns : [],
      assignedToAll: Boolean(body?.assignedToAll),
      deadline: body?.deadline ?? "",
      priority: body?.priority,
      status: body?.status ?? "pending",
      sendEmail: Boolean(body?.sendEmail),
    });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message || "Invalid task payload" }, { status: 400 });
    }
    const payload = validation.data;
    const creatorId = session.user.id;
    const taskId = generateId();

    // 1. Determine assigned interns
    let internIds: string[] = Array.isArray(payload.assignedInterns) ? payload.assignedInterns : [];
    if (payload.assignedToAll) {
      const AllData = await hasuraQuery<{ users: { id: string }[] }>(GET_ALL_INTERN_IDS, {});
      internIds = AllData.users.map((i) => i.id);
    } else if (internIds.length === 0 && body.assignedIntern) {
      internIds = [body.assignedIntern];
    }

    if (internIds.length === 0 && !payload.assignedToAll) {
      return NextResponse.json({ error: "No interns assigned" }, { status: 400 });
    }

    // 2. Create the task
    await hasuraMutation(CREATE_TASK, {
      id: taskId,
      title: payload.title,
      description: payload.description || null,
      assignedBy: creatorId,
      assignedToAll: !!payload.assignedToAll,
      deadline: payload.deadline || null,
      priority: payload.priority.toLowerCase(),
    });

    // 3. Create assignments
    if (internIds.length > 0) {
      await hasuraMutation(INSERT_TASK_ASSIGNMENTS, {
        objects: internIds.map(id => ({ task_id: taskId, intern_id: id }))
      });
    }

    // 4. Send Email Notifications if requested
    if (payload.sendEmail && internIds.length > 0) {
      const emailService = getEmailService();
      // Fetch details for each intern and send email
      Promise.all(internIds.map(async (id) => {
        try {
          const internData = await hasuraQuery<{ users_by_pk: { email?: string; profile?: { name?: string | null } } | null }>(GET_USER_BY_ID, { id });
          const user = internData.users_by_pk;
          if (user && user.email) {
             await emailService.sendTaskNotification(
              user.email,
              user.profile?.name || "Intern",
              payload.title,
              payload.deadline || "",
              payload.priority
            );
          }
        } catch (e) {
          console.error(`Failed to send task email to intern ${id}:`, e);
        }
      })).catch(e => console.error("Batch email sending failed:", e));
    }

    const newTask = await getTaskById(taskId);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create task" }, { status: 500 });
  }
}
