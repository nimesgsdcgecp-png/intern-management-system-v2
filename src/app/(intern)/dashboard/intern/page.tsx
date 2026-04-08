"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { QuickActionCard } from "@/components/ui/QuickActionCard";
import { Card } from "@/components/ui/Card";
import { CheckSquare, Clock, FileText, Target, Rocket, GraduationCap, Lightbulb, Calendar } from "lucide-react";
import { AttendanceCard } from "@/components/features/AttendanceCard";
import { ActivityFeed } from "@/components/features/ActivityFeed";
import Link from "next/link";

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  submittedReports: number;
}

interface InternProfile {
  department: string;
  collegeName: string;
  mentorName: string;
  mentorDepartment: string;
  adminName: string;
}

interface TaskItem {
  id: string;
  status: string;
  assignedIntern?: string;
  assignedInterns?: string[];
  assignedToAll?: boolean;
}

interface ReportItem {
  id: string;
  internId: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

interface InternData {
  id: string;
  email: string;
  mentorId?: string;
  department?: string;
  collegeName?: string;
  university?: string;
}

export default function InternDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    submittedReports: 0,
  });
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user) return;
      try {
        const userId = session.user.id;
        const [tasksRes, reportsRes, internsRes, usersRes] = await Promise.all([
          fetch("/api/tasks?all=true"),
          fetch("/api/reports?all=true"),
          fetch("/api/interns?all=true"),
          fetch("/api/auth/users"),
        ]);

        const tasksData = tasksRes.ok ? await tasksRes.json() : { items: [], totalCount: 0 };
        const reportsData = reportsRes.ok ? await reportsRes.json() : { items: [], totalCount: 0 };
        const internsData = internsRes.ok ? await internsRes.json() : { items: [], totalCount: 0 };
        const users: UserItem[] = usersRes.ok ? await usersRes.json() : [];

        const tasks: TaskItem[] = tasksData.items || [];
        const reports: ReportItem[] = reportsData.items || [];
        const interns: InternData[] = internsData.items || [];

        const myTasks = tasks.filter((t) => {
          if (t.assignedToAll) {
            return true;
          }
          const assignedIds = Array.isArray(t.assignedInterns)
            ? t.assignedInterns
            : t.assignedIntern
              ? [t.assignedIntern]
              : [];
          return assignedIds.includes(userId);
        });
        const myReports = reports.filter((r) => r.internId === userId);

        setStats({
          totalTasks: myTasks.length,
          completedTasks: myTasks.filter((t) => t.status === "completed").length,
          pendingTasks: myTasks.filter((t) => t.status === "pending").length,
          submittedReports: myReports.length,
        });

        const myIntern = interns.find(
          (intern) => intern.id === userId || intern.email === session.user.email
        );
        if (myIntern) {
          const mentor = users.find((u) => u.id === myIntern.mentorId);
          const admin = users.find((u) => u.role === "admin");
          setProfile({
            department: myIntern.department || session.user.department || "N/A",
            collegeName: myIntern.collegeName || myIntern.university || "N/A",
            mentorName: mentor?.name || "Not assigned",
            mentorDepartment: mentor?.department || "N/A",
            adminName: admin?.name || "Not available",
          });
        }
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
      label: "My Tasks",
      value: loading ? "..." : stats.totalTasks,
      icon: <Target />,
      color: "blue" as const,
    },
    {
      label: "Completed",
      value: loading ? "..." : stats.completedTasks,
      icon: <CheckSquare />,
      color: "green" as const,
    },
    {
      label: "Pending",
      value: loading ? "..." : stats.pendingTasks,
      icon: <Clock />,
      color: "yellow" as const,
    },
    {
      label: "Total Reports",
      value: loading ? "..." : stats.submittedReports,
      icon: <FileText />,
      color: "purple" as const,
    },
  ];

  const quickActions = [
    {
      label: "Daily Report",
      href: "/dashboard/intern/submit-report",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      label: "Tasks",
      href: "/dashboard/intern/tasks",
      icon: <Target className="w-6 h-6" />,
    },
    {
      label: "Calendar",
      href: "/dashboard/calendar",
      icon: <Calendar className="w-6 h-6" />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Intern Workspace</h1>
            <p className="text-sm text-content-secondary mt-1">
              Welcome back. Manage your projects and track your professional growth.
            </p>
          </div>
          <div className="badge badge-success flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            <span>Intern Access</span>
          </div>
        </div>

        {/* Stats Grid */}
        <StatsGrid stats={statsData} loading={loading} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-content-primary mb-6">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <QuickActionCard key={action.label} {...action} />
                ))}
              </div>
            </Card>

            {/* Growth Card */}
            <Card className="p-6 bg-surface-nav border-none">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-content-nav">Professional Development</h3>
                  <p className="text-xs text-content-nav-muted uppercase tracking-wide">Growth Tips</p>
                </div>
              </div>
              <p className="text-sm text-content-nav-muted mb-6 leading-relaxed">
                Consistent performance and regular reporting are key to unlocking full-time opportunities within the organization.
              </p>
              <Link href="/dashboard/intern/tasks" className="btn btn-primary gap-2">
                View My Tasks
                <Rocket className="w-4 h-4" />
              </Link>
            </Card>

            {/* Attendance & Activity Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4">Attendance</h3>
                <AttendanceCard />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4">Recent Activity</h3>
                <Card className="p-4 h-full">
                  <ActivityFeed />
                </Card>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="overflow-hidden">
              <div className="p-6 bg-surface-nav">
                <p className="text-xs font-semibold uppercase tracking-wide text-content-nav-muted mb-2">Active Intern</p>
                <h4 className="text-xl font-bold text-content-nav mb-4">{session?.user?.name || "User"}</h4>
                <div className="flex items-center gap-2 px-3 py-2 bg-success-subtle rounded-lg w-fit">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-medium text-success-text">Active</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: "Email", value: session?.user?.email },
                  { label: "Department", value: profile?.department },
                  { label: "University", value: profile?.collegeName },
                  { label: "Mentor", value: profile?.mentorName }
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-content-muted mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-content-primary">{item.value || "Not Set"}</p>
                  </div>
                ))}
                <div className="pt-4 border-t border-border-subtle text-center">
                  <p className="text-xs text-content-muted">
                    {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </Card>

            {/* Tips Card */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-info-subtle flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-info-text" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-content-primary">Quick Tips</h3>
                  <p className="text-xs text-content-muted">Best Practices</p>
                </div>
              </div>
              <p className="text-sm text-content-secondary leading-relaxed">
                Submitting daily reports on time is the best way to demonstrate reliability to your mentor.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
