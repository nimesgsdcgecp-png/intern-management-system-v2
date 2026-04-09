"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { TextArea } from "@/components/ui/TextArea";
import {
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  Eye,
  User,
} from "lucide-react";

interface Report {
  id: string;
  internId: string;
  date: string;
  title?: string;
  workDescription: string;
  hoursWorked: number;
  tasksCompleted?: string;
  challengesFaced?: string;
  mentorFeedback?: string;
  submittedAt: string;
}

interface Intern {
  id: string;
  name: string;
  email: string;
  mentorId?: string;
}

export default function MentorReportsPage() {
  const { data: session } = useSession();

  const [reports, setReports] = useState<Report[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [internMap, setInternMap] = useState<Map<string, Intern>>(new Map());
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const sortBy = "submitted_at";
  const sortOrder = "desc";

  const [filters, setFilters] = useState({
    search: "",
    internId: "",
    status: "all",
  });

  const fetchData = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const mentorId = (session.user as { id: string }).id;
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      if (filters.search) params.set("internName", filters.search);
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.internId) params.set("internId", filters.internId);

      const [internsRes, reportsRes] = await Promise.all([
        fetch("/api/interns?all=true"),
        fetch(`/api/reports?${params.toString()}`),
      ]);

      if (internsRes.ok && reportsRes.ok) {
        const internsData = await internsRes.json();
        const reportsData = await reportsRes.json();

        const allInterns = internsData.items || [];
        const myInterns = allInterns.filter((i: Intern) => i.mentorId === mentorId);
        setInterns(myInterns);

        const map = new Map<string, Intern>();
        myInterns.forEach((i: Intern) => map.set(i.id, i));
        setInternMap(map);

        const myReports = (reportsData.items || []).filter((r: Report) =>
          myInterns.some((i: Intern) => i.id === r.internId)
        );

        setReports(myReports);
        setTotalCount(myReports.length);
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setFeedback(report.mentorFeedback || "");
  };

  const handleSubmitFeedback = async () => {
    if (!selectedReport) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${selectedReport.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorFeedback: feedback }),
      });

      if (res.ok) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === selectedReport.id ? { ...r, mentorFeedback: feedback } : r
          )
        );
        setSelectedReport({ ...selectedReport, mentorFeedback: feedback });
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const totalReports = totalCount;
  const reviewedReports = reports.filter((r) => !!r.mentorFeedback).length;
  const pendingReports = totalReports - reviewedReports;
  const thisWeekReports = reports.filter((r) => {
    const d = new Date(r.date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const statsData = [
    {
      label: "Total Reports",
      value: totalReports,
      icon: <FileText className="w-6 h-6" />,
      color: "blue" as const,
    },
    {
      label: "Pending Review",
      value: pendingReports,
      icon: <Clock className="w-6 h-6" />,
      color: "yellow" as const,
    },
    {
      label: "Reviewed",
      value: reviewedReports,
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: "green" as const,
    },
    {
      label: "This Week",
      value: thisWeekReports,
      icon: <Calendar className="w-6 h-6" />,
      color: "purple" as const,
    },
  ];

  const getInternInfo = (internId: string) => {
    return internMap.get(internId) || { name: "Unknown", email: "" };
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Intern Reports</h1>
            <p className="text-sm text-content-secondary mt-1">
              Review and provide feedback on daily reports from your interns
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <StatsGrid stats={statsData} loading={loading} />

        {/* Filters */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="label">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
                <input
                  placeholder="Search intern name..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="input has-icon-left"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Intern</label>
              <select
                value={filters.internId}
                onChange={(e) => handleFilterChange("internId", e.target.value)}
                className="select"
              >
                <option value="">All Interns</option>
                {interns.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="select"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-content-muted">
            <div className="spinner w-12 h-12 mb-6"></div>
            <p className="text-lg font-medium tracking-tight">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <FileText className="w-16 h-16 text-content-muted mb-6" />
            <h3 className="empty-state-title">No reports found</h3>
            <p className="empty-state-description">No reports submitted yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Intern</th>
                    <th>Title</th>
                    <th>Hours</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => {
                    const intern = getInternInfo(report.internId);
                    return (
                      <tr key={report.id} className="group transition-all hover:bg-surface-muted">
                        <td>
                          <div className="flex items-center gap-2 text-sm font-bold text-content-primary">
                            <Calendar className="w-4 h-4 text-primary" />
                            {new Date(report.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar avatar-sm">
                              {intern.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-content-primary">{intern.name}</span>
                              <span className="text-xs text-content-muted">{intern.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="min-w-62.5">
                          <span className="text-sm font-semibold text-content-primary">
                            {report.title || "Daily Report"}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 text-sm font-semibold text-content-primary">
                            <Clock className="w-4 h-4 text-primary" />
                            {report.hoursWorked}h
                          </div>
                        </td>
                        <td className="text-center">
                          <span className={`badge ${report.mentorFeedback ? "badge-success" : "badge-warning"}`}>
                            {report.mentorFeedback ? "Reviewed" : "Pending"}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => handleViewReport(report)}
                            className="btn btn-ghost btn-icon-edit"
                            title="View report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border-subtle bg-surface-muted">
              <Pagination
                currentPage={page}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title="Report Review"
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-4">
                <div className="flex items-center gap-2 text-sm text-content-secondary mb-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </div>
                <p className="text-content-primary font-semibold">
                  {new Date(selectedReport.date).toLocaleDateString()}
                </p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-sm text-content-secondary mb-2">
                  <User className="w-4 h-4" />
                  Hours Worked
                </div>
                <p className="text-content-primary font-semibold">{selectedReport.hoursWorked}h</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-content-secondary">Work Description</h4>
              <div className="card p-6">
                <p className="text-sm text-content-primary leading-relaxed">
                  {selectedReport.workDescription || "No description provided."}
                </p>
              </div>
            </div>

            {selectedReport.tasksCompleted && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-content-secondary">Tasks Completed</h4>
                <div className="card p-6">
                  <p className="text-sm text-content-primary leading-relaxed">{selectedReport.tasksCompleted}</p>
                </div>
              </div>
            )}

            {selectedReport.challengesFaced && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-content-secondary">Challenges Faced</h4>
                <div className="card p-6">
                  <p className="text-sm text-content-primary leading-relaxed">{selectedReport.challengesFaced}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-content-secondary">Mentor Feedback</h4>
              {selectedReport.mentorFeedback ? (
                <div className="card p-6 bg-success-subtle">
                  <p className="text-sm text-content-primary leading-relaxed">{selectedReport.mentorFeedback}</p>
                </div>
              ) : (
                <TextArea
                  name="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  placeholder="Provide feedback for the intern..."
                />
              )}
            </div>

            {!selectedReport.mentorFeedback && (
              <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
                <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSubmitFeedback} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
