"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AttendanceTable } from "@/components/features/AttendanceTable";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { Calendar, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface AttendanceRecord {
  id: string;
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
  status: string;
}

export default function InternAttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentDate = new Date();
  const month = parseInt(searchParams.get("month") || String(currentDate.getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(currentDate.getFullYear()));
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("history", "true");
      params.set("all", "false");
      params.set("month", String(month));
      params.set("year", String(year));
      params.set("page", "1");
      params.set("pageSize", "62");

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const logsArray: AttendanceRecord[] = data.items || [];
        
        const totalDays = data.totalCount || 0;
        const presentDays = logsArray.filter((log) => log.status === "present").length;
        const absentDays = logsArray.filter((log) => log.status === "absent").length;
        const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        
        setStats({
          totalDays,
          presentDays,
          absentDays,
          attendanceRate,
        });
      }
    } catch (error: unknown) {
      console.error("Failed to fetch attendance stats:", error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const updateQueryParams = (newParams: Record<string, string | number | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value.toString());
      }
    });
    router.push(`${pathname}?${nextParams.toString()}`);
  };

  const goToToday = () => {
    const today = new Date();
    updateQueryParams({
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      page: 1,
    });
  };

  const statsData = [
    {
      label: "Total Days",
      value: loading ? "..." : String(stats.totalDays),
      icon: <Calendar />,
      color: "blue" as const,
    },
    {
      label: "Present",
      value: loading ? "..." : String(stats.presentDays),
      icon: <CheckCircle2 />,
      color: "green" as const,
    },
    {
      label: "Absent",
      value: loading ? "..." : String(stats.absentDays),
      icon: <XCircle />,
      color: "red" as const,
    },
    {
      label: "Attendance Rate",
      value: loading ? "..." : `${stats.attendanceRate}%`,
      icon: <TrendingUp />,
      color: "purple" as const,
    },
  ];

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <DashboardLayout>
      <div className="w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-content-primary">
                My Attendance
              </h1>
              <span className="badge badge-primary">
                {monthNames[month - 1]} {year}
              </span>
            </div>
            <p className="text-sm text-content-secondary mt-1">
              View your attendance records and statistics
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-8">
          <StatsGrid stats={statsData} loading={loading} />
        </div>

        {/* Month/Year Selector */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="label">Month</label>
              <select
                value={month}
                onChange={(e) => updateQueryParams({ month: parseInt(e.target.value), page: 1 })}
                className="select"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="label">Year</label>
              <select
                value={year}
                onChange={(e) => updateQueryParams({ year: parseInt(e.target.value), page: 1 })}
                className="select"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="label opacity-0">Action</label>
              <button
                onClick={goToToday}
                className="btn btn-secondary w-full"
              >
                <Calendar className="w-4 h-4" />
                Go to Today
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-content-primary flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              Attendance Records
            </h2>
            <span className="text-sm text-content-secondary">
              {monthNames[month - 1]} {year}
            </span>
          </div>
          
          <div className="table-container">
            <AttendanceTable 
              mode="personal" 
              month={month}
              year={year}
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
