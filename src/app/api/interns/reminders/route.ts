import { NextRequest, NextResponse } from "next/server";
import { hasuraQuery } from "@/lib/hasura";
import { GET_INTERNS_WITHOUT_REPORT } from "@/lib/graphql/queries";
import { getEmailService } from "@/lib/email/emailService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * API route to send automated report reminders to interns.
 * Can be triggered by an admin or an automated cron job.
 */
export async function POST(req: NextRequest) {
  try {
    // Check authorization (allow Admin or a secret cron key)
    const session = await getServerSession(authOptions);
    const cronKey = req.headers.get('x-cron-key');
    
    if (session?.user?.role !== 'admin' && cronKey !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // 1. Fetch interns without reports for today
    interface InternRecord { email: string; profile?: { name?: string } }
    const data = await hasuraQuery<{ users: InternRecord[] }>(GET_INTERNS_WITHOUT_REPORT, { date: today });
    const interns = data?.users || [];

    if (interns.length === 0) {
      return NextResponse.json({ message: "No reminders needed today." });
    }

    // 2. Send emails
    const emailService = getEmailService();
    const results = await Promise.all(
      interns.map((intern: { email: string, profile?: { name?: string } }) => 
        emailService.sendReminderEmail(intern.email, intern.profile?.name || "Intern")
      )
    );

    const successCount = results.filter((r: { success: boolean }) => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      message: `Reminders processed.`,
      sent: successCount,
      failed: failureCount,
      recipients: interns.map((i: { email: string }) => i.email)
    });

  } catch (error) {
    console.error("Reminder API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
