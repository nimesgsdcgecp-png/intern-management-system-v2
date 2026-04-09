import { NextRequest, NextResponse } from "next/server";
import { isPasswordPwned } from "@/lib/validations/hibp";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const normalized = String(password || "");

    if (!normalized) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const count = await isPasswordPwned(normalized);
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: "Failed to check password" }, { status: 500 });
  }
}
