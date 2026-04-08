"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AttendanceTable } from "@/components/features/AttendanceTable";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { Clock, Calendar, CheckCircle2, History, Timer, Loader2, LogIn, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface AttendanceRecord {
  id: string;
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
}

export default function InternAttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [stats, setStats] = useState({
    totalHours: 0,
    presentDays: 0,
    avgDailyHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [punching, setPunching] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance?history=true&all=false");
      if (res.ok) {
        const data = await res.json();
        const logsArray = data.items || [];
        
        const present = data.totalCount || 0;
        const totalHours = logsArray.reduce((acc: number, log: AttendanceRecord) => acc + (log.total_hours || 0), 0);
        const avg = present > 0 ? (totalHours / present).toFixed(1) : "0.0";
        
        setStats({
          totalHours: parseFloat(totalHours.toFixed(1)),
          presentDays: present,
          avgDailyHours: parseFloat(avg),
        });
      }
    } catch (error: unknown) {
      console.error("Failed to fetch attendance stats:", error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTodayRecord = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance");
      if (res.ok) {
        const data = await res.json();
        setTodayRecord(data);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch today record:", error instanceof Error ? error.message : error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTodayRecord();
  }, [fetchStats, fetchTodayRecord]);

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

  const handlePunch = async (action: "clock-in" | "clock-out") => {
    setPunching(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        await fetchTodayRecord();
        await fetchStats();
        
        Swal.fire({
          title: action === "clock-in" ? "Checked In!" : "Checked Out!",
          text: action === "clock-in" 
            ? "Your start time has been recorded." 
            : "Your work hours for today have been updated.",
          icon: "success",
          confirmButtonColor: "#4f46e5",
          timer: 2000,
          timerProgressBar: true,
          customClass: {
            popup: 'rounded-lg'
          }
        });
      } else {
        const err = await res.json();
        Swal.fire("Error", err.error || "Failed to update record", "error");
      }
    } catch {
      Swal.fire("Error", "Check your internet connection", "error");
    } finally {
      setPunching(false);
    }
  };

  const statsData = [
    {
      label: "Total Hours",
      value: loading ? "..." : `${stats.totalHours}h`,
      icon: <Clock />,
      color: "blue" as const,
    },
    {
      label: "Days Worked",
      value: loading ? "..." : String(stats.presentDays),
      icon: <CheckCircle2 />,
      color: "green" as const,
    },
    {
      label: "Daily Average",
      value: loading ? "..." : `${stats.avgDailyHours}h`,
      icon: <Timer />,
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
              My Attendance
            </h1>
            <p className="text-sm text-content-secondary mt-1">
              Track your daily work hours and attendance history.
            </p>
          </div>
        </div>

        {/* Clock In/Out Card */}
        <div className="card p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-subtle flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-content-primary">Today&apos;s Status</h3>
                <p className="text-sm text-content-secondary">
                  {todayRecord?.clock_in 
                    ? (todayRecord?.clock_out ? 'Shift completed' : `Clocked in at ${new Date(todayRecord.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
                    : 'Not clocked in yet'}
                </p>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {!todayRecord?.clock_in ? (
                <motion.button
                  key="clock-in"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => handlePunch("clock-in")}
                  disabled={punching}
                  className="btn btn-primary"
                >
                  {punching ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  Clock In
                </motion.button>
              ) : !todayRecord?.clock_out ? (
                <motion.button
                  key="clock-out"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => handlePunch("clock-out")}
                  disabled={punching}
                  className="btn btn-error"
                >
                  {punching ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  Clock Out
                </motion.button>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="badge badge-success px-4 py-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-8">
          <StatsGrid stats={statsData} loading={loading} />
        </div>

        {/* History Table */}
        <div className="section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-content-primary flex items-center gap-3">
              <History className="w-5 h-5 text-primary" />
              Attendance History
            </h2>
            <span className="text-sm text-content-secondary">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          
          <div className="table-container">
            <AttendanceTable 
              mode="personal" 
              page={page} 
              pageSize={pageSize}
              onPageChange={(p) => updateQueryParams({ page: p })}
              onPageSizeChange={(s) => updateQueryParams({ pageSize: s, page: 1 })}
            />
          </div>
        </div>

        {/* Info Card */}
        <div className="card p-6 mt-8 bg-primary-subtle border-primary/20">
          <div className="flex items-start gap-4">
            <Calendar className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-content-primary mb-1">Attendance Tracking</h4>
              <p className="text-sm text-content-secondary">
                Your attendance is recorded automatically when you clock in and out. Make sure to clock out at the end of each work day to accurately track your hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
