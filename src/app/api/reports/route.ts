import { generateId } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import {
  GET_ALL_REPORTS,
  GET_MENTOR_INTERN_IDS,
} from "@/lib/graphql/queries";
import { CREATE_REPORT } from "@/lib/graphql/mutations";

/**
 * Handle report submissions and retrieval.
 * Supports GET (list reports) and POST (interns submit new report).
 */

interface ReportRow {
  id: string;
  intern_id: string;
  report_date: string;
  work_description: string;
  hours_worked: number;
  mentor_feedback?: string | null;
  submitted_at: string;
}

const mapReport = (r: ReportRow) => ({
  id: r.id,
  internId: r.intern_id,
  date: r.report_date,
  workDescription: r.work_description,
  hoursWorked: r.hours_worked,
  mentorFeedback: r.mentor_feedback || "",
  submittedAt: r.submitted_at,
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const sortBy = searchParams.get("sortBy") || "submitted_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * pageSize;
    const userId = session.user.id;
    const userRole = session.user.role;

    const where: Record<string, unknown> = { _and: [] };

    if (userRole === "mentor") {
      const internData = await hasuraQuery<{ users: { id: string }[] }>(GET_MENTOR_INTERN_IDS, { mentorId: userId });
      const ids = internData.users.map((i) => i.id);
      if (ids.length === 0) return NextResponse.json({ items: [], totalCount: 0 });
      (where._and as Record<string, unknown>[]).push({ intern_id: { _in: ids } });
    } else if (userRole === "intern") {
      (where._and as Record<string, unknown>[]).push({ intern_id: { _eq: userId } });
    }

    const data = await hasuraQuery<{ items: ReportRow[], meta: { aggregate: { count: number } } }>(GET_ALL_REPORTS, {
      limit: pageSize,
      offset,
      order_by: [{ [sortBy]: sortOrder }],
      where
    });

    return NextResponse.json({
      items: (data.items || []).map((r: ReportRow) => mapReport(r)),
      totalCount: data.meta?.aggregate?.count || 0
    });
  } catch (error: unknown) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "intern") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const inserted = await hasuraMutation<{ insert_reports_one: ReportRow }>(CREATE_REPORT, {
      id: generateId(),
      internId: session.user.id,
      reportDate: body.date,
      workDescription: body.workDescription,
      hoursWorked: Number(body.hoursWorked || 0),
    });

    return NextResponse.json(mapReport(inserted.insert_reports_one), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
