import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import { EXISTING_USER_BY_EMAIL } from "@/lib/graphql/queries";
import { CREATE_INTERN_AND_USER, CREATE_MENTOR_AND_USER, CREATE_USER, LOG_ACTIVITY } from "@/lib/graphql/mutations";
import { hash } from "bcryptjs";
import { sendCredentialsEmail } from "@/lib/email/emailService";
import { generateId } from "@/lib/db";

const DEPARTMENTS = ["AI", "ODOO", "JAVA", "MOBILE", "SAP", "QC", "PHP", "RPA"];

function randomSuffix(length = 6) {
  return Math.random().toString(36).slice(2, 2 + length);
}

function generatePassword() {
  return `Pass@${randomSuffix(8)}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    
    // Assume header: Name, Email, Role, Department, Phone, [MentorEmail/ID]
    const header = lines[0].split(",").map(h => h.trim().toLowerCase());
    const dataLines = lines.slice(1);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const line of dataLines) {
      const values = line.split(",").map(v => v.trim());
      if (values.length < 3) continue;

      const userData: Record<string, string> = {};
      header.forEach((h, i) => {
        userData[h] = values[i];
      });

        const { name, email, role, department, phone, mentor_email } = userData;

        if (!name || !email || !role || !department) {
          results.failed++;
          const missing = [];
          if (!name) missing.push("Name");
          if (!email) missing.push("Email");
          if (!role) missing.push("Role");
          if (!department) missing.push("Department");

          results.errors.push(`Missing required fields [${missing.join(", ")}] for ${email || 'row ' + (dataLines.indexOf(line) + 2)}`);
          continue;
        }

        const dept = (department || "").toUpperCase();
        if (!DEPARTMENTS.includes(dept)) {
          results.failed++;
          results.errors.push(`Invalid department [${dept}] for ${email}. Allowed: ${DEPARTMENTS.join(", ")}`);
          continue;
        }

        const finalDept = dept;

        try {
          // Check if user exists
          const existingEmail = await hasuraQuery<{ users: Array<{ id: string }> }>(
            EXISTING_USER_BY_EMAIL,
            { email: email.toLowerCase() }
          );

          if (existingEmail.users.length > 0) {
            results.failed++;
            results.errors.push(`User with email ${email} already exists`);
            continue;
          }

          // Role Restriction (Security)
          const lowerRole = role.toLowerCase();
          if (lowerRole === 'admin') {
            results.failed++;
            results.errors.push(`Security Violation: Admin role assignment blocked for ${email}`);
            continue;
          }

          if (!['intern', 'mentor'].includes(lowerRole)) {
            results.failed++;
            results.errors.push(`Invalid role for ${email}: ${role}. Only intern/mentor allowed.`);
            continue;
          }

          // Handle Mentor Assignment
          let mentorId = null;
          if (lowerRole === 'intern' && mentor_email) {
            const mentorCheck = await hasuraQuery<{ users: Array<{ id: string }> }>(
              EXISTING_USER_BY_EMAIL,
              { email: mentor_email.toLowerCase() }
            );
            if (mentorCheck.users.length > 0) {
              mentorId = mentorCheck.users[0].id;
            }
          }

          // Generate ID
          const id = generateId();
          const plainPassword = generatePassword();
          const hashedPassword = await hash(plainPassword, 10);

          // Create User
          if (lowerRole === 'intern') {
            await hasuraMutation(CREATE_INTERN_AND_USER, {
              id,
              email: email.toLowerCase(),
              password: hashedPassword,
              role: 'intern',
              name,
              department: finalDept,
              phone: phone || "",
              internStatus: 'active',
              startDate: new Date().toISOString().split('T')[0],
              mentorId: mentorId
            });
          } else if (lowerRole === 'mentor') {
            await hasuraMutation(CREATE_MENTOR_AND_USER, {
                id,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'mentor',
                name,
                department: finalDept,
                phone: phone || "",
            });
          } else {
            await hasuraMutation(CREATE_USER, {
              id,
              email: email.toLowerCase(),
              password: hashedPassword,
              role: lowerRole,
              name,
              department: finalDept,
              phone: phone || "",
            });
          }

          // Log Activity
          await hasuraMutation(LOG_ACTIVITY, {
            userId: session.user.id,
            action: `Bulk imported user: ${email}`,
            entityType: 'user',
            entityId: id,
            metadata: { role, email }
          });

          // Send Email
          await sendCredentialsEmail({
            to: email.toLowerCase(),
            credentials: { id, password: plainPassword },
            userInfo: { name, email: email.toLowerCase() },
            userType: role === 'admin' ? 'mentor' : role as 'mentor' | 'intern',
            includeResetLink: true
          });

          results.success++;
        } catch (err: unknown) {
          results.failed++;
          results.errors.push(`Error creating ${email}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }

      return NextResponse.json({
        message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
        results
      });

  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
