"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FileText, Clock, Calendar, CheckCircle2, MessageSquare, Timer, ShieldCheck, ExternalLink, Activity as ActivityIcon } from "lucide-react";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { motion } from "framer-motion";
import { Pagination } from "@/components/ui/Pagination";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

interface Report {
  id: string;
  date: string;
  workDescription: string;
  hoursWorked: number;
  mentorFeedback: string;
  submittedAt: string;
}

export default function MyReportsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [reports, setReports] = useState<Report[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  const fetchData = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      
      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.items || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }, [session, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const totalHours = reports.reduce((acc, r) => acc + (r.hoursWorked || 0), 0);

  const statsData = [
    {
      label: "Total Reports",
      value: loading ? "..." : totalCount.toString(),
      icon: <FileText />,
      color: "blue" as const,
    },
    {
      label: "Active Hours",
      value: loading ? "..." : totalHours.toString(),
      icon: <Clock />,
      color: "green" as const,
    },
    {
      label: "Evaluated",
      value: loading ? "..." : reports.filter(r => !!r.mentorFeedback).length.toString(),
      icon: <ShieldCheck />,
      color: "purple" as const,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-12 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl font-extrabold text-content-primary tracking-tight uppercase">
              Activity <span className="text-indigo-600">Logs</span>
            </h1>
            <p className="text-content-secondary mt-1 font-medium italic">Chronological submission history and supervisor evaluations.</p>
          </div>
          <a 
            href="/dashboard/intern/submit-report" 
            className="btn btn-primary"
          >
            <ActivityIcon className="w-4 h-4" />
            Submit Daily Log
          </a>
        </div>

        <StatsGrid stats={statsData} loading={loading} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-indigo-600">
            <div className="premium-spinner mb-6"></div>
            <p className="text-sm font-black text-content-muted uppercase tracking-widest">Parsing Activity History...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-32 rounded-lg border-dashed border-2 border-border-subtle bg-surface-muted/20">
            <FileText className="w-20 h-20 text-content-muted mx-auto mb-8 opacity-20" />
            <h3 className="text-2xl font-black text-content-primary mb-2 uppercase tracking-tight">No Records Found</h3>
            <p className="text-content-muted max-w-sm mx-auto font-medium tracking-tight mb-8">You haven&apos;t submitted any activity reports yet. Begin tracking your progress today.</p>
            <a href="/dashboard/intern/submit-report" className="text-indigo-600 font-black hover:underline flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest">
                Submit first report <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="mt-8 space-y-12">
            <div className="bg-surface-card rounded-lg border border-border-subtle overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-muted/50 border-b border-border-subtle">
                      <th className="px-8 py-6 text-[10px] font-black text-content-muted uppercase tracking-[0.3em]">Log Timestamp</th>
                      <th className="px-6 py-6 text-[10px] font-black text-content-muted uppercase tracking-[0.3em]">Operational Summary</th>
                      <th className="px-6 py-6 text-[10px] font-black text-content-muted uppercase tracking-[0.3em]">Timeline</th>
                      <th className="px-8 py-6 text-[10px] font-black text-content-muted uppercase tracking-[0.3em] text-right">Review Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reports.map((report, idx) => (
                      <motion.tr 
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group transition-all duration-300 hover:bg-surface-muted/30 border-b border-gray-50 last:border-0"
                      >
                        <td className="px-8 py-8 align-top">
                           <div className="flex items-center gap-4 font-bold text-content-primary tracking-tight text-base group-hover:text-indigo-600 transition-colors uppercase">
                              <Calendar className="w-4 h-4 text-indigo-400" /> 
                              {report.date}
                           </div>
                        </td>
                        <td className="px-6 py-8 align-top">
                          <div className="max-w-xl space-y-5">
                            <div className="relative p-6 bg-surface-muted/50 rounded-lg border border-border-subtle group-hover:bg-surface-card group-hover:shadow-lg transition-all duration-300">
                                <p className="text-[9px] font-black text-content-muted uppercase tracking-widest mb-3">Work Description</p>
                                <p className="text-[13px] font-semibold text-content-secondary leading-relaxed italic">
                                  &quot;{report.workDescription}&quot;
                                </p>
                            </div>
                            {report.mentorFeedback && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="p-6 bg-emerald-50/50 rounded-lg border border-emerald-100/50 shadow-sm"
                                >
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                        <MessageSquare className="w-3.5 h-3.5" /> Supervisor Evaluation
                                    </p>
                                    <p className="text-[13px] font-bold text-emerald-800 leading-relaxed italic">
                                        &quot;{report.mentorFeedback}&quot;
                                    </p>
                                </motion.div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-8 align-top">
                          <span className="badge badge-primary">
                             <Timer className="w-4 h-4" />
                             {report.hoursWorked} HRS
                          </span>
                        </td>
                        <td className="px-8 py-8 align-top">
                          <div className="flex justify-end">
                            {report.mentorFeedback ? (
                              <div className="badge badge-success">
                                 <CheckCircle2 className="w-4 h-4" />
                                 <span className="text-[10px] font-black uppercase tracking-widest leading-none">Evaluated</span>
                              </div>
                            ) : (
                              <div className="badge badge-warning">
                                 <Timer className="w-4 h-4 animate-pulse" />
                                 <span className="text-[10px] font-black uppercase tracking-widest leading-none">Reviewing</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Pagination
                currentPage={page}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={(p) => updateQueryParams({ page: p })}
                onPageSizeChange={(s) => updateQueryParams({ pageSize: s, page: 1 })}
              />
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .premium-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </DashboardLayout>
  );
}
