import { NextRequest, NextResponse } from "next/server";
import { PasswordResetService } from "@/lib/auth/passwordReset";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    console.log("Processing forgot password request for:", email);

    const result = await PasswordResetService.sendOTP(email);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a verification code shortly.",
      });
    } else {
      // For security, we don't reveal if the email exists or not in most cases
      if (result.error?.includes('Too many OTP requests')) {
        return NextResponse.json(
          { error: result.error },
          { status: 429 }
        );
      }

      // For other errors, use a generic message
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a verification code shortly.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}