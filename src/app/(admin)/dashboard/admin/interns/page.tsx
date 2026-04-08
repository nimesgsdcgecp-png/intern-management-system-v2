"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { showToast } from "@/lib/notifications";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Edit3, Trash2, PlusCircle, GraduationCap, Search, ShieldCheck, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { QuickViewModal } from "@/components/features/QuickViewModal";
import { ChangePasswordModal } from "@/components/features/ChangePasswordModal";
import { BulkActionBar } from "@/components/features/BulkActionBar";
import { Pagination } from "@/components/ui/Pagination";
import { downloadCSV } from "@/lib/utils/csv-utils";
import Swal from "sweetalert2";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Intern {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  mentorId: string;
  startDate: string;
  status: string;
  collegeName?: string;
  university?: string;
}

interface Mentor {
  id: string;
  name: string;
  email: string;
  department?: string;
}

interface CredentialNotice {
  role: "intern";
  name: string;
  email: string;
  id: string;
  password: string;
}

const DEPARTMENTS = ["AI", "ODOO", "JAVA", "MOBILE", "SAP", "QC", "PHP", "RPA"];

export default function InternsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [interns, setInterns] = useState<Intern[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [credentialNotice, setCredentialNotice] = useState<CredentialNotice | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string, name: string } | null>(null);
  const [quickViewEntity, setQuickViewEntity] = useState<{ id: string, type: 'intern' | 'mentor' | 'task' } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // URL Persistent State
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const [filters, setFilters] = useState({
    name: searchParams.get("name") || "",
    collegeName: searchParams.get("collegeName") || "",
    department: searchParams.get("department") || "",
    mentorId: searchParams.get("mentorId") || "",
  });

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "+91 ",
    department: "AI",
    mentorId: "",
    startDate: "",
    collegeName: "",
  });

  const fetchInterns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      if (filters.name) params.set("name", filters.name);
      if (filters.department) params.set("department", filters.department);
      if (filters.collegeName) params.set("collegeName", filters.collegeName);
      if (filters.mentorId) params.set("mentorId", filters.mentorId);

      const res = await fetch(`/api/interns?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInterns(data.items);
        setTotalCount(data.totalCount);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to fetch interns", "error");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  useEffect(() => {
    fetchMentors();
  }, []);

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
    updateQueryParams({ [key]: value, page: 1 }); // Reset to page 1 on filter
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    updateQueryParams({ sortBy: column, sortOrder: newOrder, page: 1 });
  };

  const fetchMentors = async () => {
    try {
      const usersRes = await fetch("/api/auth/users");
      if (usersRes.ok) {
        const data = await usersRes.json();
        setMentors(data.filter((u: { role: string }) => u.role === "mentor"));
      }
    } catch (e) { console.error(e); }
  };

  const formatPhoneNumber = (value: string) => {
    // Preserve prefix by default
    const digits = value.replace(/\D/g, "");
    let raw = digits;

    // Extract only the 10 local digits
    if (digits.startsWith("91")) {
      raw = digits.slice(2);
    }
    raw = raw.slice(0, 10);

    if (raw.length === 0) return "+91 ";
    if (raw.length <= 5) return `+91 ${raw}`;
    return `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "phone") {
      // Prevent deletion of prefix
      if (!value.startsWith("+91 ")) {
        newValue = "+91 " + value.replace(/^\+?9?1?\s?/, "");
      }
      newValue = formatPhoneNumber(newValue);
    }

    setFormData({ ...formData, [name]: newValue });
    if (formErrors[name]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Full name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Invalid email format";

    if (formData.phone) {
      const digits = formData.phone.replace(/\D/g, "");
      const raw = digits.startsWith("91") ? digits.slice(2) : digits;
      if (raw.length !== 10) errors.phone = "Phone must be exactly 10 digits";
    }

    if (!formData.collegeName.trim()) errors.collegeName = "Institution name is required";
    if (!formData.mentorId) errors.mentorId = "Please assign a mentor";
    if (!formData.startDate) errors.startDate = "Start date is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Logic: Registration/Update Execution
   * Handles the persistence layer for intern records. 
   * Includes post-registration credential generation for new accounts.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setCredentialNotice(null);
    setLoading(true);

    try {
      const url = editingId ? `/api/interns/${editingId}` : "/api/interns";
      const method = editingId ? "PUT" : "POST";
      const payload = { ...formData, university: formData.collegeName };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err?.error || "Operation failed", "error");
        return;
      }

      const data = await res.json();
      await fetchInterns();
      setIsFormOpen(false);

      showToast(editingId ? "Profile updated successfully" : "Intern registered successfully", "success");

      setEditingId(null);
      setFormData({ name: "", email: "", phone: "+91 ", department: "AI", mentorId: "", startDate: "", collegeName: "" });
      setFormErrors({});

      if (!editingId && data?.credentials) {
        setCredentialNotice({
          role: "intern",
          name: payload.name,
          email: payload.email,
          id: data.credentials.id,
          password: data.credentials.password,
        });
      }
    } catch {
      showToast("A communication error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (intern: Intern) => {
    setFormData({
      name: intern.name,
      email: intern.email,
      phone: formatPhoneNumber(intern.phone || ""),
      department: intern.department,
      mentorId: intern.mentorId,
      startDate: intern.startDate,
      collegeName: intern.collegeName || intern.university || "",
    });
    setEditingId(intern.id);
    setIsFormOpen(true);
  };

  /**
   * Logic: Record Management
   * Removes intern data from the system with associated records.
   */
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Confirm Deletion",
      text: "Are you sure you want to remove this intern? All associated records will be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/interns/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInterns(interns.filter(i => i.id !== id));
        if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id));
        Swal.fire("Deleted!", "The intern record has been successfully removed.", "success");
      } else {
        Swal.fire("Error", "Action denied: System protection active.", "error");
      }
    } catch {
      Swal.fire("Critical Error", "Network failure.", "error");
    }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: "Bulk Deletion",
      text: `Are you sure you want to delete ${selectedIds.length} intern records? This action is irreversible.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Confirm Delete",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/interns/${id}`, { method: "DELETE" })));
      setInterns(interns.filter(i => !selectedIds.includes(i.id)));
      setSelectedIds([]);
      Swal.fire("Success", "The selected records have been deleted.", "success");
    } catch {
      Swal.fire("Error", "Bulk operation failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getMentorLabel = (mentorId: string) => {
    const mentor = mentors.find((m) => m.id === mentorId);
    return mentor ? mentor.name : "Not assigned";
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === interns.length && interns.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(interns.map(i => i.id));
    }
  };

  const handleExport = () => {
    const selectedInterns = interns.filter(i => selectedIds.includes(i.id));
    const exportData = selectedInterns.map(i => ({
      Name: i.name,
      Email: i.email,
      Department: i.department,
      Institution: i.collegeName || i.university || "N/A",
      Mentor: getMentorLabel(i.mentorId),
      StartDate: i.startDate,
      Status: i.status
    }));
    downloadCSV(exportData, `interns-export-${new Date().toISOString().split('T')[0]}`);
    Swal.fire("Export Ready", "CSV file has been generated.", "success");
  };



  const copyCredentials = () => {
    if (!credentialNotice) return;
    const text = `Name: ${credentialNotice.name}\nID: ${credentialNotice.id}\nPassword: ${credentialNotice.password}`;
    navigator.clipboard.writeText(text);
    showToast("Credentials copied to clipboard", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingId ? "Update Intern Profile" : "Register New Intern"}
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input label="Full Name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Full Name" error={formErrors.name} />
              <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="email@address.com" error={formErrors.email} />
              <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 xxxxx xxxxx" error={formErrors.phone} />
              <Input label="Educational Institution" name="collegeName" value={formData.collegeName} onChange={handleInputChange} required placeholder="College/University" error={formErrors.collegeName} />
              <Select label="Assigned Department" name="department" value={formData.department} onChange={handleInputChange} error={formErrors.department}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
              <Input label="Start Date" type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} error={formErrors.startDate} />
              <div className="md:col-span-2">
                <Select
                  label="Assign Mentor"
                  name="mentorId"
                  value={formData.mentorId}
                  onChange={handleInputChange}
                  error={formErrors.mentorId}
                  disabled={!formData.department}
                >
                  <option value="">{formData.department ? "Select a Mentor..." : "Please select a department first"}</option>
                  {mentors
                    .filter(m => !formData.department || m.department === formData.department)
                    .map(m => <option key={m.id} value={m.id}>{m.name} ({m.department})</option>)}
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
              <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editingId ? "Update Profile" : "Add Intern"}</Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={!!credentialNotice}
          onClose={() => setCredentialNotice(null)}
          title="Login Details Created"
          size="md"
        >
          {credentialNotice && (
            <div className="space-y-6">
              <div className="alert alert-success">
                <p>These credentials have been generated for <strong>{credentialNotice.name}</strong>. Please share them securely.</p>
              </div>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">User ID</label>
                  <div className="input font-mono text-content-primary bg-surface-muted border-border-strong">{credentialNotice.id}</div>
                </div>
                <div className="form-group">
                  <label className="label">One-Time Password</label>
                  <div className="input font-mono text-content-primary bg-surface-muted border-border-strong">{credentialNotice.password}</div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button onClick={copyCredentials} variant="primary" size="lg" className="w-full">Copy Credentials</Button>
                <Button variant="secondary" onClick={() => setCredentialNotice(null)} className="w-full">Close Notice</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Intern Directory</h1>
            <p className="text-sm text-content-secondary mt-1">Manage all registered interns and their details.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditingId(null); setIsFormOpen(true); }}
              className="btn btn-primary"
            >
              <PlusCircle className="w-4 h-4" />
              Add Intern
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="form-group">
              <label className="label">Search Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                <input
                  type="text"
                  placeholder="Ex: John Doe"
                  value={filters.name}
                  onChange={(e) => handleFilterChange("name", e.target.value)}
                  className="input has-icon-left"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Institution</label>
              <input
                type="text"
                placeholder="Ex: MIT Boston"
                value={filters.collegeName}
                onChange={(e) => handleFilterChange("collegeName", e.target.value)}
                className="input"
              />
            </div>

            <div className="form-group">
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

            <div className="form-group">
              <label className="label">Mentor</label>
              <select
                value={filters.mentorId}
                onChange={(e) => handleFilterChange("mentorId", e.target.value)}
                className="select"
              >
                <option value="">All Mentors</option>
                {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="section">
          {loading ? (
            <div className="empty-state">
              <div className="spinner-lg mb-6"></div>
              <p className="empty-state-title">Accessing intern database...</p>
            </div>
          ) : interns.length === 0 ? (
            <div className="empty-state card">
              <GraduationCap className="w-16 h-16 text-content-muted mb-6" />
              <h3 className="empty-state-title">No interns recorded</h3>
              <p className="empty-state-description mb-8">Try adjusting your search criteria or register a new intern to get started.</p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="btn btn-primary"
              >
                Add First Intern
              </button>
            </div>
          ) : (
            <div className="table-container">
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-border-default text-primary focus:ring-2 focus:ring-primary/20"
                          checked={interns.length > 0 && selectedIds.length === interns.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="cursor-pointer" onClick={() => handleSort("name")} aria-sort={sortBy === "name" ? (sortOrder as "ascending" | "descending") : undefined}>
                        <div className="flex items-center gap-2">
                          Intern Details
                          {sortBy === "name" ? (sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                        </div>
                      </th>
                      <th className="cursor-pointer" onClick={() => handleSort("startDate")} aria-sort={sortBy === "startDate" ? (sortOrder as "ascending" | "descending") : undefined}>
                        <div className="flex items-center gap-2">
                          Institution
                          {sortBy === "startDate" ? (sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                        </div>
                      </th>
                      <th>Mentor</th>
                      <th className="text-center">Department</th>
                      <th className="text-center cursor-pointer" onClick={() => handleSort("status")} aria-sort={sortBy === "status" ? (sortOrder as "ascending" | "descending") : undefined}>
                        <div className="flex items-center justify-center gap-2">
                          Status
                          {sortBy === "status" ? (sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                        </div>
                      </th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interns.map((intern) => (
                      <tr
                        key={intern.id}
                        className={`${selectedIds.includes(intern.id) ? 'bg-surface-muted' : ''}`}
                      >
                        <td>
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-border-default text-primary focus:ring-2 focus:ring-primary/20"
                            checked={selectedIds.includes(intern.id)}
                            onChange={() => toggleSelectRow(intern.id)}
                          />
                        </td>

                        <td className="min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <div className="avatar avatar-md cursor-pointer" onClick={() => setQuickViewEntity({ id: intern.id, type: 'intern' })}>
                              {intern.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-content-primary hover:text-primary cursor-pointer transition-colors" onClick={() => setQuickViewEntity({ id: intern.id, type: 'intern' })}>{intern.name}</span>
                              <span className="text-sm text-content-secondary">{intern.email}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="flex flex-col">
                            <span className="font-medium text-content-primary">{intern.collegeName || intern.university || "N/A"}</span>
                            <span className="text-xs text-content-muted">{intern.startDate}</span>
                          </div>
                        </td>

                        <td className="text-content-primary">
                          {getMentorLabel(intern.mentorId)}
                        </td>

                        <td className="text-center">
                          <span className="badge badge-primary">
                            {intern.department}
                          </span>
                        </td>

                        <td className="text-center">
                          <span className={`badge ${intern.status === "active" ? "badge-success" :
                              intern.status === "onleave" ? "badge-info" :
                                "badge-neutral"
                            }`}>
                            {intern.status === "active" ? "Active" : intern.status === "onleave" ? "On Leave" : "Inactive"}
                          </span>
                        </td>

                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setResetPasswordUser({ id: intern.id, name: intern.name })}
                              className="btn btn-icon btn-sm btn-ghost"
                              title="Reset Password"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setQuickViewEntity({ id: intern.id, type: 'intern' })}
                              className="btn btn-icon btn-sm btn-ghost"
                              title="Details"
                            >
                              <Search className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(intern)}
                              className="btn btn-icon btn-sm btn-ghost"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(intern.id)}
                              className="btn btn-icon btn-sm btn-ghost hover:text-error"
                              title="Delete"
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
                onPageChange={(p) => updateQueryParams({ page: p })}
                onPageSizeChange={(s) => updateQueryParams({ pageSize: s, page: 1 })}
              />
            </div>
          )}
        </div>
      </div>


      <QuickViewModal
        isOpen={!!quickViewEntity}
        onClose={() => setQuickViewEntity(null)}
        entityId={quickViewEntity?.id || null}
        entityType={quickViewEntity?.type || null}
        onEdit={(id) => {
          setEditingId(id);
          setIsFormOpen(true);
        }}
      />

      <ChangePasswordModal
        isOpen={!!resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        userId={resetPasswordUser?.id || null}
        userName={resetPasswordUser?.name || null}
      />

      <BulkActionBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onDelete={handleBulkDelete}
        onExport={handleExport}
      />
    </DashboardLayout>
  );
}
