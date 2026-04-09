"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AttendanceTable } from "@/components/features/AttendanceTable";
import { useState, useEffect, useCallback } from "react";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { useSession } from "next-auth/react";
import { Clock, CheckCircle2, Calendar, Users, Activity, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface AttendanceItem {
  status: string;
  total_hours?: number;
  user?: {
    profile?: {
      department?: string;
    };
  };
}

export default function AttendanceMonitorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const role = session?.user?.role;
  const isMentor = role === "mentor";

  const date = searchParams.get("date") || new Date().toISOString().split('T')[0];
  const department = isMentor ? session?.user?.department || "" : (searchParams.get("department") || "");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  const [stats, setStats] = useState({ present: 0, avgHours: "0.0", lead: "N/A" });
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);

  const updateQueryParams = useCallback((newParams: Record<string, string | number | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value.toString());
      }
    });
    router.push(`${pathname}?${nextParams.toString()}`);
  }, [searchParams, pathname, router]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("all", "true");
      params.set("date", date);
      if (department) params.set("department", department);
      
      const response = await fetch(`/api/attendance?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const items: AttendanceItem[] = data.items || [];
        
        const presentCount = items.filter((l) => l.status === "present").length;
        const totalHours = items.reduce((acc: number, l) => acc + (l.total_hours || 0), 0);
        const avgHours = presentCount > 0 ? (totalHours / presentCount).toFixed(1) : "0.0";
        
        setStats({
          present: data.totalCount || presentCount,
          avgHours,
          lead: department || items[0]?.user?.profile?.department || "N/A", 
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [date, department]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch("/api/departments");
        if (!res.ok) return;
        const data: Array<{ name?: string } | string> = await res.json();
        const names = data
          .map((dept) => (typeof dept === "string" ? dept : dept?.name))
          .filter((name): name is string => Boolean(name && name.trim()));
        setDepartments(names);
      } catch {
        // no-op
      }
    };
    fetchDepartments();
  }, []);

  const statsData = [
    {
      label: "Interns Present",
      value: loading ? "..." : stats.present.toString(),
      icon: <CheckCircle2 />,
      color: "green" as const,
    },
    {
      label: "Average Hours",
      value: loading ? "..." : `${stats.avgHours}h`,
      icon: <Clock />,
      color: "blue" as const,
    },
    {
      label: "Department",
      value: loading ? "..." : stats.lead,
      icon: <Activity />,
      color: "purple" as const,
    },
  ];

  return (
    <DashboardLayout>
      <div className="w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              Attendance Monitor
            </h1>
            <p className="text-sm text-content-secondary mt-1">
              {isMentor ? "Tracking daily attendance for your department." : "Overview of intern attendance across all departments."}
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => { 
                updateQueryParams({ 
                  date: new Date().toISOString().split('T')[0], 
                  department: "",
                  page: 1 
                }); 
              }}
              className="btn btn-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-8">
          <StatsGrid stats={statsData} loading={loading} />
        </div>

        {/* Filter Section */}
        <div className="card p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="label">Select Date</label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => updateQueryParams({ date: e.target.value, page: 1 })}
                  className="input has-icon-left"
                />
              </div>
            </div>

            {!isMentor && (
              <div className="space-y-2">
                <label className="label">Department</label>
                <select
                  value={department}
                  onChange={(e) => updateQueryParams({ department: e.target.value, page: 1 })}
                  className="select"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

            {isMentor && (
              <div className="space-y-2">
                <label className="label">Your Department</label>
                <div className="input bg-surface-muted flex items-center">
                  <span className="badge badge-primary">{department || "N/A"}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-content-primary flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              Attendance Records
            </h2>
            <span className="text-sm text-content-secondary">
              {new Date(date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          
          <div className="table-container">
            <AttendanceTable 
              date={date} 
              department={department} 
              mode="all" 
              page={page} 
              pageSize={pageSize}
              onPageChange={(p) => updateQueryParams({ page: p })}
              onPageSizeChange={(s) => updateQueryParams({ pageSize: s, page: 1 })}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
