import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import { GET_REPORT_BY_ID, GET_USER_BY_ID } from "@/lib/graphql/queries";
import { getEmailService } from "@/lib/email/emailService";
import { gql } from "@apollo/client/core";

type ReportRow = {
  id: string;
  intern_id: string;
  report_date: string;
  work_description: string;
  hours_worked: number;
  mentor_feedback?: string;
  submitted_at: string;
};

function mapReportRow(report: ReportRow) {
  return {
    id: report.id,
    internId: report.intern_id,
    date: report.report_date,
    workDescription: report.work_description,
    hoursWorked: report.hours_worked,
    mentorFeedback: report.mentor_feedback || "",
    submittedAt: report.submitted_at,
  };
}

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
    const data = await hasuraQuery<{ reports_by_pk: ReportRow | null }>(
      GET_REPORT_BY_ID,
      { id }
    );
    const report = data.reports_by_pk;

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(mapReportRow(report));
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string = "";
    let updates: Record<string, unknown> = {};

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    id = resolvedParams.id;
    updates = await request.json();
    
    console.log("Update report request:", { id, updates });

    // Build dynamic mutation based on fields being updated
    const setFields: string[] = [];
      const mutationVars: Record<string, unknown> = { id };
    const varDeclarations: string[] = ["$id: uuid!"];

    if (updates?.date !== undefined) {
      mutationVars.reportDate = updates.date;
      setFields.push("report_date: $reportDate");
      varDeclarations.push("$reportDate: date");
    }

    if (updates?.workDescription !== undefined) {
      mutationVars.workDescription = updates.workDescription;
      setFields.push("work_description: $workDescription");
      varDeclarations.push("$workDescription: String");
    }

    if (updates?.hoursWorked !== undefined) {
      mutationVars.hoursWorked =
        typeof updates.hoursWorked === "number"
          ? updates.hoursWorked
          : Number(updates.hoursWorked);
      setFields.push("hours_worked: $hoursWorked");
      varDeclarations.push("$hoursWorked: numeric");
    }

    if (updates?.mentorFeedback !== undefined) {
      mutationVars.mentorFeedback =
        typeof updates.mentorFeedback === "string"
          ? updates.mentorFeedback
          : String(updates.mentorFeedback);
      setFields.push("mentor_feedback: $mentorFeedback");
      varDeclarations.push("$mentorFeedback: String");
    }

    if (setFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Build the dynamic mutation
    const UPDATE_REPORT_DYNAMIC = gql`
      mutation UpdateReport(${varDeclarations.join(", ")}) {
        update_reports_by_pk(
          pk_columns: { id: $id }
          _set: {
            ${setFields.join(",\n            ")}
          }
        ) {
          id
          intern_id
          report_date
          work_description
          hours_worked
          mentor_feedback
          submitted_at
        }
      }
    `;

    console.log("Generated mutation:", UPDATE_REPORT_DYNAMIC.loc?.source.body);
    console.log("Mutation variables:", mutationVars);

    const updated = await hasuraMutation<{ update_reports_by_pk: ReportRow | null }>(
      UPDATE_REPORT_DYNAMIC,
      mutationVars
    );
    
    console.log("Mutation response:", updated);

    if (!updated.update_reports_by_pk) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // [MOD] Send Email Notification if requested
    if (updates.sendEmail) {
      const emailService = getEmailService();
      const report = updated.update_reports_by_pk;
      const internId = report.intern_id;
      const mentorName = (session.user as { name?: string }).name || "Your Mentor";

      try {
        const internData = await hasuraQuery<{ 
          users_by_pk: { email: string; profile?: { name: string } } | null 
        }>(GET_USER_BY_ID, { id: internId });
        const internUser = internData.users_by_pk;
        if (internUser && internUser.email) {
          await emailService.sendFeedbackNotification(
            internUser.email,
            internUser.profile?.name || "Intern",
            report.report_date,
            mentorName
          );
        }
      } catch (e) {
        console.error("Failed to send feedback email:", e);
      }
    }

    return NextResponse.json(mapReportRow(updated.update_reports_by_pk));
  } catch (error) {
    console.error("Update report error:", error);
    console.error("Request details:", { id: id || "unknown", updates: updates || {} });

    // Log more specific error details
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to update report",
        details: error instanceof Error ? error.message : "Unknown error",
        requestId: id || "unknown"
      },
      { status: 500 }
    );
  }
}
