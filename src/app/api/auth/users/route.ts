import { generateId } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import {
  EXISTING_USER_BY_EMAIL,
  EXISTING_USER_BY_ID,
  GET_DEPARTMENTS,
  GET_USERS,
  GET_DEPARTMENT_BY_NAME,
} from "@/lib/graphql/queries";
import { CREATE_USER, CREATE_MENTOR_AND_USER, UPDATE_USER_PASSWORD } from "@/lib/graphql/mutations";
import { hash } from "bcryptjs";
import { sendCredentialsEmail } from "@/lib/email/emailService";
import { adminResetPasswordSchema, createMentorSchema } from "@/lib/validations/schemas";
import { isPasswordPwned } from "@/lib/validations/hibp";

function randomSuffix(length = 6) {
  return Math.random().toString(36).slice(2, 2 + length);
}

function generatePassword() {
  return `Pass@${randomSuffix(8)}`;
}

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  profile: {
    name: string;
    phone?: string;
  };
  department?: {
    id: string;
    name: string;
  };
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const data = await hasuraQuery<{ users: UserRow[] }>(GET_USERS, {});

    const safeUsers = data.users.map(({ ...user }) => ({
      id: user.id,
      name: user.profile.name,
      email: user.email,
      role: user.role,
      department: user.department?.name || "",
      phone: user.profile.phone || "",
    }));
    return NextResponse.json(safeUsers);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role: string })?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const role = body?.role;
    const department = String(body?.department || "").trim();
    const phone = String(body?.phone || "").trim();

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      );
    }

    if (role !== "mentor" && role !== "intern" && role !== "admin") {
      return NextResponse.json(
        { error: "Only admin, mentor, or intern accounts can be created" },
        { status: 400 }
      );
    }

    const allDepartments = await hasuraQuery<{ departments: Array<{ name: string }> }>(GET_DEPARTMENTS);
    const departmentNames = (allDepartments.departments || []).map((d) => d.name);

    if (!departmentNames.includes(department)) {
      return NextResponse.json(
        { error: "Invalid department" },
        { status: 400 }
      );
    }

    if (role === "mentor") {
      const mentorValidation = createMentorSchema(departmentNames).safeParse({
        name,
        email,
        department,
        phone,
        role: "mentor",
      });
      if (!mentorValidation.success) {
        return NextResponse.json(
          { error: mentorValidation.error.issues[0]?.message || "Invalid mentor payload" },
          { status: 400 }
        );
      }
    }

    // Get department ID from name
    const deptData = await hasuraQuery<{ departments: Array<{ id: string; name: string }> }>(
      GET_DEPARTMENT_BY_NAME,
      { name: department }
    );
    if (!deptData.departments || deptData.departments.length === 0) {
      return NextResponse.json(
        { error: "Department not found in database" },
        { status: 400 }
      );
    }
    const departmentId = deptData.departments[0].id;

    const existingEmail = await hasuraQuery<{ users: Array<{ id: string }> }>(
      EXISTING_USER_BY_EMAIL,
      { email }
    );

    if (existingEmail.users.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    let id = generateId();
    while (true) {
      const existingId = await hasuraQuery<{ users_by_pk: { id: string } | null }>(
        EXISTING_USER_BY_ID,
        { id }
      );

      if (!existingId.users_by_pk) {
        break;
      }
      id = generateId();
    }

    const plainPassword = generatePassword();
    const hashedPassword = await hash(plainPassword, 10);

    let inserted;
    if (role === 'mentor') {
      inserted = await hasuraMutation<{
        insert_users_one: { id: string; email: string; role: string };
        insert_profiles_one: { user_id: string; name: string; phone: string };
      }>(CREATE_MENTOR_AND_USER, {
        id,
        email,
        password: hashedPassword,
        role,
        departmentId,
        name,
        phone,
      });
    } else {
      inserted = await hasuraMutation<{
        insert_users_one: { id: string; email: string; role: string };
        insert_profiles_one: { user_id: string; name: string; phone: string };
      }>(CREATE_USER, {
        id,
        email,
        password: hashedPassword,
        role,
        departmentId,
        name,
        phone,
      });
    }

    const safeUser = {
      id: inserted.insert_users_one.id,
      name: inserted.insert_profiles_one.name,
      email: inserted.insert_users_one.email,
      role: inserted.insert_users_one.role,
      department: department,
      phone: inserted.insert_profiles_one.phone,
    };

    // Send credentials email with reset link
    console.log(`Sending credentials email to new ${role}:`, email);

    try {
      // Map admin role to mentor for email template purposes (both are staff roles)
      const emailUserType = role === 'admin' ? 'mentor' : role as 'mentor' | 'intern';

      const emailResult = await sendCredentialsEmail({
        to: email,
        credentials: {
          id,
          password: plainPassword,
        },
        userInfo: {
          name,
          email,
        },
        userType: emailUserType,
        includeResetLink: true, // Include reset link for immediate password change
      });

      if (emailResult.success) {
        console.log(`Credentials email sent successfully to ${email}, messageId:`, emailResult.messageId);

        return NextResponse.json(
          {
            user: safeUser,
            credentials: {
              id,
              password: plainPassword,
            },
            message: `${role} account created successfully. Credentials have been sent to ${email}.`,
            emailSent: true,
          },
          { status: 201 }
        );
      } else {
        console.error(`Failed to send credentials email to ${email}:`, emailResult.error);

        // Still return success but include credentials since email failed
        return NextResponse.json(
          {
            user: safeUser,
            credentials: {
              id,
              password: plainPassword,
            },
            message: `${role} account created successfully, but email delivery failed. Please share these credentials manually.`,
            emailSent: false,
            emailError: emailResult.error,
          },
          { status: 201 }
        );
      }
    } catch (emailError) {
      console.error('Error sending credentials email:', emailError);

      // Fallback to returning credentials if email fails
      return NextResponse.json(
        {
          user: safeUser,
          credentials: {
            id,
            password: plainPassword,
          },
          message: `${role} account created successfully, but email service failed. Please share these credentials manually.`,
          emailSent: false,
          emailError: emailError instanceof Error ? emailError.message : 'Unknown email error',
        },
        { status: 201 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create user", details: message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role: string })?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const body = await request.json();
    const userId = body?.userId;
    const newPassword = body?.password;

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: "User ID and new password are required" },
        { status: 400 }
      );
    }

    const validation = adminResetPasswordSchema.safeParse({
      password: newPassword,
      confirmPassword: newPassword,
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid password" },
        { status: 400 }
      );
    }

    const breachCount = await isPasswordPwned(validation.data.password);
    if (breachCount > 100) {
      return NextResponse.json(
        {
          error: "PASSWORD_BREACHED",
          message: "This password was found in known data breach lists. Please choose a unique password.",
        },
        { status: 422 }
      );
    }

    const hashedPassword = await hash(validation.data.password, 10);

    await hasuraMutation<void>(UPDATE_USER_PASSWORD, {
      id: userId,
      passwordHash: hashedPassword,
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}
