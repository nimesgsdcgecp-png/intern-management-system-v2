import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraMutation, hasuraQuery } from "@/lib/hasura";
import { DELETE_EVENT } from "@/lib/graphql/mutations";
import { GET_EVENTS } from "@/lib/graphql/queries";

/**
 * Handle individual event deletion.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as { id: string; role: string };
        const role = user.role;
        const { id } = await params;

        if (role === "intern") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch event to check ownership
        const data = await hasuraQuery<{ events: Array<{ id: string; created_by: string }> }>(GET_EVENTS, { where: { id: { _eq: id } } });
        const event = data?.events?.[0];

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Deletion permissions
        if (role !== "admin" && event.created_by !== user.id) {
            return NextResponse.json({ error: "Forbidden ownership" }, { status: 403 });
        }

        await hasuraMutation<void>(DELETE_EVENT, { id });

        return NextResponse.json({ message: "Event deleted" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
