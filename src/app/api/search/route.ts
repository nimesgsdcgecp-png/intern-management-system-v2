import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasuraQuery } from "@/lib/hasura";
import { GLOBAL_SEARCH } from "@/lib/graphql/queries";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

    const data = await hasuraQuery<{
      interns: { id: string; email: string; profile?: { name: string } }[];
      mentors: { id: string; email: string; profile?: { name: string } }[];
      tasks: { id: string; title: string; status: string }[];
    }>(GLOBAL_SEARCH, { query: `%${q}%` });
    
    interface SearchResult {
      id: string;
      title: string;
      type: 'intern' | 'mentor' | 'task';
      subtitle: string;
      href: string;
    }

    const results: SearchResult[] = [
      ...(data?.interns || []).map((i: { id: string; email: string; profile?: { name: string } }) => ({
        id: i.id,
        title: i.profile?.name || i.email,
        type: 'intern' as const,
        subtitle: i.email,
        href: `/dashboard/admin/interns`
      })),
      ...(data?.mentors || []).map((m: { id: string; email: string; profile?: { name: string } }) => ({
        id: m.id,
        title: m.profile?.name || m.email,
        type: 'mentor' as const,
        subtitle: m.email,
        href: `/dashboard/admin/mentors`
      })),
      ...(data?.tasks || []).map((t: { id: string; title: string; status: string }) => ({
        id: t.id,
        title: t.title,
        type: 'task' as const,
        subtitle: `Status: ${t.status}`,
        href: `/dashboard/admin/tasks`
      }))
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
