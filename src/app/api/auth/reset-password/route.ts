import { NextRequest, NextResponse } from "next/server";
import { PasswordResetService } from "@/lib/auth/passwordReset";

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Token, password, and confirm password are required" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" },
        { status: 400 }
      );
    }

    console.log("Processing password reset for token:", token.substring(0, 8) + "...");

    const result = await PasswordResetService.resetPassword(token, password);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Password reset successfully. You can now login with your new password.",
      });
    } else {
      return NextResponse.json(
        {
          error: result.error || "Failed to reset password",
          success: false
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}