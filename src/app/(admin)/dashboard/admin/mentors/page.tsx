"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  Users, Search, Mail, 
  Phone, Trash2, Edit3, 
  PlusCircle, Grid, List,
  ArrowUpDown, ChevronUp, ChevronDown
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { showToast } from "@/lib/notifications";
import { Pagination } from "@/components/ui/Pagination";
import { BulkActionBar } from "@/components/features/BulkActionBar";
import { downloadCSV } from "@/lib/utils/csv-utils";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

interface Mentor {
  id: string;
  name: string;
  email: string;
  department: string;
  phone?: string;
  status?: string;
}

const DEPARTMENTS = ["AI", "ODOO", "JAVA", "MOBILE", "SAP", "QC", "PHP", "RPA"];

export default function AdminMentorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "AI",
    phone: "",
    role: "mentor"
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc" as "asc" | "desc");
  const [viewMode, setViewMode] = useState("list" as "grid" | "list");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (search) params.set("search", search);
      if (departmentFilter) params.set("department", departmentFilter);
      
      const res = await fetch(`/api/mentors?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMentors(data.items || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch {
      showToast("Sync failed", "error");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, departmentFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing 
        ? `/api/mentors/${selectedMentorId}` 
        : "/api/auth/users";
      
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast(isEditing ? "Updated" : "Account Created", "success");
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Execution failed", "error");
      }
    } catch {
      showToast("Service interruption", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Remove Mentor?",
      text: "This mentor and their assigned status will be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#1e293b",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Delete Mentor"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/mentors/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Success", "success");
        setSelectedIds(prev => prev.filter(i => i !== id));
        fetchData();
      }
    } catch {
        showToast("Access error", "error");
    }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: "Bulk Removal",
      text: `Are you sure you want to remove ${selectedIds.length} mentors?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm Deletion"
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/mentors/${id}`, { method: "DELETE" })));
      setSelectedIds([]);
      showToast("Bulk operation successful", "success");
      fetchData();
    } catch {
      showToast("Bulk removal failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const selectedMentors = mentors.filter(m => selectedIds.includes(m.id));
    const exportData = selectedMentors.map(m => ({
      Name: m.name,
      Email: m.email,
      Department: m.department,
      Phone: m.phone || "N/A"
    }));
    downloadCSV(exportData, `mentors-export-${new Date().toISOString().split('T')[0]}`);
  };

  const openEditModal = (m: Mentor) => {
    setFormData({
      name: m.name,
      email: m.email,
      department: m.department,
      phone: m.phone || "",
      role: "mentor"
    });
    setIsEditing(true);
    setSelectedMentorId(m.id);
    setIsModalOpen(true);
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === mentors.length && mentors.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mentors.map(m => m.id));
    }
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortOrder(newOrder);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Manage Mentors</h1>
            <p className="text-sm text-content-secondary mt-1">Organize and manage the mentors who guide your interns.</p>
          </div>
          <button 
            onClick={() => {
              setFormData({ name: "", email: "", department: "AI", phone: "", role: "mentor" });
              setIsEditing(false);
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <PlusCircle className="w-4 h-4" />
            Add Mentor
          </button>
        </div>

        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="label">Search Mentors</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                <input
                  placeholder="Name or Email"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="input has-icon-left"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Department</label>
              <div className="relative">
                <select 
                  value={departmentFilter}
                  onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
                  className="select"
                >
                  <option value="">All Divisions</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d} Division</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
               <label className="label">View</label>
               <div className="flex bg-surface-muted rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "grid" ? "bg-surface-card text-content-primary shadow-sm" : "text-content-secondary hover:text-content-primary"}`}
                  >
                    <Grid className="w-4 h-4" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "list" ? "bg-surface-card text-content-primary shadow-sm" : "text-content-secondary hover:text-content-primary"}`}
                  >
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline">List</span>
                  </button>
               </div>
            </div>

            <div className="flex items-end justify-end">
               <div className="text-right">
                  <div className="flex items-center justify-end gap-2 text-sm font-medium text-content-primary">
                    <Users className="w-4 h-4 text-primary-text" />
                    Total Mentors
                  </div>
                  <p className="text-content-secondary text-sm mt-1">{totalCount} Mentors</p>
               </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
             <div className="spinner mb-6"></div>
             <p className="text-content-secondary">Accessing personnel database...</p>
          </div>
        ) : mentors.length === 0 ? (
          <div className="card p-24 text-center">
            <Users className="w-24 h-24 text-content-muted mx-auto mb-6 opacity-20" />
            <h3 className="text-xl font-bold text-content-primary mb-2">No Mentors Found</h3>
            <p className="text-content-secondary max-w-sm mx-auto mb-8">Add a new mentor to get started.</p>
            <button 
               onClick={() => setIsModalOpen(true)}
               className="btn btn-primary"
            >
                Add Mentor
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            <AnimatePresence mode="wait">
              {viewMode === "grid" ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                >
                  {mentors.map((mentor, idx) => (
                    <motion.div
                      key={mentor.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="card card-interactive p-6 h-full">
                        <div className="flex flex-col h-full">
                          <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="avatar avatar-lg">
                              {mentor.name[0]}
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => openEditModal(mentor)} className="btn btn-ghost btn-sm btn-icon-edit">
                                  <Edit3 className="w-4 h-4" />
                               </button>
                               <button onClick={() => handleDelete(mentor.id)} className="btn btn-ghost btn-sm btn-icon-delete">
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                          </div>

                          <div className="space-y-2 mb-6">
                            <h4 className="text-lg font-semibold text-content-primary truncate">{mentor.name}</h4>
                            <span className="badge badge-primary">
                              {mentor.department}
                            </span>
                          </div>

                          <div className="space-y-3 mt-auto text-content-secondary">
                            <div className="flex items-center gap-3">
                              <Mail className="w-4 h-4" />
                              <span className="text-sm truncate">{mentor.email}</span>
                            </div>
                            {mentor.phone && (
                              <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4" />
                                <span className="text-sm">{mentor.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="table-container"
                >
                  <div className="table-scroll">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="w-12">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-border-default text-primary-text focus:ring-border-focus cursor-pointer"
                              checked={mentors.length > 0 && selectedIds.length === mentors.length}
                              onChange={toggleSelectAll}
                            />
                          </th>
                          <th className="cursor-pointer" onClick={() => handleSort("name")} aria-sort={sortBy === "name" ? (sortOrder as "ascending" | "descending") : undefined}>
                            <div className="flex items-center gap-2">
                              Mentor Details
                              {sortBy === "name" ? (sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary-text" /> : <ChevronDown className="w-3 h-3 text-primary-text" />) : <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />}
                            </div>
                          </th>
                          <th className="cursor-pointer" onClick={() => handleSort("department")} aria-sort={sortBy === "department" ? (sortOrder as "ascending" | "descending") : undefined}>
                            <div className="flex items-center gap-2">
                              Department
                              {sortBy === "department" ? (sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary-text" /> : <ChevronDown className="w-3 h-3 text-primary-text" />) : <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />}
                            </div>
                          </th>
                          <th>Contact</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mentors.map((mentor) => (
                          <tr 
                            key={mentor.id}
                            className={selectedIds.includes(mentor.id) ? 'bg-primary-subtle' : ''}
                          >
                            <td>
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-border-default text-primary-text focus:ring-border-focus cursor-pointer"
                                checked={selectedIds.includes(mentor.id)}
                                onChange={() => toggleSelectRow(mentor.id)}
                              />
                            </td>
                            <td className="min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <div className="avatar avatar-md">
                                  {mentor.name[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-content-primary">{mentor.name}</span>
                                  <span className="text-sm text-content-secondary">{mentor.email}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-primary">
                                {mentor.department}
                              </span>
                            </td>
                            <td className="text-content-primary">
                              {mentor.phone || "---"}
                            </td>
                            <td>
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => openEditModal(mentor)}
                                  className="btn btn-ghost btn-sm btn-icon-edit"
                                  title="Edit Profile"
                                >
                                   <Edit3 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(mentor.id)}
                                  className="btn btn-ghost btn-sm btn-icon-delete"
                                  title="Delete Personnel"
                                >
                                   <Trash2 className="w-4 h-4" />
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
                    onPageChange={(p) => setPage(p)}
                    onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditing ? "Edit Mentor" : "Add Mentor"}
          size="lg"
        >
          <form onSubmit={handleCreateOrUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <label className="label">Full Name</label>
                  <input
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="input"
                  />
              </div>
              <div className="space-y-2">
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="input"
                  />
              </div>
              <div className="space-y-2">
                  <label className="label">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="select"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
              </div>
              <div className="space-y-2">
                  <label className="label">Phone Number</label>
                  <input
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
               <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
               >
                  Cancel
               </button>
               <button 
                  type="submit" 
                  className="btn btn-primary"
               >
                  {isEditing ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                  {isEditing ? "Save Changes" : "Add Mentor"}
               </button>
            </div>
          </form>
        </Modal>

        <BulkActionBar
          selectedCount={selectedIds.length}
          onClear={() => setSelectedIds([])}
          onDelete={handleBulkDelete}
          onExport={handleExport}
        />
      </div>
    </DashboardLayout>
  );
}
