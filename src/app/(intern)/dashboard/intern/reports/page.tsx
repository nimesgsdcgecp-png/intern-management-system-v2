"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  FileText, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Search,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { Pagination } from "@/components/ui/Pagination";
import { useSession } from "next-auth/react";

interface Report {
  id: string;
  date: string;
  title?: string;
  workDescription: string;
  tasksCompleted?: string;
  challenges?: string;
  hoursWorked: number;
  mentorFeedback: string;
  submittedAt: string;
}

interface ReportFilters {
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
  status: "all" | "pending" | "reviewed";
}

export default function MyReportsPage() {
  const { data: session } = useSession();

  const [reports, setReports] = useState<Report[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Local state for pagination and sorting (not in URL)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const [filters, setFilters] = useState<ReportFilters>({
    searchQuery: "",
    dateFrom: "",
    dateTo: "",
    status: "all",
  });

  const fetchData = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      if (filters.searchQuery) params.set("search", filters.searchQuery);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.status !== "all") params.set("status", filters.status);
      
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
  }, [session, page, pageSize, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const handleSort = (key: string) => {
    const direction = sortBy === key && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(key);
    setSortOrder(direction);
  };

  const toggleExpand = (reportId: string) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Calculate stats
  const totalReportsCount = totalCount;
  const pendingReports = reports.filter(r => !r.mentorFeedback).length;
  const reviewedReports = reports.filter(r => !!r.mentorFeedback).length;
  
  // Calculate this week's reports
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  const thisWeekReports = reports.filter(r => {
    const reportDate = new Date(r.date);
    return reportDate >= startOfWeek;
  }).length;

  const statsData = [
    {
      label: "Total Reports",
      value: loading ? "..." : totalReportsCount.toString(),
      icon: <FileText className="w-6 h-6" />,
      color: "blue" as const,
    },
    {
      label: "Pending Review",
      value: loading ? "..." : pendingReports.toString(),
      icon: <Clock className="w-6 h-6" />,
      color: "warning" as const,
    },
    {
      label: "Reviewed",
      value: loading ? "..." : reviewedReports.toString(),
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: "green" as const,
    },
    {
      label: "This Week",
      value: loading ? "..." : thisWeekReports.toString(),
      icon: <Calendar className="w-6 h-6" />,
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
              My Reports
            </h1>
            <p className="text-sm text-content-secondary mt-1">
              View your submitted daily reports and mentor feedback
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          <StatsGrid stats={statsData} loading={loading} />
        </div>

        {/* Filter Bar */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="label">Search by Title/Description</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted group-focus-within:text-primary transition-colors pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
                  className="input has-icon-left"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Date From</label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  className="input has-icon-left cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Date To</label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  className="input has-icon-left cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value as "all" | "pending" | "reviewed")}
                className="select"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-content-muted">
            <div className="spinner w-12 h-12 mb-6"></div>
            <p className="text-lg font-medium tracking-tight">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <FileText className="w-16 h-16 text-content-muted mb-6" />
            <h3 className="empty-state-title">No reports found</h3>
            <p className="empty-state-description">
              {totalCount === 0
                ? "You haven't submitted any reports yet."
                : "Try adjusting your filters to see more results."}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th 
                      aria-sort={sortBy === 'date' ? (sortOrder as "ascending" | "descending") : undefined}
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        {sortBy === 'date' ? (
                          sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-content-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </th>
                    <th>Title</th>
                    <th 
                      aria-sort={sortBy === 'hours_worked' ? (sortOrder as "ascending" | "descending") : undefined}
                      onClick={() => handleSort('hours_worked')}
                    >
                      <div className="flex items-center gap-2">
                        Hours Worked
                        {sortBy === 'hours_worked' ? (
                          sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-content-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Mentor Feedback</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => {
                    const isExpanded = expandedReportId === report.id;
                    const displayTitle = report.title || report.workDescription?.substring(0, 50) + "...";

                    return (
                      <Fragment key={report.id}>
                        <tr>
                          <td>
                            <div className="flex items-center gap-2.5 text-sm font-bold text-content-primary">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span>{formatDate(report.date)}</span>
                            </div>
                          </td>
                          <td className="min-w-50">
                            <span className="font-bold text-content-primary text-sm">
                              {displayTitle}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-primary" />
                              <span className="text-sm font-bold text-primary">
                                {report.hoursWorked}h
                              </span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${report.mentorFeedback ? "badge-success" : "badge-warning"}`}>
                              {report.mentorFeedback ? "Reviewed" : "Pending"}
                            </span>
                          </td>
                          <td className="text-center">
                            {report.mentorFeedback ? (
                              <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <Clock className="w-5 h-5 text-warning mx-auto" />
                            )}
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => toggleExpand(report.id)}
                              className={`btn btn-sm ${isExpanded ? 'btn-primary' : 'btn-secondary'}`}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="px-0 sm:px-8 py-8 animate-fade-in-up">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                                {/* Left Column */}
                                <div className="space-y-6">
                                  {/* Date and Hours */}
                                  <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-content-secondary flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-primary" /> Report Details
                                    </h4>
                                    <div className="card p-6">
                                      <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-medium text-content-secondary">Date:</span>
                                        <span className="text-sm font-bold text-content-primary">{formatDate(report.date)}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-content-secondary">Hours Worked:</span>
                                        <span className="text-sm font-bold text-primary">{report.hoursWorked}h</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Work Description */}
                                  <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-content-secondary flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-primary" /> Work Description
                                    </h4>
                                    <div className="card p-6 min-h-30 relative overflow-hidden">
                                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-20" />
                                      <p className="text-sm text-content-primary leading-relaxed font-medium relative z-10">
                                        {report.workDescription || "No description provided."}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Tasks Completed */}
                                  {report.tasksCompleted && (
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-semibold text-content-secondary flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-success" /> Tasks Completed
                                      </h4>
                                      <div className="card p-6 min-h-25 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-success opacity-20" />
                                        <p className="text-sm text-content-primary leading-relaxed font-medium relative z-10">
                                          {report.tasksCompleted}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                  {/* Challenges */}
                                  {report.challenges && (
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-semibold text-content-secondary flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-warning" /> Challenges Faced
                                      </h4>
                                      <div className="card p-6 min-h-25 relative overflow-hidden bg-warning-subtle">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-warning opacity-30" />
                                        <p className="text-sm text-content-primary leading-relaxed font-medium relative z-10">
                                          {report.challenges}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Mentor Feedback */}
                                  <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-content-secondary flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-success" /> Mentor Feedback
                                    </h4>
                                    <div className={`card p-6 min-h-35 relative overflow-hidden ${
                                      report.mentorFeedback ? "bg-success-subtle" : "bg-warning-subtle"
                                    }`}>
                                      <div className={`absolute top-0 left-0 w-1.5 h-full opacity-30 ${
                                        report.mentorFeedback ? 'bg-success' : 'bg-warning'
                                      }`} />
                                      <p className="text-sm text-content-primary leading-relaxed font-medium relative z-10">
                                        {report.mentorFeedback || "Awaiting mentor review..."}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
