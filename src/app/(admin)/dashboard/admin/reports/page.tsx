"use client";

import { useEffect, useState, Fragment, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsGrid } from "@/components/ui/StatsGrid";
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
  Search
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  email: string;
  department: string;
  mentorId: string;
}

interface ReportFilters {
  internName: string;
  department: string;
  feedbackStatus: "all" | "pending" | "reviewed";
  dateFrom: string;
}

const DEPARTMENTS = ["AI", "ODOO", "JAVA", "MOBILE", "SAP", "QC", "PHP", "RPA"];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [internMap, setInternMap] = useState<Map<string, Intern>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Local Pagination & Sorting State (Hidden from URL)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("submitted_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const [filters, setFilters] = useState<ReportFilters>({
    internName: "",
    department: "",
    feedbackStatus: "all",
    dateFrom: "",
  });

  /**
   * Effect: Data Synchronization
   * Fetches the global registry of reports and interns to populate the dashboard.
   * Uses local state for pagination and filters to keep the URL clean.
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      if (filters.internName) params.set("internName", filters.internName);
      if (filters.department) params.set("department", filters.department);
      if (filters.feedbackStatus !== "all") params.set("status", filters.feedbackStatus);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);

      const [reportsRes, internsRes] = await Promise.all([
        fetch(`/api/reports?${params.toString()}`),
        fetch("/api/interns?all=true"),
      ]);

      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.items || []);
        setTotalCount(data.totalCount || 0);
      }
      if (internsRes.ok) {
        const internData = await internsRes.json();
        const map = new Map<string, Intern>();
        (internData.items || []).forEach((i: Intern) => map.set(i.id, i));
        setInternMap(map);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, filters]);

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

  /**
   * Logic: Multi-dimensional Filtering
   * Filters the report registry based on intern identity, department stream, 
   * review status, and historical date range.
   */
  const filteredReports = reports; // Server-side filtering
  const sortedReports = reports;   // Server-side sorting

  const totalReportsCount = totalCount;
  const reviewedReports = reports.filter((r) => !!r.mentorFeedback).length;

  const statsData = [
    {
      label: "Total Reports",
      value: totalReportsCount,
      icon: <FileText className="w-6 h-6" />,
      color: "blue" as const,
    },
    {
      label: "Reports Viewed",
      value: reports.length,
      icon: <Eye className="w-6 h-6" />,
      color: "purple" as const,
    },
    {
      label: "Reviewed Reports",
      value: reviewedReports,
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: "green" as const,
    },
  ];

  const getInternInfo = (internId: string) => {
    return internMap.get(internId) || { name: "Unknown", email: "", department: "N/A" };
  };

  const toggleExpand = (reportId: string) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add Title
      doc.setFontSize(18);
      doc.text("Intern Work Reports", 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

      const tableData = reports.map((report) => {
        const intern = getInternInfo(report.internId);
        return [
          formatDate(report.date),
          intern.name,
          intern.department,
          `${report.hoursWorked}h`,
          report.mentorFeedback ? "Verified" : "Pending Review"
        ];
      });

      autoTable(doc, {
        startY: 35,
        head: [["Date", "Intern Name", "Department", "Hours", "Status"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] }, // Brand Primary Color
        styles: { fontSize: 9 },
      });

      doc.save(`Intern_Reports_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("PDF Generation failed:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              Intern Reports
            </h1>
            <p className="text-sm text-content-secondary mt-1">Review and manage intern work reports.</p>
          </div>
          <div className="flex gap-4 no-print">
            <button
              onClick={handleExportPDF}
              className="btn btn-primary"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            .page-content { padding: 0 !important; margin: 0 !important; }
            .table-container { border: none !important; box-shadow: none !important; }
            .table th, .table td { border: 1px solid #e2e8f0 !important; padding: 12px !important; font-size: 10px !important; }
            h1 { font-size: 24px !important; margin-bottom: 20px !important; }
            .stats-grid { display: none !important; }
            tr { page-break-inside: avoid; }
          }
        `}</style>

        {/* Filter Section */}
        <div className="card p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="label">Search Intern</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted group-focus-within:text-primary transition-colors pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ex: John Doe"
                  value={filters.internName}
                  onChange={(e) => handleFilterChange("internName", e.target.value)}
                  className="input has-icon-left"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Department</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange("department", e.target.value)}
                className="select"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="label">Review Status</label>
              <select
                value={filters.feedbackStatus}
                onChange={(e) => handleFilterChange("feedbackStatus", e.target.value)}
                className="select"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="reviewed">Reviewed</option>
              </select>
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
          </div>
        </div>
        <div className="space-y-8">
          {/* Stats Grid */}
          <StatsGrid stats={statsData} loading={loading} />

          {/* Reports Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-content-muted">
              <div className="spinner w-12 h-12 mb-6"></div>
              <p className="text-lg font-medium tracking-tight">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="empty-state">
              <FileText className="w-16 h-16 text-content-muted mb-6" />
              <h3 className="empty-state-title">No reports found</h3>
              <p className="empty-state-description">
                {reports.length === 0
                  ? "No intern reports have been submitted yet."
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
                        aria-sort={sortBy === 'intern_id' ? (sortOrder as "ascending" | "descending") : undefined}
                        onClick={() => handleSort('intern_id')}
                      >
                        <div className="flex items-center gap-2">
                          Intern Name
                          {sortBy === 'intern_id' ? (
                            sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-content-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th>Department</th>
                      <th 
                        aria-sort={sortBy === 'report_date' ? (sortOrder as "ascending" | "descending") : undefined}
                        onClick={() => handleSort('report_date')}
                      >
                        <div className="flex items-center gap-2">
                          Date
                          {sortBy === 'report_date' ? (
                            sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-content-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
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
                      <th className="text-right no-print">Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedReports.map((report) => {
                      const intern = getInternInfo(report.internId);
                      const isExpanded = expandedReportId === report.id;

                      return (
                        <Fragment key={report.id}>
                          <tr>
                            <td className="min-w-62.5">
                              <div className="flex items-center gap-4">
                                <div className="avatar avatar-md font-bold">
                                  {intern.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-content-primary text-base tracking-tight">{intern.name}</span>
                                  <span className="text-xs text-content-muted font-medium">{intern.email}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-primary">
                                {intern.department}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2.5 text-sm font-bold text-content-primary">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span>{formatDate(report.date)}</span>
                              </div>
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
                                {report.mentorFeedback ? "Verified" : "Pending Review"}
                              </span>
                            </td>
                            <td className="text-right no-print">
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
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                      <h4 className="text-xs font-semibold text-content-secondary flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" /> Work Description
                                      </h4>
                                    </div>
                                    <div className="card p-8 min-h-35 relative overflow-hidden">
                                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-20" />
                                      <p className="text-sm text-content-primary leading-relaxed font-medium relative z-10">
                                        &quot;{report.workDescription || "No detailed logs synthesized."}&quot;
                                      </p>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                      <h4 className="text-xs font-semibold text-content-secondary flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-success" /> Mentor Feedback
                                      </h4>
                                    </div>
                                    <div className={`card p-8 min-h-35 relative overflow-hidden ${
                                        report.mentorFeedback ? "bg-success-subtle" : "bg-warning-subtle"
                                      }`}>
                                      <div className={`absolute top-0 left-0 w-1.5 h-full opacity-30 ${report.mentorFeedback ? 'bg-success' : 'bg-warning'}`} />
                                      <p className="text-sm text-content-primary leading-relaxed font-medium relative z-10">
                                        {report.mentorFeedback || "Waiting for mentor session authentication."}
                                      </p>
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
      </div>
    </DashboardLayout>
  );
}
