import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import { GET_USER_BY_EMAIL, GET_USER_BY_ID } from "@/lib/graphql/queries";
import { UPDATE_USER_PASSWORD, UPDATE_USER_EMAIL } from "@/lib/graphql/mutations";
import { hash, compare } from "bcryptjs";

/**
 * API route for managing user profiles (email and password updates).
 */

type UserRow = {
  id: string;
  email: string;
  role: string;
  profile: {
    name: string;
    phone?: string;
  };
  department?: {
    id: string;
    name: string;
  };
  password_hash: string;
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: userId, role: userRole } = session.user as { id: string; role: string };

    if (userRole === "admin") {
      return NextResponse.json({ error: "Admin users don't have profile management" }, { status: 403 });
    }

    const data = await hasuraQuery<{ users_by_pk: UserRow | null }>(GET_USER_BY_ID, { id: userId });
    if (!data.users_by_pk) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const user = data.users_by_pk;
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.profile.name,
        email: user.email,
        role: user.role,
        department: user.department?.name || "",
        phone: user.profile.phone || "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: userId, role: userRole } = session.user as { id: string; role: string };
    if (userRole === "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { action, email, currentPassword, newPassword } = await request.json();

    if (action === "update_email") {
      if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

      const existing = await hasuraQuery<{ users: Array<{ id: string }> }>(GET_USER_BY_EMAIL, { email });
      if (existing.users.length > 0 && existing.users[0].id !== userId) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }

      await hasuraMutation<void>(UPDATE_USER_EMAIL, { id: userId, email });
      return NextResponse.json({ success: true, message: "Email updated" });
    }

    if (action === "change_password") {
      if (!currentPassword || !newPassword) return NextResponse.json({ error: "Passwords required" }, { status: 400 });

      const userData = await hasuraQuery<{ users_by_pk: { password_hash: string } | null }>(GET_USER_BY_ID, { id: userId });
      if (!userData.users_by_pk) return NextResponse.json({ error: "User not found" }, { status: 404 });
      
      const isMatch = await compare(currentPassword, userData.users_by_pk.password_hash);
      if (!isMatch) return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });

      const hashed = await hash(newPassword, 10);
      await hasuraMutation<void>(UPDATE_USER_PASSWORD, { id: userId, passwordHash: hashed });
      return NextResponse.json({ success: true, message: "Password updated" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
