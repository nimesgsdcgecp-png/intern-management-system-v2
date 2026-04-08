"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AttendanceTable } from "@/components/features/AttendanceTable";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { Clock, Calendar, CheckCircle2, History, Timer, Loader2, LogIn, LogOut, ShieldCheck } from "lucide-react";
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
      <div className="space-y-12 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl font-extrabold text-content-primary tracking-tight uppercase">
              Work <span className="text-indigo-600">History</span>
            </h1>
            <p className="text-content-secondary mt-1 font-medium italic">Track chronological records and performance metrics.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black flex items-center gap-3 border border-indigo-100 uppercase tracking-widest shadow-sm">
                <ShieldCheck className="w-4 h-4" />
                WORKSPACE ACCESS VERIFIED
             </div>
          </div>
        </div>

        <div className="bg-surface-card rounded-lg p-10 border border-border-subtle shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group">
          <div className="flex items-center gap-6">
            <div className="badge badge-primary">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-content-primary tracking-tighter uppercase">Operational Status</h3>
              <p className="text-[10px] font-black text-content-muted uppercase tracking-widest leading-none mt-1">Status: {todayRecord?.clock_in ? (todayRecord?.clock_out ? 'Complete' : 'Active') : 'Inactive'}</p>
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
                  className="badge badge-success"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Cycle Completed
                </motion.div>
            )}
          </AnimatePresence>
        </div>

        <StatsGrid stats={statsData} loading={loading} />

        <div className="space-y-8">
            <div className="flex items-center justify-between px-4">
                <h2 className="text-xl font-black text-content-primary uppercase tracking-tight flex items-center gap-3">
                   <History className="w-6 h-6 text-indigo-600" />
                   Attendance Ledger
                </h2>
                <div className="text-[10px] font-black text-content-muted uppercase tracking-widest bg-surface-muted px-6 py-3 rounded-full border border-border-subtle shadow-sm">
                   PERIOD: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
            </div>
            
            <div className="rounded-lg border border-border-subtle overflow-hidden shadow-sm bg-surface-card p-8">
               <AttendanceTable 
                 mode="personal" 
                 page={page} 
                 pageSize={pageSize}
                 onPageChange={(p) => updateQueryParams({ page: p })}
                 onPageSizeChange={(s) => updateQueryParams({ pageSize: s, page: 1 })}
               />
            </div>
        </div>

        <div className="bg-indigo-50/30 p-10 rounded-lg border border-indigo-100/50 group relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
              <Calendar className="w-32 h-32 text-indigo-600" />
           </div>
           <div className="flex items-start gap-8 relative z-10">
              <div className="p-5 bg-surface-card rounded-lg text-indigo-600 shadow-xl  border border-indigo-100 group-hover:rotate-6 transition-transform">
                 <Calendar className="w-8 h-8" />
              </div>
              <div>
                 <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-[0.2em] mb-4">Precision Logging Protocol</h4>
                 <p className="text-[13px] text-indigo-900/60 font-semibold leading-relaxed max-w-3xl">
                    Your temporal activity is synchronized in real-time with the central governance system. Ensure precise logging intervals to maintain accurate productivity metrics for final certification. 
                 </p>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
