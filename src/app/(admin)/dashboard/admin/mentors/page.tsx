"use client";

import { useEffect, useState, useCallback } from "react";
import { useFormik } from "formik";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  Users, Search, Mail, 
  Phone, Trash2, Edit3, ShieldCheck, 
  PlusCircle, Grid, List, AlertTriangle, Loader2,
  ArrowUpDown, ChevronUp, ChevronDown
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { showToast } from "@/lib/notifications";
import { Pagination } from "@/components/ui/Pagination";
import { BulkActionBar } from "@/components/features/BulkActionBar";
import { QuickViewModal } from "@/components/features/QuickViewModal";
import { ChangePasswordModal } from "@/components/features/ChangePasswordModal";
import { downloadCSV } from "@/lib/utils/csv-utils";
import { motion, AnimatePresence } from "framer-motion";
import { createMentorSchema, mapZodErrors } from "@/lib/validations/schemas";
import Swal from "sweetalert2";

interface Mentor {
  id: string;
  name: string;
  email: string;
  department: string;
  phone?: string;
  status?: string;
}

const initialMentorValues = {
  name: "",
  email: "",
  department: "",
  phone: "+91 ",
  role: "mentor" as const,
};

export default function AdminMentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string; name: string } | null>(null);
  const [quickViewEntity, setQuickViewEntity] = useState<{ id: string; type: "intern" | "mentor" | "task" } | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  
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

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch("/api/departments");
        if (!res.ok) return;
        const data: Array<{ name?: string } | string> = await res.json();
        const names = data
          .map((dept) => (typeof dept === "string" ? dept : dept?.name))
          .filter((name): name is string => Boolean(name && name.trim()));
        if (names.length > 0) setDepartments(names);
      } catch {
        // no-op
      }
    };
    fetchDepartments();
  }, []);

  const mentorFormik = useFormik({
    initialValues: initialMentorValues,
    validate: (values) => {
      const result = createMentorSchema(departments).safeParse(values);
      if (result.success) return {};
      return mapZodErrors(result.error);
    },
    onSubmit: async (values, helpers) => {
      helpers.setSubmitting(true);
      try {
      const url = isEditing 
        ? `/api/mentors/${selectedMentorId}` 
        : "/api/auth/users";
      
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        showToast(isEditing ? "Updated" : "Account Created", "success");
        setIsModalOpen(false);
        helpers.resetForm({ values: initialMentorValues });
        setIsEditing(false);
        setSelectedMentorId(null);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Execution failed", "error");
      }
    } catch {
      showToast("Service interruption", "error");
    } finally {
      helpers.setSubmitting(false);
    }
    },
  });

  useEffect(() => {
    if (!mentorFormik.values.department && departments.length > 0) {
      mentorFormik.setFieldValue("department", departments[0], false);
    }
  }, [departments, mentorFormik]);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    let raw = digits;
    if (digits.startsWith("91")) {
      raw = digits.slice(2);
    }
    raw = raw.slice(0, 10);

    if (raw.length === 0) return "+91 ";
    if (raw.length <= 5) return `+91 ${raw}`;
    return `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
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
    mentorFormik.setValues({
      name: m.name,
      email: m.email,
      department: m.department,
      phone: formatPhoneNumber(m.phone || ""),
      role: "mentor",
    });
    mentorFormik.setTouched({});
    setIsEditing(true);
    setSelectedMentorId(m.id);
    setIsModalOpen(true);
  };

  const handleOpenEditById = (id: string) => {
    const mentor = mentors.find((m) => m.id === id);
    if (mentor) {
      openEditModal(mentor);
    }
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
              mentorFormik.resetForm({ values: initialMentorValues });
              setIsEditing(false);
              setSelectedMentorId(null);
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
              <label className="label">Search Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                <input
                  placeholder="Ex: John Doe"
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
                  <option value="">All Departments</option>
                  {departments.map(d => (
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
                             <div className="avatar avatar-lg cursor-pointer" onClick={() => setQuickViewEntity({ id: mentor.id, type: "mentor" })}>
                               {mentor.name[0]}
                             </div>
                            <div className="flex gap-2">
                               <button
                                  onClick={() => setResetPasswordUser({ id: mentor.id, name: mentor.name })}
                                  className="btn btn-icon btn-sm btn-ghost"
                                  title="Reset Password"
                               >
                                  <ShieldCheck className="w-4 h-4" />
                               </button>
                               <button
                                  onClick={() => setQuickViewEntity({ id: mentor.id, type: "mentor" })}
                                  className="btn btn-icon btn-sm btn-ghost"
                                  title="Details"
                               >
                                  <Search className="w-4 h-4" />
                               </button>
                                <button onClick={() => openEditModal(mentor)} className="btn btn-icon btn-sm btn-ghost btn-icon-edit">
                                  <Edit3 className="w-4 h-4" />
                               </button>
                                <button onClick={() => handleDelete(mentor.id)} className="btn btn-icon btn-sm btn-ghost btn-icon-delete">
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
                              className="w-4 h-4 rounded border-border-default text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                              checked={mentors.length > 0 && selectedIds.length === mentors.length}
                              onChange={toggleSelectAll}
                            />
                          </th>
                          <th className="cursor-pointer min-w-55" onClick={() => handleSort("name")} aria-sort={sortBy === "name" ? (sortOrder as "ascending" | "descending") : undefined}>
                            <div className="flex items-center gap-2">
                              Mentor Details
                              {sortBy === "name" ? (sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                            </div>
                          </th>
                          <th className="cursor-pointer" onClick={() => handleSort("department")} aria-sort={sortBy === "department" ? (sortOrder as "ascending" | "descending") : undefined}>
                            <div className="flex items-center gap-2">
                              Department
                              {sortBy === "department" ? (sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                            </div>
                          </th>
                          <th>Contact</th>
                          <th className="text-center align-middle">
                            <div className="flex justify-center w-full">Actions</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {mentors.map((mentor) => (
                          <tr 
                            key={mentor.id}
                            className={selectedIds.includes(mentor.id) ? 'bg-surface-muted' : ''}
                          >
                            <td>
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-border-default text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                  checked={selectedIds.includes(mentor.id)}
                                  onChange={() => toggleSelectRow(mentor.id)}
                                />
                            </td>
                            <td className="min-w-50">
                              <div className="flex items-center gap-3">
                                <div className="avatar avatar-md cursor-pointer" onClick={() => setQuickViewEntity({ id: mentor.id, type: "mentor" })}>
                                  {mentor.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-content-primary hover:text-primary cursor-pointer transition-colors" onClick={() => setQuickViewEntity({ id: mentor.id, type: "mentor" })}>{mentor.name}</span>
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
                            <td className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setResetPasswordUser({ id: mentor.id, name: mentor.name })}
                                  className="btn btn-icon btn-sm btn-ghost"
                                  title="Reset Password"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setQuickViewEntity({ id: mentor.id, type: "mentor" })}
                                  className="btn btn-icon btn-sm btn-ghost"
                                  title="Details"
                                >
                                  <Search className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => openEditModal(mentor)}
                                  className="btn btn-icon btn-sm btn-ghost btn-icon-edit"
                                  title="Edit Profile"
                                >
                                   <Edit3 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(mentor.id)}
                                  className="btn btn-icon btn-sm btn-ghost btn-icon-delete"
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
          <form onSubmit={mentorFormik.handleSubmit} className="space-y-6">
            {mentorFormik.submitCount > 0 && Object.keys(mentorFormik.errors).length > 0 && (
              <div className="alert alert-error">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">Please fix the errors below before submitting.</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <label className="label">Full Name</label>
                  <input
                    name="name"
                    placeholder="Full Name"
                    value={mentorFormik.values.name}
                    onChange={mentorFormik.handleChange}
                    onBlur={mentorFormik.handleBlur}
                    required
                    className={`input ${mentorFormik.touched.name && mentorFormik.errors.name ? "border-error-text" : ""}`}
                  />
                  {mentorFormik.touched.name && mentorFormik.errors.name && <p className="form-error">{mentorFormik.errors.name}</p>}
              </div>
              <div className="space-y-2">
                  <label className="label">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    value={mentorFormik.values.email}
                    onChange={mentorFormik.handleChange}
                    onBlur={mentorFormik.handleBlur}
                    required
                    className={`input ${mentorFormik.touched.email && mentorFormik.errors.email ? "border-error-text" : ""}`}
                  />
                  {mentorFormik.touched.email && mentorFormik.errors.email && <p className="form-error">{mentorFormik.errors.email}</p>}
              </div>
              <div className="space-y-2">
                  <label className="label">Department</label>
                  <select
                    name="department"
                    value={mentorFormik.values.department}
                    onChange={mentorFormik.handleChange}
                    onBlur={mentorFormik.handleBlur}
                    className="select"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {mentorFormik.touched.department && mentorFormik.errors.department && <p className="form-error">{mentorFormik.errors.department}</p>}
              </div>
              <div className="space-y-2">
                  <label className="label">Phone Number</label>
                  <input
                    name="phone"
                    placeholder="Phone Number"
                    value={mentorFormik.values.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      let newValue = value;
                      if (!value.startsWith("+91 ")) {
                        newValue = "+91 " + value.replace(/^\+?9?1?\s?/, "");
                      }
                      mentorFormik.setFieldValue("phone", formatPhoneNumber(newValue));
                    }}
                    onBlur={() => mentorFormik.setFieldTouched("phone", true)}
                    className={`input ${mentorFormik.touched.phone && mentorFormik.errors.phone ? "border-error-text" : ""}`}
                  />
                  {mentorFormik.touched.phone && mentorFormik.errors.phone && <p className="form-error">{mentorFormik.errors.phone}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
               <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={mentorFormik.isSubmitting}
               >
                  Cancel
               </button>
               <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={mentorFormik.isSubmitting}
               >
                  {mentorFormik.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                  {mentorFormik.isSubmitting ? "Submitting..." : isEditing ? "Save Changes" : "Add Mentor"}
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

        <QuickViewModal
          isOpen={!!quickViewEntity}
          onClose={() => setQuickViewEntity(null)}
          entityId={quickViewEntity?.id || null}
          entityType={quickViewEntity?.type || null}
          onEdit={handleOpenEditById}
        />

        <ChangePasswordModal
          isOpen={!!resetPasswordUser}
          onClose={() => setResetPasswordUser(null)}
          userId={resetPasswordUser?.id || null}
          userName={resetPasswordUser?.name || null}
        />
      </div>
    </DashboardLayout>
  );
}
