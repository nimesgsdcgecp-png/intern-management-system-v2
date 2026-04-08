"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AttendanceTable } from "@/components/features/AttendanceTable";
import { useState, useEffect, useCallback } from "react";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { useSession } from "next-auth/react";
import { Clock, CheckCircle2, ShieldCheck, Calendar, Users, Activity, Filter, RefreshCw } from "lucide-react";
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

  const DEPARTMENTS = ["AI", "ODOO", "JAVA", "MOBILE", "SAP", "QC", "PHP", "RPA"];

  return (
    <DashboardLayout>
      <div className="space-y-12 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl font-extrabold text-content-primary tracking-tight uppercase">
              Attendance <span className="text-indigo-600">Monitor</span>
            </h1>
            <p className="text-content-secondary mt-1 font-medium italic">
              {isMentor ? "Tracking daily attendance for your department." : "Overview of intern attendance across all departments."}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black flex items-center gap-3 border border-indigo-100 uppercase tracking-widest shadow-sm">
                <ShieldCheck className="w-4 h-4" />
                {isMentor ? "MENTOR" : "ADMIN"}
             </div>
          </div>
        </div>

        <StatsGrid stats={statsData} loading={loading} />

        <div className="bg-surface-card rounded-lg p-10 border border-border-subtle shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Filter className="w-32 h-32 text-indigo-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end relative z-10">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.2em] ml-1">Select Date</label>
               <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => updateQueryParams({ date: e.target.value, page: 1 })}
                    className="input"
                  />
               </div>
            </div>

            {!isMentor ? (
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.2em] ml-1">Sector Filter</label>
                 <select
                   value={department}
                   onChange={(e) => updateQueryParams({ department: e.target.value, page: 1 })}
                   className="input"
                 >
                   <option value="">All Operational Streams</option>
                   {DEPARTMENTS.map(d => <option key={d} value={d}>{d} DIVISION</option>)}
                 </select>
              </div>
            ) : (
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.2em] ml-1">Active Division</label>
                 <div className="badge badge-primary">
                   {department || "N/A"}
                   <ShieldCheck className="w-4 h-4" />
                 </div>
              </div>
            )}
            
            <button 
              onClick={() => { 
                updateQueryParams({ 
                  date: new Date().toISOString().split('T')[0], 
                  department: "",
                  page: 1 
                }); 
              }}
              className="btn btn-primary"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Filters
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between px-4">
             <h2 className="text-xl font-black text-content-primary uppercase tracking-tight flex items-center gap-4">
                <Users className="w-7 h-7 text-indigo-600" />
                Attendance Records
             </h2>
             <div className="text-[10px] font-black text-content-muted uppercase tracking-widest bg-surface-card shadow-sm px-6 py-3 rounded-full border border-border-subtle italic">
                Active Cycle: {new Date(date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
             </div>
          </div>
          
          <div className="rounded-lg border border-border-subtle overflow-hidden bg-surface-card shadow-sm hover:shadow-2xl transition-all duration-700">
             <div className="p-10">
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
      </div>
    </DashboardLayout>
  );
}
