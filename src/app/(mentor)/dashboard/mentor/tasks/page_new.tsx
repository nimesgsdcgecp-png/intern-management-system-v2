"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlusCircle, Clock, CheckCircle2, LayoutGrid, List, Search, CheckSquare, Edit3, Eye } from "lucide-react";
import { KanbanBoard } from "@/components/features/KanbanBoard";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { Modal } from "@/components/ui/Modal";
import { QuickViewModal } from "@/components/features/QuickViewModal";
import { Pagination } from "@/components/ui/Pagination";
import { showToast } from "@/lib/notifications";
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
}

interface Intern {
  id: string;
  name: string;
  mentorId?: string;
}

export default function MentorTasksPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [myInterns, setMyInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [quickViewEntity, setQuickViewEntity] = useState<{ id: string, type: 'intern' | 'mentor' | 'task' } | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedInterns: [] as string[],
    deadline: "",
    priority: "medium",
    status: "pending",
    sendEmail: false,
  });
  
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = viewMode === 'kanban' ? 50 : parseInt(searchParams.get("pageSize") || "10");
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const [filters, setFilters] = useState({ 
    title: searchParams.get("title") || "", 
    status: searchParams.get("status") || "", 
    priority: searchParams.get("priority") || "" 
  });

  const fetchMyInterns = useCallback(async () => {
    if (!session?.user) return;
    try {
      const mentorId = (session.user as { id: string }).id;
      const res = await fetch(`/api/interns?mentorId=${mentorId}&pageSize=100`);
      if (res.ok) {
        const data = await res.json();
        setMyInterns(data.items || []);
      }
    } catch { 
      console.error("Failed to fetch interns"); 
    }
  }, [session]);

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
      showToast("Failed to retrieve tasks", "error");
    } finally { 
      setLoading(false); 
    }
  }, [page, pageSize, sortBy, sortOrder, filters]);

  useEffect(() => {
    if (session?.user) {
      fetchTasks();
      fetchMyInterns();
      const savedView = localStorage.getItem('mentorTaskViewMode');
      if (savedView === 'kanban' || savedView === 'table') {
        setViewMode(savedView as 'table' | 'kanban');
      }
    }
  }, [session, fetchTasks, fetchMyInterns]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Task updated to ${newStatus}`, "success");
        fetchTasks();
      }
    } catch { 
      showToast("Failed to update status", "error"); 
    }
  };

  const handleToggleView = (mode: 'table' | 'kanban') => {
    setViewMode(mode);
    localStorage.setItem('mentorTaskViewMode', mode);
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

  const handleClearFilters = () => {
    setFilters({ title: "", status: "", priority: "" });
    updateQueryParams({ title: null, status: null, priority: null, page: 1 });
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

    if (!formData.description.trim()) errors.description = "Description is required";
    if (!formData.deadline) errors.deadline = "Deadline is required";

    if (formData.assignedInterns.length === 0) {
      errors.assignments = "Select at least one intern";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks";
      const method = editingTask ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast(`Task ${editingTask ? 'updated' : 'created'} successfully`, "success");
        fetchTasks();
        setIsFormOpen(false);
        setEditingTask(null);
        setFormData({ 
          title: "", 
          description: "", 
          assignedInterns: [], 
          deadline: "", 
          priority: "medium", 
          status: "pending", 
          sendEmail: false 
        });
        setFormErrors({});
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to save task", "error");
      }
    } catch {
      showToast("Network error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      assignedInterns: task.assignedInterns || [],
      deadline: task.deadline,
      priority: task.priority,
      status: task.status,
      sendEmail: false,
    });
    setIsFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      assignedInterns: [],
      deadline: "",
      priority: "medium",
      status: "pending",
      sendEmail: false,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const getInternNames = (task: Task) => {
    if (task.assignedToAll) return "All Interns";
    const ids = task.assignedInterns || [];
    if (ids.length === 0) return "Unassigned";
    return ids.map(id => myInterns.find(i => i.id === id)?.name).filter(Boolean).join(", ") || "Unknown";
  };

  const filteredTasks = tasks;

  return (
    <DashboardLayout>
      <div className="w-full">
        <Modal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTask(null);
            setFormErrors({});
          }}
          title={editingTask ? "Edit Task" : "Create New Task"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <Input 
                  label="Task Title" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Ex: Database Migration" 
                  error={formErrors.title} 
                />
                <TextArea 
                  label="Description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Describe the task..." 
                  rows={6} 
                  error={formErrors.description} 
                />
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted">Assign To</label>
                    {formErrors.assignments && <span className="text-[10px] font-bold text-error-text uppercase tracking-widest">{formErrors.assignments}</span>}
                  </div>

                  <div className={`max-h-56 overflow-y-auto border rounded-2xl p-5 bg-surface-muted space-y-3 ${formErrors.assignments ? 'border-error-text ring-2 ring-error-subtle' : 'border-border-default'}`}>
                    <p className="text-[10px] font-bold text-content-muted uppercase mb-2">Select Interns</p>
                    {myInterns.length === 0 ? (
                      <p className="text-sm text-content-secondary py-4 text-center">No interns assigned to you</p>
                    ) : (
                      myInterns.map(i => (
                        <label key={i.id} className="flex items-center gap-4 p-3 hover:bg-surface-input rounded-xl transition-all cursor-pointer border border-transparent">
                          <input
                            type="checkbox"
                            checked={formData.assignedInterns.includes(i.id)}
                            onChange={() => {
                              const nextInterns = formData.assignedInterns.includes(i.id) 
                                ? formData.assignedInterns.filter(id => id !== i.id) 
                                : [...formData.assignedInterns, i.id];
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
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <Input 
                    label="Deadline" 
                    type="date" 
                    name="deadline" 
                    value={formData.deadline} 
                    onChange={handleInputChange} 
                    required 
                    error={formErrors.deadline} 
                  />
                  <Select 
                    label="Priority" 
                    name="priority" 
                    value={formData.priority} 
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </div>

                {editingTask && (
                  <Select 
                    label="Status" 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </Select>
                )}

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
                      <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">Send task notification via email</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-8 border-t border-border-subtle">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingTask(null);
                  setFormErrors({});
                }} 
                className="px-8"
              >
                Cancel
              </Button>
              <Button type="submit" className="px-12 btn btn-primary">
                {editingTask ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              Task Management
            </h1>
            <p className="text-sm text-content-secondary mt-1">Create and manage tasks for your interns</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-muted p-1 rounded-xl border border-border-default">
              <button
                onClick={() => handleToggleView('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-surface-card text-primary shadow-subtle' : 'text-content-disabled hover:text-content-secondary'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleToggleView('kanban')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-surface-card text-primary shadow-subtle' : 'text-content-disabled hover:text-content-secondary'}`}
                title="Kanban View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <Button
              onClick={handleCreateNew}
              icon={<PlusCircle className="w-5 h-5" />}
              className="btn btn-primary px-8"
            >
              Create Task
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="card p-6 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="label">Search Tasks</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted group-focus-within:text-primary transition-colors pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={filters.title}
                  onChange={(e) => handleFilterChange("title", e.target.value)}
                  className="input has-icon-left"
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
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="label opacity-0 pointer-events-none">Actions</label>
              <Button
                onClick={handleClearFilters}
                variant="secondary"
                className="w-full"
              >
                Clear Filters
              </Button>
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
              <Button onClick={handleCreateNew} className="btn btn-primary">Create Task</Button>
            </div>
          ) : viewMode === 'kanban' ? (
            <KanbanBoard
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onQuickView={(id) => setQuickViewEntity({ id, type: 'task' })}
              interns={myInterns}
            />
          ) : (
            <div className="table-container">
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Assigned To</th>
                      <th>Deadline</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Priority</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="group transition-all hover:bg-surface-muted">
                        <td className="min-w-75">
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
                                {task.priority} Priority
                              </span>
                            </div>
                          </button>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar avatar-sm">
                              {getInternNames(task).charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-content-secondary tracking-tight truncate max-w-37.5">{getInternNames(task)}</span>
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
                              {task.status === "completed" ? "Completed" : task.status === "in-progress" ? "In Progress" : "Pending"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex justify-center">
                            <span className={`badge ${
                                task.priority === 'high' ? 'badge-error' : 
                                task.priority === 'medium' ? 'badge-warning' :
                                'badge-success'
                              }`}>
                              {task.priority}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => setQuickViewEntity({ id: task.id, type: 'task' })}
                              className="btn btn-ghost btn-icon"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(task)}
                              className="btn btn-ghost btn-icon"
                              title="Edit Task"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {viewMode === 'table' && (
                <div className="p-4 border-t border-border-subtle bg-surface-muted">
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
          )}
        </div>
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
