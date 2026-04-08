"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Users, Building2, GraduationCap, ExternalLink, ShieldCheck, Activity, Search } from "lucide-react";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { Pagination } from "@/components/ui/Pagination";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface Intern {
  id: string;
  name: string;
  email: string;
  department: string;
  university?: string;
  collegeName?: string;
  startDate: string;
  endDate: string;
  status: string;
}

const DEPARTMENTS = ["AI", "ODOO", "JAVA", "MOBILE", "SAP", "QC", "PHP", "RPA"];

export default function MyInternsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [interns, setInterns] = useState<Intern[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // URL Persistent State
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const [filters, setFilters] = useState({ 
    name: searchParams.get("name") || "", 
    department: searchParams.get("department") || "" 
  });

  /**
   * Effect: Cross-Entity Data Synchronization
   * Fetches the global intern registry and filters specifically for 
   * individuals assigned to this mentor's leadership.
   */
  const fetchInterns = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const mentorId = (session?.user as { id: string })?.id;
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      
      // Note: API for interns needs to handle mentorId filter via query params if we want true server-side matching
      // For now, our /api/interns returns all but supports 'all=true'
      // To be industry ready, I'll pass mentorId to API if supported.
      params.set("mentorId", mentorId);
      if (filters.name) params.set("search", filters.name);
      if (filters.department) params.set("department", filters.department);

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
  }, [fetchInterns]);

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

  const clearFilters = () => {
    setFilters({ name: "", department: "" });
    router.push(pathname);
  };

  const filteredInterns = interns; // Server-side

  const statsData = [
    {
      label: "Total Interns",
      value: loading ? "..." : interns.length,
      icon: <Users />,
      color: "blue" as const,
    },
    {
      label: "Currently Active",
      value: loading ? "..." : interns.filter(i => i.status === 'active').length,
      icon: <Activity />,
      color: "green" as const,
    },
    {
      label: "Teams Covered",
      value: loading ? "..." : new Set(interns.map(i => i.department)).size,
      icon: <Building2 />,
      color: "purple" as const,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-content-primary tracking-tight">
              My Interns
            </h1>
            <p className="text-content-secondary mt-1 font-medium">Manage and track the performance of interns assigned to you.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black flex items-center gap-3 border border-indigo-100 uppercase tracking-widest shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              Mentor View
            </div>
          </div>
        </div>

        <StatsGrid stats={statsData} loading={loading} />

        {/* Filter Section */}
        <div className="bg-surface-card rounded-lg p-8 border border-border-subtle shadow-sm mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.2em] ml-1">Search Intern</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted group-focus-within:text-indigo-500 transition-colors" />
                 <input
                  type="text"
                  placeholder="Type a name to search..."
                  value={filters.name}
                  onChange={(e) => handleFilterChange("name", e.target.value)}
                  className="input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.2em] ml-1">Department</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange("department", e.target.value)}
                className="input"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="btn btn-primary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
              <p className="text-[10px] font-black text-content-muted uppercase tracking-widest opacity-40">Syncing Directory...</p>
            </div>
          ) : filteredInterns.length === 0 ? (
            <Card className="text-center py-24 rounded-lg border-dashed border-2 border-border-subtle bg-surface-muted/20">
              <Users className="w-16 h-16 text-content-muted mx-auto mb-6 opacity-40" />
              <h3 className="text-xl font-bold text-content-primary mb-2 tracking-tight opacity-40">No Records Found</h3>
            </Card>
          ) : (
            <div className="bg-surface-card rounded-lg border border-border-subtle overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-muted/50 border-b border-border-subtle">
                      <th className="px-8 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">Intern Information</th>
                      <th className="px-6 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">Department</th>
                      <th className="px-6 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">College/University</th>
                      <th className="px-6 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em] text-center">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredInterns.map((intern) => (
                      <tr key={intern.id} className="group transition-all duration-300 hover:bg-surface-muted/30">
                        <td className="px-8 py-4 min-w-[200px]">
                          <div className="flex items-center gap-4">
                            <div className="btn btn-primary">
                              {intern.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-content-primary group-hover:text-indigo-600 transition-colors">{intern.name}</span>
                              <span className="text-xs text-content-muted font-medium">{intern.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="badge badge-primary">
                            {intern.department}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5 font-bold text-xs text-content-secondary tracking-tight">
                            <GraduationCap className="w-4 h-4 text-indigo-400" />
                            {intern.collegeName || intern.university || "Organization"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            intern.status === 'active' ? 'badge badge-success' : 'badge badge-neutral'
                          }`}>
                            {intern.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end">
                            <button className="badge badge-primary">
                              <ExternalLink className="w-4 h-4" />
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
