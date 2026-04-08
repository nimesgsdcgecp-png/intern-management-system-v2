"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  CheckSquare,
  BarChart3,
  PlusCircle,
  ClipboardList,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { QuickActionCard } from "@/components/ui/QuickActionCard";
import { Card } from "@/components/ui/Card";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ActivityFeed } from "@/components/features/ActivityFeed";
import Link from "next/link";

interface DashboardData {
  totalInterns: number;
  totalMentors: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  totalReports: number;
  pendingReports: number;
  recentActivity: Activity[];
}

interface User {
  id: string;
  role: string;
}

interface Task {
  status: string;
}

interface Report {
  mentorFeedback?: string;
}

interface Activity {
  id: string;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>({
    totalInterns: 0,
    totalMentors: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalReports: 0,
    pendingReports: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [internsRes, usersRes, tasksRes, reportsRes, activityRes] = await Promise.all([
          fetch("/api/interns?pageSize=1"),
          fetch("/api/auth/users"),
          fetch("/api/tasks?pageSize=10"),
          fetch("/api/reports?pageSize=10"),
          fetch("/api/activity").catch(() => ({ ok: false, json: () => [] })),
        ]);

        const internsData = internsRes.ok ? await internsRes.json() : { items: [], totalCount: 0 };
        const users = usersRes.ok ? await usersRes.json() : [];
        const tasksData = tasksRes.ok ? await tasksRes.json() : { items: [], totalCount: 0 };
        const reportsData = reportsRes.ok ? await reportsRes.json() : { items: [], totalCount: 0 };
        const activity = activityRes.ok ? await activityRes.json() : [];

        const mentors = users.filter((u: User) => u.role === "mentor");
        const totalInterns = internsData.totalCount;
        const totalTasks = tasksData.totalCount;
        const totalReports = reportsData.totalCount;
        
        const tasks = tasksData.items || [];
        const reports = reportsData.items || [];

        setData({
          totalInterns,
          totalMentors: mentors.length,
          totalTasks,
          pendingTasks: tasks.filter((t: Task) => t.status === "pending").length,
          completedTasks: tasks.filter((t: Task) => t.status === "completed").length,
          totalReports,
          pendingReports: reports.filter((r: Report) => !r.mentorFeedback).length,
          recentActivity: Array.isArray(activity) ? activity.slice(0, 5) : [],
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const completionRate = data.totalTasks > 0
    ? Math.round((data.completedTasks / data.totalTasks) * 100)
    : 0;

  const statsData = [
    {
      label: "Total Interns",
      value: loading ? "..." : data.totalInterns,
      icon: <Users />,
      color: "blue" as const,
    },
    {
      label: "Active Mentors",
      value: loading ? "..." : data.totalMentors,
      icon: <UserCheck />,
      color: "purple" as const,
    },
    {
      label: "Tasks Done",
      value: loading ? "..." : data.completedTasks,
      icon: <CheckSquare />,
      color: "green" as const,
    },
    {
      label: "Pending Reports",
      value: loading ? "..." : data.pendingReports,
      icon: <BarChart3 />,
      color: "yellow" as const,
    },
  ];

  const quickActions = [
    {
      label: "Add Intern",
      href: "/dashboard/admin/interns",
      icon: <PlusCircle className="w-6 h-6" />,
    },
    {
      label: "Reports",
      href: "/dashboard/admin/reports",
      icon: <BarChart3 className="w-6 h-6" />,
    },
    {
      label: "Logs",
      href: "/dashboard/admin/logs",
      icon: <ClipboardList className="w-6 h-6" />,
    },
    {
      label: "Attendance",
      href: "/dashboard/admin/attendance",
      icon: <Activity className="w-6 h-6" />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Admin Dashboard</h1>
            <p className="text-sm text-content-secondary mt-1">
              Welcome back. Manage your interns and team from one place.
            </p>
          </div>
          <div className="badge badge-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Access</span>
          </div>
        </div>

        {/* Stats Grid */}
        <StatsGrid stats={statsData} loading={loading} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions - Full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-content-primary mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <QuickActionCard key={action.label} {...action} />
                ))}
              </div>
            </Card>

            {/* Reports Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-content-primary mb-6">Reports Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card-stat">
                  <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">Total Reports</p>
                  <p className="text-3xl font-bold text-content-primary mt-2">
                    {loading ? "..." : data.totalReports}
                  </p>
                </div>
                <div className="card-stat">
                  <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">Pending Review</p>
                  <p className="text-3xl font-bold text-warning mt-2">
                    {loading ? "..." : data.pendingReports}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Overview Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-content-primary">Overview</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <Activity className="w-4 h-4 text-content-muted" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                  <span className="text-sm text-content-secondary">Total Interns</span>
                  <span className="text-sm font-semibold text-content-primary">
                    {loading ? "..." : data.totalInterns}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                  <span className="text-sm text-content-secondary">Active Mentors</span>
                  <span className="text-sm font-semibold text-content-primary">
                    {loading ? "..." : data.totalMentors}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                  <span className="text-sm text-content-secondary">Pending Tasks</span>
                  <span className="text-sm font-semibold text-warning">
                    {loading ? "..." : data.pendingTasks}
                  </span>
                </div>
              </div>
              
              {/* Completion Rate */}
              <div className="mt-4 p-4 bg-primary-subtle rounded-lg border border-primary-border">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-text mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-primary-text">{completionRate}%</p>
              </div>
            </Card>

            {/* Quick Links */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-content-primary mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link 
                  href="/dashboard/admin/interns" 
                  className="btn btn-secondary w-full justify-start gap-3"
                >
                  <Users className="w-4 h-4" />
                  Manage Interns
                </Link>
                <Link 
                  href="/dashboard/admin/mentors" 
                  className="btn btn-secondary w-full justify-start gap-3"
                >
                  <UserCheck className="w-4 h-4" />
                  Manage Mentors
                </Link>
                <Link 
                  href="/dashboard/admin/reports" 
                  className="btn btn-secondary w-full justify-start gap-3"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Reports
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Activity Feed */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-content-primary mb-6">Recent Activity</h3>
          <ActivityFeed />
        </Card>
      </div>
    </DashboardLayout>
  );
}
