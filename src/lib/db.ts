import { hasuraQuery } from "./hasura";
import {
  GET_INTERN_BY_ID,
  GET_TASK_ASSIGNMENTS_BY_TASK_ID,
  GET_TASK_BY_ID,
  GET_USER_BY_EMAIL,
  GET_USER_BY_ID,
} from "./graphql/queries";
import { v4 as uuidv4 } from "uuid";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  department?: string;
  departmentId?: string;
  phone?: string;
};

/**
 * Maps a raw Hasura user row to a clean AppUser object.
 * @param row - The raw user object from Hasura.
 * @returns A standardized AppUser object.
 */
function toUser(row: Record<string, unknown>): AppUser {
  const profile = (row.profile as Record<string, unknown>) || {};
  const department = (row.department as Record<string, unknown>) || {};
  return {
    id: row.id as string,
    name: (profile.name as string) || (row.email as string).split('@')[0],
    email: row.email as string,
    password: row.password_hash as string,
    role: row.role as string,
    department: (department.name as string) || "",
    departmentId: (row.department_id as string) || "",
    phone: (profile.phone as string) || "",
  };
}

/**
 * Maps a raw Hasura intern row to a structured object for the dashboard.
 * @param row - The raw intern/user object from Hasura.
 * @returns A consolidated intern object with profile and internship details.
 */
export function mapInternRow(row: Record<string, unknown>) {
  const intern = (row.intern as Record<string, unknown>) || {};
  const profile = (row.profile as Record<string, unknown>) || {};
  const department = (row.department as Record<string, unknown>) || {};
  return {
    id: row.id as string,
    name: profile.name || "",
    email: row.email as string,
    phone: profile.phone || "",
    department: (department.name as string) || "",
    departmentId: (row.department_id as string) || "",
    mentorId: (intern.mentor_id as string) || "",
    createdByAdmin: (intern.created_by_admin as string) || "",
    startDate: (intern.start_date as string) || "",
    endDate: (intern.end_date as string) || "",
    status: (intern.status as string) || "active",
    collegeName: (intern.college_name as string) || "",
    university: (intern.university as string) || "",
  };
}

/**
 * Standardizes a raw Task row from Hasura into a format used by the UI components.
 * Status is now per-assignment, so we compute an aggregate status.
 * 
 * @param row - The raw task object from Hasura, including optional nested assignments.
 * @returns A flattened and cleaned-up Task object for the application.
 */
export function mapTaskRow(row: Record<string, unknown>) {
  const assignments = (row.task_assignments as { intern_id: string; status: string }[]) || [];
  
  // Compute aggregate status from assignments
  let aggregateStatus = "pending";
  if (assignments.length > 0) {
    const statuses = assignments.map(a => a.status);
    if (statuses.every(s => s === "completed")) {
      aggregateStatus = "completed";
    } else if (statuses.some(s => s === "in-progress" || s === "review")) {
      aggregateStatus = "in-progress";
    } else if (statuses.some(s => s === "completed")) {
      aggregateStatus = "in-progress";
    }
  }
  
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || "",
    assignedBy: row.assigned_by as string,
    assignedToAll: (row.assigned_to_all as boolean) || false,
    deadline: (row.deadline as string) || "",
    priority: (row.priority as string) || "medium",
    status: aggregateStatus,
    createdAt: row.created_at as string,
    assignedInterns: assignments.map((a) => a.intern_id),
    assignments: assignments,
  };
}

/**
 * Retrieves a sanitized user object by their UUID.
 * @param userId - The UUID of the user.
 */
export async function getUserById(userId: string) {
  const data = await hasuraQuery<{ users_by_pk: Record<string, unknown> | null }>(GET_USER_BY_ID, { id: userId });
  return data?.users_by_pk ? toUser(data.users_by_pk) : null;
}

/**
 * Retrieves a sanitized user object by their email address.
 * @param email - The user's email address.
 */
export async function getUserByEmail(email: string) {
  const data = await hasuraQuery<{ users: Record<string, unknown>[] }>(GET_USER_BY_EMAIL, { email: email.toLowerCase() });
  return data?.users && data.users.length > 0 ? toUser(data.users[0]) : null;
}

/**
 * Retrieves a consolidated intern object by their user ID.
 * @param internId - The UUID of the intern.
 */
export async function getInternById(internId: string) {
  const data = await hasuraQuery<{ users_by_pk: Record<string, unknown> | null }>(GET_INTERN_BY_ID, { id: internId });
  return data?.users_by_pk ? mapInternRow(data.users_by_pk) : null;
}

/**
 * Fetches a complete Task object by its ID, including all assigned interns.
 * 
 * @param id - The UUID of the task to retrieve.
 * @returns A Promise resolving to the mapped Task object, or null if not found.
 */
export async function getTaskById(id: string) {
  try {
    const taskData = await hasuraQuery<{ tasks_by_pk: Record<string, unknown> | null }>(GET_TASK_BY_ID, { id });
    if (!taskData.tasks_by_pk) return null;

    const assignData = await hasuraQuery<{ task_assignments: { intern_id: string; status: string }[] }>(GET_TASK_ASSIGNMENTS_BY_TASK_ID, { taskId: id });
    
    return mapTaskRow({
      ...taskData.tasks_by_pk,
      task_assignments: assignData.task_assignments,
    });
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    return null;
  }
}

/**
 * Utility to generate a unique UUID for new database entities.
 * @returns A randomly generated UUID string.
 */
export const generateId = () => uuidv4();
