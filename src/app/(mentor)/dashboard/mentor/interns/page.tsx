"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Pagination } from "@/components/ui/Pagination";
import { QuickViewModal } from "@/components/features/QuickViewModal";
import {
  Users,
  Building2,
  GraduationCap,
  Search,
  List,
  Grid,
  Eye,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Intern {
  id: string;
  name: string;
  email: string;
  department: string;
  university?: string;
  collegeName?: string;
  startDate: string;
  endDate?: string;
  status: string;
  needsProfileApproval?: boolean;
}

interface Department {
  id: string;
  name: string;
}

export default function MyInternsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [interns, setInterns] = useState<Intern[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [quickViewEntity, setQuickViewEntity] = useState<{ id: string; type: "intern" | "mentor" | "task" } | null>(null);

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const [filters, setFilters] = useState({
    name: searchParams.get("name") || "",
    department: searchParams.get("department") || "",
    status: searchParams.get("status") || "",
  });

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  }, []);

  const fetchInterns = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const mentorId = (session.user as { id: string }).id;
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("mentorId", mentorId);
      if (filters.name) params.set("name", filters.name);
      if (filters.department) params.set("department", filters.department);
      if (filters.status) params.set("status", filters.status);

      const res = await fetch(`/api/interns?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInterns(data.items || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch interns:", error);
    } finally {
      setLoading(false);
    }
  }, [session, page, pageSize, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchInterns();
    fetchDepartments();
    const savedView = localStorage.getItem("mentorInternViewMode");
    if (savedView === "table" || savedView === "grid") {
      setViewMode(savedView as "table" | "grid");
    }
  }, [fetchInterns, fetchDepartments]);

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
    setFilters((prev) => ({ ...prev, [key]: value }));
    updateQueryParams({ [key]: value, page: 1 });
  };

  const handleClearFilters = () => {
    setFilters({ name: "", department: "", status: "" });
    updateQueryParams({ name: null, department: null, status: null, page: 1 });
  };

  const handleToggleView = (mode: "table" | "grid") => {
    setViewMode(mode);
    localStorage.setItem("mentorInternViewMode", mode);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">My Interns</h1>
            <p className="text-sm text-content-secondary mt-1">
              Manage and monitor interns assigned to you
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-muted p-1 rounded-lg border border-border-default">
              <button
                onClick={() => handleToggleView("table")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "table"
                    ? "bg-surface-card text-primary shadow-subtle"
                    : "text-content-disabled hover:text-content-secondary"
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleToggleView("grid")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-surface-card text-primary shadow-subtle"
                    : "text-content-disabled hover:text-content-secondary"
                }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="label">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
                <input
                  placeholder="Search name or email..."
                  value={filters.name}
                  onChange={(e) => handleFilterChange("name", e.target.value)}
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
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
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
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="terminated">Terminated</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="label">Actions</label>
              <button className="btn btn-secondary w-full" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-content-muted">
            <div className="spinner w-12 h-12 mb-6"></div>
            <p className="text-lg font-medium tracking-tight">Loading interns...</p>
          </div>
        ) : interns.length === 0 ? (
          <div className="empty-state">
            <GraduationCap className="w-16 h-16 text-content-muted mb-6" />
            <h3 className="empty-state-title">No interns found</h3>
            <p className="empty-state-description">No interns are currently assigned to you.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {interns.map((intern) => (
              <div
                key={intern.id}
                className="card card-interactive p-6 h-full"
                onClick={() => setQuickViewEntity({ id: intern.id, type: "intern" })}
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="avatar avatar-lg">
                    {intern.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <button className="btn btn-ghost btn-sm btn-icon-edit relative">
                    {intern.needsProfileApproval && (
                      <span
                        className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-500 border border-white"
                        title="Profile approval pending"
                      />
                    )}
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 mb-6">
                  <h4 className="text-lg font-semibold text-content-primary truncate">{intern.name}</h4>
                  <p className="text-sm text-content-secondary truncate">{intern.email}</p>
                  <span className="badge badge-primary">{intern.department}</span>
                </div>
                <div className="space-y-3 text-sm text-content-secondary">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-content-muted" />
                    <span>{intern.collegeName || intern.university || "Not set"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-content-muted" />
                    <span className={`badge ${intern.status === "active" ? "badge-success" : "badge-neutral"}`}>
                      {intern.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>College</th>
                    <th>Start Date</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interns.map((intern) => (
                    <tr key={intern.id} className="group transition-all hover:bg-surface-muted">
                      <td className="min-w-62.5">
                        <div className="flex items-center gap-4">
                          <div className="avatar avatar-md font-bold">
                            {intern.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-content-primary text-base tracking-tight">
                              {intern.name}
                            </span>
                            <span className="text-xs text-content-muted font-medium">{intern.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">{intern.department}</span>
                      </td>
                      <td>
                        <span className="text-sm text-content-secondary">
                          {intern.collegeName || intern.university || "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-content-secondary">
                          {intern.startDate ? new Date(intern.startDate).toLocaleDateString() : "N/A"}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${intern.status === "active" ? "badge-success" : "badge-neutral"}`}>
                          {intern.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setQuickViewEntity({ id: intern.id, type: "intern" })}
                          className="btn btn-ghost btn-icon-edit relative"
                          title="View"
                        >
                          {intern.needsProfileApproval && (
                            <span
                              className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-white"
                              title="Profile approval pending"
                            />
                          )}
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border-subtle bg-surface-muted">
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

      <QuickViewModal
        isOpen={!!quickViewEntity}
        onClose={() => setQuickViewEntity(null)}
        entityId={quickViewEntity?.id || null}
        entityType={quickViewEntity?.type || null}
      />
    </DashboardLayout>
  );
}
