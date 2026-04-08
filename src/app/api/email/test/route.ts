import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEmailService } from "@/lib/email/emailService";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin users can test email service
    if ((session.user as { role: string })?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    console.log("Testing email service with configuration...");

    const emailService = getEmailService();

    // First verify the connection
    const isConnected = await emailService.verifyConnection();
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: "SMTP connection verification failed. Please check your email configuration.",
        },
        { status: 500 }
      );
    }

    // Send test email
    const result = await emailService.sendTestEmail(email);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully!",
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to send test email",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}