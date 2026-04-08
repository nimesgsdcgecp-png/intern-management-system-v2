import { generateId, mapInternRow } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import {
  EXISTING_USER_BY_EMAIL,
  GET_ALL_INTERNS,
  GET_DEPARTMENT_BY_NAME,
} from "@/lib/graphql/queries";
import { CREATE_INTERN_AND_USER } from "@/lib/graphql/mutations";
import { hash } from "bcryptjs";
import { sendCredentialsEmail } from "@/lib/email/emailService";

/**
 * Handle intern data management.
 * Supports GET (list interns based on role) and POST (admin creates new intern).
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("all") === "true" ? 1 : parseInt(searchParams.get("page") || "1");
    const pageSize = searchParams.get("all") === "true" ? 1000 : parseInt(searchParams.get("pageSize") || "10");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Filters
    const name = searchParams.get("name");
    const department = searchParams.get("department");
    const collegeName = searchParams.get("collegeName");
    const mentorId = searchParams.get("mentorId");

    const offset = (page - 1) * pageSize;

    const userId = session.user.id;
    const userRole = session.user.role;
    
    // Construct Hasura Where Clause
    const where: { _and: Record<string, unknown>[] } = { _and: [] };

    // Standard role-based filters
    if (userRole === "intern") {
      where._and.push({ id: { _eq: userId } });
    } else if (userRole === "mentor") {
      where._and.push({ intern: { mentor_id: { _eq: userId } } });
    }

    if (userRole !== "intern") {
       where._and.push({ role: { _eq: "intern" } });
    }

    // Dynamic filters
    if (name) where._and.push({ profile: { name: { _ilike: `%${name}%` } } });
    if (department) where._and.push({ department: { name: { _eq: department } } });
    if (collegeName) where._and.push({ intern: { college_name: { _ilike: `%${collegeName}%` } } });
    if (mentorId) where._and.push({ intern: { mentor_id: { _eq: mentorId } } });

    // Construct Sort Clause
    let orderBy: Record<string, unknown> = {};
    if (sortBy === "name") {
      orderBy = { profile: { name: sortOrder } };
    } else if (sortBy === "startDate") {
      orderBy = { intern: { start_date: sortOrder } };
    } else if (sortBy === "status") {
      orderBy = { intern: { status: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    const data = await hasuraQuery(GET_ALL_INTERNS, {
      limit: pageSize,
      offset,
      order_by: [orderBy],
      where
    });

    return NextResponse.json({
      items: data.items.map(mapInternRow),
      totalCount: data.meta.aggregate.count
    });
  } catch (error) {
    console.error("API Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch interns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const email = body.email?.toLowerCase().trim();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Check if email already exists
    const existing = await hasuraQuery(EXISTING_USER_BY_EMAIL, { email });
    if (existing.users.length > 0) return NextResponse.json({ error: "Email exists" }, { status: 409 });

    // Get department ID from name
    const deptName = body.department?.toUpperCase() || "AI";
    const deptData = await hasuraQuery(GET_DEPARTMENT_BY_NAME, { name: deptName });
    if (!deptData.departments || deptData.departments.length === 0) {
      return NextResponse.json({ error: "Department not found" }, { status: 400 });
    }
    const departmentId = deptData.departments[0].id;

    // Generate credentials
    const plainPassword = `Intern@${Math.random().toString(36).slice(-8)}`;
    const hashedPassword = await hash(plainPassword, 10);
    const internId = generateId();

    // Create Intern & User in a single mutation
    const inserted = await hasuraMutation(CREATE_INTERN_AND_USER, {
      id: internId,
      name: body.name,
      email,
      password: hashedPassword,
      role: "intern",
      departmentId: departmentId,
      phone: body.phone,
      mentorId: body.mentorId,
      startDate: body.startDate,
      internStatus: "active",
      collegeName: body.collegeName,
      university: body.university || body.collegeName,
      createdByAdmin: session.user.id,
    });

    const newIntern = mapInternRow({
      ...inserted.insert_profiles_one,
      id: internId,
      email,
      intern: inserted.insert_interns_one,
      profile: inserted.insert_profiles_one
    });

    // Attempt to send credentials email
    let emailSent = false;
    try {
      const result = await sendCredentialsEmail({
        to: email,
        credentials: { id: internId, password: plainPassword },
        userInfo: { name: body.name, email },
        userType: 'intern',
        includeResetLink: true
      });
      emailSent = result.success;
    } catch (e) {
      console.error("Email delivery failed", e);
    }

    return NextResponse.json({
      intern: newIntern,
      credentials: { id: internId, password: plainPassword },
      emailSent,
      message: emailSent ? "Account created and email sent" : "Account created (email failed)"
    }, { status: 201 });

  } catch {
    return NextResponse.json({ error: "Creation failed" }, { status: 500 });
  }
}
