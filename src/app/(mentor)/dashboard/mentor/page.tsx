"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { QuickActionCard } from "@/components/ui/QuickActionCard";
import { Users, FileText, Clock, CheckSquare, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ActivityFeed } from "@/components/features/ActivityFeed";

interface Task {
  id: string;
  assignedInterns?: string[];
  assignedIntern?: string;
  assignedToAll?: boolean;
  status: string;
}

interface Report {
  internId: string;
  mentorFeedback?: string;
}

interface Intern {
  id: string;
  mentorId: string;
}

interface DashboardStats {
  myInterns: number;
  assignedTasks: number;
  pendingReports: number;
  completedTasks: number;
}

export default function MentorDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    myInterns: 0,
    assignedTasks: 0,
    pendingReports: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userId = (session?.user as { id: string })?.id;
        const [internsRes, tasksRes, reportsRes] = await Promise.all([
          fetch("/api/interns?all=true"),
          fetch("/api/tasks?all=true"),
          fetch("/api/reports?all=true"),
        ]);

        const internsData = internsRes.ok ? await internsRes.json() : { items: [], totalCount: 0 };
        const tasksData = tasksRes.ok ? await tasksRes.json() : { items: [], totalCount: 0 };
        const reportsData = reportsRes.ok ? await reportsRes.json() : { items: [], totalCount: 0 };

        const interns = internsData.items || [];
        const tasks = tasksData.items || [];
        const reports = reportsData.items || [];

        const myInterns = interns.filter((i: Intern) => i.mentorId === userId);
        const myInternIds = myInterns.map((i: Intern) => i.id);

        const assignedTasks = tasks.filter((t: Task) => {
          if (t.assignedToAll) {
            return myInternIds.length > 0;
          }

          const assignedIds = Array.isArray(t.assignedInterns)
            ? t.assignedInterns
            : t.assignedIntern
            ? [t.assignedIntern]
            : [];

          return assignedIds.some((id: string) => myInternIds.includes(id));
        });

        setStats({
          myInterns: myInterns.length,
          assignedTasks: assignedTasks.length,
          pendingReports: reports.filter(
            (r: Report) => !r.mentorFeedback && myInternIds.includes(r.internId)
          ).length,
          completedTasks: assignedTasks.filter((t: Task) => t.status === "completed")
            .length,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) fetchStats();
  }, [session]);

  const statsData = [
    {
      label: "My Interns",
      value: loading ? "..." : stats.myInterns,
      icon: <Users />,
      color: "blue" as const,
    },
    {
      label: "Total Tasks",
      value: loading ? "..." : stats.assignedTasks,
      icon: <FileText />,
      color: "purple" as const,
    },
    {
      label: "Reviews Needed",
      value: loading ? "..." : stats.pendingReports,
      icon: <Clock />,
      color: "yellow" as const,
    },
    {
      label: "Finished Tasks",
      value: loading ? "..." : stats.completedTasks,
      icon: <CheckSquare />,
      color: "green" as const,
    },
  ];

  const quickActions = [
    {
      label: "Interns",
      href: "/dashboard/mentor/interns",
      icon: <Users className="w-6 h-6" />,
    },
    {
      label: "Tasks",
      href: "/dashboard/mentor/tasks",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      label: "Reports",
      href: "/dashboard/mentor/reports",
      icon: <CheckSquare className="w-6 h-6" />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Mentor Dashboard</h1>
            <p className="text-sm text-content-secondary mt-1">
              Welcome back. Oversee your assigned interns and evaluate their performance.
            </p>
          </div>
          <div className="badge badge-primary flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span>Mentor Access</span>
          </div>
        </div>

        {/* Stats Grid */}
        <StatsGrid stats={statsData} loading={loading} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions & Stats */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-content-primary mb-6">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <QuickActionCard key={action.label} {...action} />
                ))}
              </div>
            </Card>

            {/* Mentor Guidelines Card */}
            <Card className="p-6 bg-surface-nav border-none">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-content-nav mb-3">Mentor Guidelines</h3>
                  <p className="text-sm text-content-nav-muted mb-6 leading-relaxed">
                    Guidance is key to intern growth. Review reports and provide feedback within 24 hours of submission.
                  </p>
                  <Link href="/dashboard/mentor/reports" className="btn btn-primary gap-2">
                    Review Reports
                    <FileText className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </Card>

            {/* Intern Stats Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-content-primary mb-6">Intern Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card-stat">
                  <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">Assigned Interns</p>
                  <p className="text-3xl font-bold text-content-primary mt-2">
                    {loading ? "..." : stats.myInterns}
                  </p>
                </div>
                <div className="card-stat">
                  <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">Pending Reviews</p>
                  <p className="text-3xl font-bold text-warning mt-2">
                    {loading ? "..." : stats.pendingReports}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Activity Feed */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-content-primary mb-6">Recent Activity</h3>
              <ActivityFeed />
            </Card>

            {/* Resources Card */}
            <Card className="p-6 bg-surface-nav border-none">
              <h3 className="text-lg font-bold text-content-nav mb-2">Resources</h3>
              <p className="text-sm text-content-nav-muted mb-6">
                Access evaluation protocols and platform documentation.
              </p>
              <Link href="/dashboard/help" className="btn btn-secondary w-full">
                View Guide
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
