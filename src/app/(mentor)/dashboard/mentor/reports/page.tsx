"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { FileText, Clock, ShieldCheck, Timer, Search, Calendar, Loader2, ClipboardCheck, Gauge } from "lucide-react";
import { StatsGrid } from "@/components/ui/StatsGrid";
import Swal from "sweetalert2";
import { Pagination } from "@/components/ui/Pagination";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface Report {
  id: string;
  internId: string;
  date: string;
  workDescription: string;
  hoursWorked: number;
  mentorFeedback: string;
  submittedAt: string;
}

interface Intern {
  id: string;
  name: string;
  mentorId?: string;
}

export default function MentorReportsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [reports, setReports] = useState<Report[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [interns, setInterns] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [feedbackData, setFeedbackData] = useState<Record<string, string>>({});
  const [submittingFeedback, setSubmittingFeedback] = useState<Record<string, boolean>>({});
  const [emailNotifications, setEmailNotifications] = useState<Record<string, boolean>>({});
  
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const sortBy = searchParams.get("sortBy") || "submitted_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const [filters, setFilters] = useState({ 
    internName: searchParams.get("internName") || "", 
    feedbackStatus: searchParams.get("feedbackStatus") || "" 
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  /**
   * Effect: Relational Data Mapping
   * Synchronizes intern profiles and work reports, establishing a 
   * mentor-centric view of all submitted technical documentation.
   */
  const fetchData = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const mentorId = (session?.user as { id: string })?.id;
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      
      if (filters.internName) params.set("internName", filters.internName);
      if (filters.feedbackStatus) params.set("status", filters.feedbackStatus);

      const [internsRes, reportsRes] = await Promise.all([
        fetch("/api/interns?all=true"),
        fetch(`/api/reports?${params.toString()}`),
      ]);

      if (internsRes.ok && reportsRes.ok) {
        const internsData = await internsRes.json();
        const reportsData = await reportsRes.json();

        // Get assigned interns
        const allInterns = internsData.items || [];
        const myInterns = allInterns.filter((i: Intern) => i.mentorId === mentorId);

        // Create intern map
        const internMap = new Map<string, string>();
        myInterns.forEach((i: Intern) => {
          internMap.set(i.id, i.name);
        });
        setInterns(internMap);

        setReports(reportsData.items || []);
        setTotalCount(reportsData.totalCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [session, page, pageSize, sortBy, sortOrder, filters]);

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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    updateQueryParams({ [key]: value, page: 1 });
  };

  const handleFeedbackChange = (reportId: string, feedback: string) => {
    setFeedbackData({
      ...feedbackData,
      [reportId]: feedback,
    });
  };

  /**
   * Logic: Feedback Synchronization
   * Publishes mentor evaluations for specific work reports.
   * Supports asynchronous submission with optional email broadcast.
   */
  const handleSubmitFeedback = async (reportId: string) => {
    const feedback = feedbackData[reportId]?.trim();

    if (!feedback) {
      Swal.fire("Required", "Please enter feedback before submitting.", "info");
      return;
    }

    setSubmittingFeedback(prev => ({ ...prev, [reportId]: true }));

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorFeedback: feedback,
          sendEmail: !!emailNotifications[reportId],
        }),
      });

      if (res.ok) {
        const updatedReports = reports.map((r) =>
          r.id === reportId
            ? { ...r, mentorFeedback: feedback }
            : r
        );
        setReports(updatedReports);
        setFeedbackData({ ...feedbackData, [reportId]: "" });
        Swal.fire("Feedback Submitted", "Your feedback has been recorded successfully.", "success");
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        Swal.fire("Error", errorData.error || "Failed to submit feedback", "error");
      }
    } catch {
      Swal.fire("Error", "Check your internet connection", "error");
    } finally {
      setSubmittingFeedback(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const filteredReports = reports;

  const totalHoursReviewed = reports.filter(r => !!r.mentorFeedback).reduce((acc, r) => acc + (r.hoursWorked || 0), 0);
  const pendingFeedbackCount = reports.filter(r => !r.mentorFeedback).length;

  const statsData = [
    {
      label: "Total Reports",
      value: loading ? "..." : reports.length,
      icon: <FileText />,
      color: "blue" as const,
    },
    {
      label: "Needs Feedback",
      value: loading ? "..." : pendingFeedbackCount,
      icon: <Clock />,
      color: "yellow" as const,
    },
    {
      label: "Hours Reviewed",
      value: loading ? "..." : totalHoursReviewed,
      icon: <Timer />,
      color: "green" as const,
    },
    {
      label: "Avg. Hours/Report",
      value: loading ? "..." : reports.length > 0 ? (reports.reduce((acc, r) => acc + (r.hoursWorked || 0), 0) / reports.length).toFixed(1) : "0",
      icon: <Gauge />,
      color: "purple" as const,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-12 pb-20">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-content-primary tracking-tight">
              Review Reports
            </h1>
            <p className="text-content-secondary mt-1 font-medium">Review and provide feedback for work reports submitted by your interns.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black flex items-center gap-3 border border-indigo-100 uppercase tracking-widest shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              Reviewer Access Enabled
            </div>
          </div>
        </div>

        <StatsGrid stats={statsData} loading={loading} />


        {/* Filter Section */}
        <div className="bg-surface-card rounded-lg p-8 border border-border-subtle shadow-sm mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.2em] ml-1">Search by Intern Name</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                 <input
                  placeholder="Type intern name..."
                  value={filters.internName}
                  onChange={(e) => handleFilterChange("internName", e.target.value)}
                  className="input has-icon-left"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.2em] ml-1">Current Status</label>
              <select
                value={filters.feedbackStatus}
                onChange={(e) => handleFilterChange("feedbackStatus", e.target.value)}
                className="input"
              >
                <option value="">All Reports</option>
                <option value="pending">Needs Review</option>
                <option value="reviewed">Already Reviewed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-indigo-600">
              <div className="premium-spinner mb-6"></div>
              <p className="text-sm font-black text-content-muted uppercase tracking-widest">Loading records...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="text-center py-24 rounded-lg border-dashed border-2 border-border-subtle bg-surface-muted/20">
              <FileText className="w-16 h-16 text-content-muted mx-auto mb-6 opacity-40" />
              <h3 className="text-xl font-bold text-content-primary mb-2 tracking-tight">No Reports Found</h3>
              <p className="text-content-secondary max-w-sm mx-auto font-medium tracking-tight">There are no reports matching your current filter settings.</p>
            </Card>
          ) : (
            <>
              <div className="bg-surface-card rounded-lg border border-border-subtle overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-muted/50 border-b border-border-subtle">
                        <th className="px-8 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">Intern Information</th>
                        <th className="px-6 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">Submitted Date</th>
                        <th className="px-6 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">Work Hours</th>
                        <th className="px-6 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em] text-center">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredReports.map((report) => (
                        <tr key={report.id} className="group transition-all duration-300 hover:bg-surface-muted/30">
                          <td className="px-8 py-4 min-w-[200px]">
                            <div className="flex items-center gap-4">
                              <div className="btn btn-primary">
                                {interns.get(report.internId)?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-content-primary group-hover:text-indigo-600 transition-colors tracking-tight text-base">{interns.get(report.internId)}</span>
                                <span className="text-xs text-content-muted font-medium">Performance Analyst</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5 font-bold text-xs text-content-secondary tracking-tight">
                              <Calendar className="w-4 h-4 text-indigo-400" />
                              {new Date(report.submittedAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="badge badge-primary">
                              <Timer className="w-3.5 h-3.5" />
                              {report.hoursWorked} HRS
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              report.mentorFeedback ? 'badge badge-success' : 'badge badge-warning'
                            }`}>
                              {report.mentorFeedback ? "Reviewed" : "Pending"}
                            </span>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex justify-end">
                              <button 
                                onClick={() => setSelectedReport(report)}
                                className="btn btn-primary"
                              >
                                {report.mentorFeedback ? "View Details" : "Review"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={page}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={(p) => updateQueryParams({ page: p })}
                  onPageSizeChange={(s) => updateQueryParams({ pageSize: s, page: 1 })}
                />
              </div>

              {/* Modal for detail view */}
              {selectedReport && (
                <Modal
                  isOpen={!!selectedReport}
                  onClose={() => setSelectedReport(null)}
                  title={selectedReport.mentorFeedback ? "Report Details" : "Review Work Report"}
                  size="lg"
                >
                   <div className="space-y-10">
                     <div className="flex items-center gap-6 p-8 bg-surface-muted rounded-lg border border-border-subtle group hover:shadow-xl transition-all duration-500">
                        <div className="btn btn-primary">
                          {interns.get(selectedReport.internId)?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-content-primary tracking-tighter uppercase">{interns.get(selectedReport.internId)}</h3>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                             <p className="text-[10px] font-black text-content-muted uppercase tracking-widest">Submitted on {new Date(selectedReport.submittedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.2em] ml-1 block">Work Description</label>
                        <div className="p-8 bg-surface-muted rounded-lg border border-border-subtle text-content-secondary leading-relaxed text-sm shadow-sm relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
                              <FileText className="w-24 h-24" />
                           </div>
                           <p className="relative z-10">&quot;{selectedReport.workDescription}&quot;</p>
                        </div>
                     </div>

                     {selectedReport.mentorFeedback ? (
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-1 block">Mentor Feedback</label>
                          <div className="p-8 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-900 leading-relaxed text-sm shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                               <ClipboardCheck className="w-24 h-24" />
                            </div>
                            <p className="relative z-10 font-bold">&quot;{selectedReport.mentorFeedback}&quot;</p>
                          </div>
                        </div>
                     ) : (
                        <div className="space-y-8">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.2em] ml-1 block">Provide Feedback</label>
                            <textarea
                              value={feedbackData[selectedReport.id] || ""}
                              onChange={(e) => handleFeedbackChange(selectedReport.id, e.target.value)}
                              placeholder="Write constructive feedback to help your intern grow..."
                              rows={5}
                              className="w-full rounded-lg p-8 border border-border-subtle bg-surface-muted text-content-primary text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none shadow-sm"
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                             <label className="flex items-center gap-4 cursor-pointer p-4 px-6 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 group w-full sm:w-auto">
                                <input
                                  type="checkbox"
                                  checked={!!emailNotifications[selectedReport.id]}
                                  onChange={(e) => setEmailNotifications({ ...emailNotifications, [selectedReport.id]: e.target.checked })}
                                  className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                                />
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-content-primary uppercase tracking-tight">Email Notify</span>
                                  <span className="text-[9px] font-bold text-content-muted uppercase tracking-widest leading-none">Inform intern via mail</span>
                                </div>
                             </label>

                             <button
                               onClick={() => {
                                 handleSubmitFeedback(selectedReport.id);
                                 setSelectedReport(null);
                               }}
                               disabled={submittingFeedback[selectedReport.id] || !feedbackData[selectedReport.id]?.trim()}
                               className="btn btn-primary w-full"
                             >
                               {submittingFeedback[selectedReport.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                               Submit Feedback
                             </button>
                          </div>
                        </div>
                     )}
                  </div>
                </Modal>
              )}
            </>
          )}
        </div>
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
