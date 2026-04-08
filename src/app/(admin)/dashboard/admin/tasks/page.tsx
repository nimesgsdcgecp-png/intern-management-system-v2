"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlusCircle, Trash2, CheckCircle2, Clock, Activity, CheckSquare, LayoutGrid, List, Search, Users } from "lucide-react";
import { KanbanBoard } from "@/components/features/KanbanBoard";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { Modal } from "@/components/ui/Modal";
import { QuickViewModal } from "@/components/features/QuickViewModal";
import { BulkActionBar } from "@/components/features/BulkActionBar";
import { Pagination } from "@/components/ui/Pagination";
import { showToast } from "@/lib/notifications";
import { downloadCSV } from "@/lib/utils/csv-utils";
import Swal from "sweetalert2";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Task {
  id: string;
  title: string;
  description: string;
  assignedInterns?: string[];
  assignedToAll?: boolean;
  deadline: string;
  status: string;
  priority: string;
  type?: string;
  stream?: string;
}

interface Intern {
  id: string;
  name: string;
  department?: string;
}

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [quickViewEntity, setQuickViewEntity] = useState<{ id: string, type: 'intern' | 'mentor' | 'task' } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'grid'>('table');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedInterns: [] as string[],
    assignedToAll: false,
    deadline: "",
    priority: "medium",
    status: "pending",
    sendEmail: false,
  });
  
  // URL Persistent Pagination State
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = viewMode === 'kanban' ? 50 : parseInt(searchParams.get("pageSize") || "10");
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const [filters, setFilters] = useState({ 
    title: searchParams.get("title") || "", 
    status: searchParams.get("status") || "", 
    priority: searchParams.get("priority") || "" 
  });

  const fetchInterns = useCallback(async () => {
    try {
      // Fetch a larger set for the assignment list to ensure all targets are available
      const res = await fetch("/api/interns?pageSize=100");
      if (res.ok) {
        const data = await res.json();
        setInterns(data.items);
      }
    } catch { console.error("Failed to fetch interns"); }
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      
      if (filters.title) params.set("title", filters.title);
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.items);
        setTotalCount(data.totalCount);
      }
    } catch {
      console.error("Failed to fetch tasks");
      showToast("Failed to retrieve master task list", "error");
    } finally { 
      setLoading(false); 
    }
  }, [page, pageSize, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchTasks();
    fetchInterns();
    const savedView = localStorage.getItem('taskViewMode');
    if (savedView === 'kanban' || savedView === 'table' || savedView === 'grid') {
      setViewMode(savedView as 'table' | 'kanban' | 'grid');
    }
  }, [fetchTasks, fetchInterns]);

  /**
   * Logic: Tactical State Transition
   * Updates the lifecycle status of a specific technical directive.
   * Facilitates the movement of tasks through the Kanban execution pipeline.
   */
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Task advanced to ${newStatus === 'in-progress' ? 'In Progress' : 'Completed'} stage`, "success");
        fetchTasks();
      }
    } catch { 
      showToast("Failed to transform status", "error"); 
    }
  };

  const handleToggleView = (mode: 'table' | 'kanban' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('taskViewMode', mode);
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
    if (!formData.title.trim()) errors.title = "Title is required";
    else if (formData.title.length < 5) errors.title = "Title must be at least 5 characters";

    if (!formData.description.trim()) errors.description = "Technical specifications are required";
    if (!formData.deadline) errors.deadline = "Deadline is required";

    if (!formData.assignedToAll && formData.assignedInterns.length === 0) {
      errors.assignments = "Select at least one intern or broadcast to all";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Logic: Directive Publication
   * Handles the creation and distribution of new technical tasks.
   * Supports broadcast assignments and targeted deployments with email notifications.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast("Task created successfully", "success");
        fetchTasks();
        setIsFormOpen(false);
        setFormData({ title: "", description: "", assignedInterns: [], assignedToAll: false, deadline: "", priority: "medium", status: "pending", sendEmail: false });
        setFormErrors({});
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to publish task", "error");
      }
    } catch {
      showToast("Network failure: Could not reach HQ", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete Task?",
      text: "This will remove the task from all active boards.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Delete Now",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== id));
        if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id));
        Swal.fire("Archived", "Task has been moved to repository archives.", "success");
      } else {
        Swal.fire("Access Denied", "System protected task cannot be deleted.", "error");
      }
    } catch {
      Swal.fire("Network Error", "Unable to synchronize with server.", "error");
    }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: "Bulk Archival",
      text: `Prepare to archive ${selectedIds.length} tasks.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Execute All",
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/tasks/${id}`, { method: "DELETE" })));
      setTasks(tasks.filter(t => !selectedIds.includes(t.id)));
      setSelectedIds([]);
      Swal.fire("System Status", "Bulk archival operation successful.", "success");
    } catch {
      Swal.fire("Incident Report", "Partial success: Some tasks resistant to archival.", "error");
    } finally {
      setLoading(false);
    }
  };


  const getInternNames = (task: Task) => {
    if (task.assignedToAll) return "All Interns";
    const ids = task.assignedInterns || [];
    if (ids.length === 0) return "Unassigned";
    return ids.map(id => interns.find(i => i.id === id)?.name).filter(Boolean).join(", ") || "Unknown";
  };

  const filteredTasks = tasks; // Server-side filtering now

  const handleExport = () => {
    const selectedTasks = tasks.filter(t => selectedIds.includes(t.id));
    const exportData = selectedTasks.map(t => ({
      Title: t.title,
      Status: t.status,
      Priority: t.priority,
      Deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline'
    }));
    downloadCSV(exportData, `tasks-export-${new Date().toISOString().split('T')[0]}`);
    Swal.fire("Success", "CSV exported successfully.", "success");
  };


  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTasks.length && filteredTasks.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map(t => t.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <DashboardLayout>
      <div className="w-full">
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title="Configure Technical Directive"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <Input label="Directive Title" name="title" value={formData.title} onChange={handleInputChange} required placeholder="Ex: Database Migration" error={formErrors.title} />
                <TextArea label="Technical Specifications" name="description" value={formData.description} onChange={handleInputChange} required placeholder="Outline the requirements..." rows={6} error={formErrors.description} />
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted">Assign To</label>
                    {formErrors.assignments && <span className="text-[10px] font-bold text-error-text uppercase tracking-widest">{formErrors.assignments}</span>}
                  </div>
                  <label className={`flex items-center gap-4 p-5 bg-surface-input rounded-2xl border cursor-pointer hover:bg-surface-muted transition-all group active:scale-[0.98] shadow-subtle ${formErrors.assignments ? 'border-error-text ring-2 ring-error-subtle' : 'border-border-default'}`}>
                    <input
                      type="checkbox"
                      checked={formData.assignedToAll}
                      onChange={(e) => {
                        setFormData({ ...formData, assignedToAll: e.target.checked, assignedInterns: e.target.checked ? [] : formData.assignedInterns });
                        if (formErrors.assignments) setFormErrors(prev => {
                          const next = { ...prev };
                          delete next.assignments;
                          return next;
                        });
                      }}
                      className="w-5 h-5 rounded-lg border-border-input text-primary focus:ring-border-focus transition-all"
                    />
                    <span className="font-extrabold text-content-primary tracking-tight">Broadcast to all active interns</span>
                  </label>

                  {!formData.assignedToAll && (
                    <div className={`max-h-56 overflow-y-auto border rounded-2xl p-5 bg-surface-muted space-y-3 ${formErrors.assignments ? 'border-error-text ring-2 ring-error-subtle' : 'border-border-default'}`}>
                      <p className="text-[10px] font-bold text-content-muted uppercase mb-2">Select Individual Interns</p>
                      {interns.map(i => (
                        <label key={i.id} className="flex items-center gap-4 p-3 hover:bg-surface-input rounded-xl transition-all cursor-pointer border border-transparent">
                          <input
                            type="checkbox"
                            checked={formData.assignedInterns.includes(i.id)}
                            onChange={() => {
                              const nextInterns = formData.assignedInterns.includes(i.id) ? formData.assignedInterns.filter(id => id !== i.id) : [...formData.assignedInterns, i.id];
                              setFormData({ ...formData, assignedInterns: nextInterns });
                              if (formErrors.assignments && nextInterns.length > 0) {
                                setFormErrors(prev => {
                                  const next = { ...prev };
                                  delete next.assignments;
                                  return next;
                                });
                              }
                            }}
                            className="w-4 h-4 rounded-md text-primary border-border-input"
                          />
                          <span className="text-sm font-bold text-content-secondary">{i.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <Input label="Deadline" type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} required error={formErrors.deadline} />
                  <Select label="Priority" name="priority" value={formData.priority} onChange={handleInputChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </div>

                <div className="pt-4 border-t border-border-subtle">
                  <label className="flex items-center gap-4 p-4 bg-surface-input rounded-2xl border border-dashed border-primary-border cursor-pointer hover:bg-surface-muted transition-all">
                    <input
                      type="checkbox"
                      name="sendEmail"
                      checked={formData.sendEmail}
                      onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                      className="w-5 h-5 rounded-lg border-border-input text-primary focus:ring-border-focus transition-all"
                    />
                    <div className="flex flex-col">
                      <span className="font-extrabold text-primary-text tracking-tight text-sm">Email Notification</span>
                      <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">Send technical directive via internal mail</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-8 border-t border-border-subtle">
              <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} className="px-8">Discard</Button>
              <Button type="submit" className="px-12 btn btn-primary">Publish Directive</Button>
            </div>
          </form>
        </Modal>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              Project Tasks
            </h1>
            <p className="text-sm text-content-secondary mt-1">Assign, monitor, and manage tasks across your team.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-muted p-1 rounded-xl border border-border-default">
              <button
                onClick={() => handleToggleView('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-surface-card text-primary shadow-subtle' : 'text-content-disabled hover:text-content-secondary'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleToggleView('kanban')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-surface-card text-primary shadow-subtle' : 'text-content-disabled hover:text-content-secondary'}`}
              >
                <Activity className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleToggleView('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-surface-card text-primary shadow-subtle' : 'text-content-disabled hover:text-content-secondary'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <Button
              onClick={() => { setIsFormOpen(true); }}
              icon={<PlusCircle className="w-5 h-5" />}
              className="btn btn-primary px-8"
            >
              Create Task
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="card p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="label">Search Tasks</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Ex: Database Migration"
                  value={filters.title}
                  onChange={(e) => handleFilterChange("title", e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="select"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="label">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="select"
              >
                <option value="">All Tiers</option>
                <option value="low">Standard</option>
                <option value="medium">Important</option>
                <option value="high">Critical</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-content-muted">
              <div className="spinner spinner-lg mb-6"></div>
              <p className="text-sm text-content-muted">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="card text-center py-24 border-dashed border-2 bg-surface-muted">
              <CheckCircle2 className="w-16 h-16 text-content-disabled mx-auto mb-6" />
              <h3 className="text-lg font-bold text-content-primary">No tasks found</h3>
              <p className="text-content-secondary mt-2 mb-8 text-sm">Update your filters or create a new task.</p>
              <Button onClick={() => setIsFormOpen(true)} className="btn btn-primary">Create Task</Button>
            </div>
          ) : viewMode === 'kanban' ? (
            <KanbanBoard
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onQuickView={(id) => setQuickViewEntity({ id, type: 'task' })}
              interns={interns}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTasks.map(task => (
                <div key={task.id} className={`card card-interactive p-8 transition-all cursor-pointer group hover:shadow-medium relative ${selectedIds.includes(task.id) ? 'bg-primary-subtle' : ''}`} onClick={() => setQuickViewEntity({ id: task.id, type: 'task' })}>
                  <div className="absolute top-6 right-6 z-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-border-input text-primary focus:ring-border-focus cursor-pointer transition-all"
                      checked={selectedIds.includes(task.id)}
                      onChange={() => toggleSelectRow(task.id)}
                    />
                  </div>
                  <div className="flex justify-between items-start mb-6">
                    <span className={`badge ${
                        task.priority === 'high' ? 'badge-error' : 
                        task.priority === 'medium' ? 'badge-warning' :
                        'badge-success'
                      }`}>
                      {task.priority} Priority
                    </span>
                    <div className={`w-3 h-3 rounded-full mr-12 ${task.status === 'completed' ? 'bg-success' : task.status === 'in-progress' ? 'bg-primary' : 'bg-content-disabled'}`} />
                  </div>
                  <h4 className="text-lg font-black text-content-primary mb-2 group-hover:text-primary transition-colors uppercase tracking-tight">{task.title}</h4>
                  <div className="flex items-center gap-2 mb-4">
                     <Users className="w-3.5 h-3.5 text-content-muted" />
                     <p className="text-[10px] font-black text-content-muted uppercase tracking-widest leading-none">Ownership: {getInternNames(task)}</p>
                  </div>
                  <p className="text-sm text-content-secondary line-clamp-2 mb-8 font-medium leading-relaxed">&quot;{task.description}&quot;</p>
                  <div className="flex justify-between items-center pt-5 border-t border-border-subtle text-[10px] font-black uppercase tracking-widest text-content-muted">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> {task.deadline}</span>
                    <span className="flex items-center gap-1.5"><Activity className={`w-4 h-4 ${task.status === 'completed' ? 'text-success' : 'text-primary'}`} /> {task.status}</span>
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
                      <th className="w-20">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded-lg border-border-input text-primary focus:ring-border-focus cursor-pointer transition-all"
                            checked={filteredTasks.length > 0 && selectedIds.length === filteredTasks.length}
                            onChange={toggleSelectAll}
                          />
                        </div>
                      </th>
                      <th>Task Title</th>
                      <th>Assigned Interns</th>
                      <th>Deadline</th>
                      <th className="text-center">Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className={`group transition-all hover:bg-surface-muted ${selectedIds.includes(task.id) ? 'bg-primary-subtle' : ''}`}>
                        <td>
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded-lg border-border-input text-primary focus:ring-border-focus cursor-pointer transition-all"
                              checked={selectedIds.includes(task.id)}
                              onChange={() => toggleSelectRow(task.id)}
                            />
                          </div>
                        </td>
                        <td className="min-w-[300px]">
                          <button
                            onClick={() => setQuickViewEntity({ id: task.id, type: 'task' })}
                            className="flex items-center gap-5 text-left group/btn"
                          >
                            <div className="avatar avatar-md bg-surface-nav text-content-inverse">
                              <CheckSquare className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-content-primary group-hover:text-primary transition-colors tracking-tight text-base">{task.title}</span>
                              <span className={`text-[10px] font-black uppercase tracking-[0.15em] mt-0.5 ${
                                  task.priority === 'high' ? 'text-error-text' : 
                                  task.priority === 'medium' ? 'text-warning-text' : 
                                  'text-success-text'
                                }`}>
                                {task.priority} Severity
                              </span>
                            </div>
                          </button>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar avatar-sm">
                              {getInternNames(task).charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-content-secondary tracking-tight truncate max-w-[150px]">{getInternNames(task)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-content-muted uppercase tracking-widest leading-none mb-1">Due Date</span>
                            <div className="flex items-center gap-2 text-content-primary font-bold text-sm">
                               <Clock className="w-3.5 h-3.5 text-primary" />
                               {task.deadline}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex justify-center">
                            <span className={`badge ${
                                task.status === "completed" ? "badge-success" :
                                task.status === "in-progress" ? "badge-primary" :
                                "badge-neutral"
                              }`}>
                              {task.status === "completed" ? "Finished" : task.status === "in-progress" ? "Executing" : "Queued"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="btn btn-ghost hover:bg-error-subtle hover:text-error-text"
                              title="Archive Directive"
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
      </div>

      <QuickViewModal
        isOpen={!!quickViewEntity}
        onClose={() => setQuickViewEntity(null)}
        entityId={quickViewEntity?.id || null}
        entityType={quickViewEntity?.type || null}
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
