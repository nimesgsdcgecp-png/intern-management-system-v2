import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraQuery } from "@/lib/hasura";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await hasuraQuery<{ departments: { id: string; name: string }[] }>(GET_DEPARTMENTS);
    return NextResponse.json(data?.departments || []);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
