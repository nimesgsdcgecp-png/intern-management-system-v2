import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import { GET_EVENTS } from "@/lib/graphql/queries";
import { CREATE_EVENT } from "@/lib/graphql/mutations";
import { v4 as uuidv4 } from "uuid";

/**
 * Handle GET and POST for events.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as { id: string; role: string; department?: string };
    const role = user.role;
    const department = user.department;

    let where: Record<string, unknown> = {};

    if (role === "mentor") {
      // Mentors strictly see only their department's events
      where = {
        _and: [
          { type: { _eq: "department" } },
          { department: { _eq: department } }
        ]
      };
    } else if (role !== "admin") {
      // Non-admins see company-wide events OR events for their specific department
      where = {
        _or: [
          { type: { _eq: "company" } },
          { 
            _and: [
              { type: { _eq: "department" } },
              { department: { _eq: department } }
            ] 
          }
        ]
      };
    }

    const data = await hasuraQuery<{ events: Array<Record<string, unknown>> }>(GET_EVENTS, { where });
    return NextResponse.json(data?.events || []);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as { id: string; role: string; department?: string; departmentId?: string };
    const role = user.role;
    const userId = user.id;

    if (role === "intern") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, startTime, endTime, location, type, departmentId } = body;

    if (!title || !startTime || !endTime || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Role-based validation
    let eventType = type;
    let eventDeptId = departmentId;

    if (role === "mentor") {
      // Mentors can only create department events for their own department
      eventType = "department";
      eventDeptId = user.departmentId; // Use session departmentId
    }

    if (role === "admin" && eventType === "company") {
      eventDeptId = null;
    }

    const id = uuidv4();
    const data = await hasuraMutation<{ insert_events_one: Record<string, unknown> }>(CREATE_EVENT, {
      id,
      title,
      description,
      startTime,
      endTime,
      location,
      departmentId: eventDeptId,
      createdBy: userId
    });

    return NextResponse.json(data?.insert_events_one, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
