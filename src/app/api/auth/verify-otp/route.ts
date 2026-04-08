import { NextRequest, NextResponse } from "next/server";
import { PasswordResetService } from "@/lib/auth/passwordReset";

/**
 * API Route: OTP Verification
 * Validates the 6-digit One-Time Password sent to the user's email.
 * If successful, issues a short-lived reset token for the password reset flow.
 * Includes basic rate-limiting by tracking attempts via PasswordResetService.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
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

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "Invalid OTP format" },
        { status: 400 }
      );
    }

    console.log("Processing OTP verification for:", email);

    const result = await PasswordResetService.verifyOTP(email, otp);

    if (result.success && result.resetToken) {
      return NextResponse.json({
        success: true,
        resetToken: result.resetToken,
        message: "OTP verified successfully. You can now reset your password.",
      });
    } else {
      // Increment attempts for rate limiting
      await PasswordResetService.incrementOTPAttempts(email, otp);

      return NextResponse.json(
        {
          error: result.error || "Invalid or expired OTP code",
          success: false
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}