"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlusCircle, Trash2, ClipboardList, Target, Clock, Layout, Table as TableIcon, Grid, Activity, CheckCircle2, Edit3, Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { KanbanBoard } from "@/components/features/KanbanBoard";
import { showToast } from "@/lib/notifications";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { Pagination } from "@/components/ui/Pagination";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Task {
  id: string;
  title: string;
  description: string;
  assignedIntern: string;
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
  const [viewMode, setViewMode] = useState<"kanban" | "table" | "grid">(
    (searchParams.get("view") as "kanban" | "table" | "grid") || "kanban"
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "12");
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedIntern: "",
    deadline: "",
    priority: "medium",
    status: "pending",
    sendEmail: false,
  });

  const [filters, setFilters] = useState({ 
    title: searchParams.get("title") || "", 
    status: searchParams.get("status") || "", 
    priority: searchParams.get("priority") || "" 
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
      
      if (filters.title) params.set("search", filters.title);
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);

      const [internsRes, tasksRes] = await Promise.all([
        fetch("/api/interns?all=true"),
        fetch(`/api/tasks?${params.toString()}`),
      ]);

      if (internsRes.ok && tasksRes.ok) {
        const internsData = await internsRes.json();
        const tasksData = await tasksRes.json();

        const allInterns = internsData.items || [];
        const assignedInterns = allInterns.filter((i: Intern) => i.mentorId === mentorId);
        setMyInterns(assignedInterns);
        setTasks(tasksData.items || []);
        setTotalCount(tasksData.totalCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showToast("Sync failed", "error");
    } finally {
      setLoading(false);
    }
  }, [session, page, pageSize, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.assignedIntern) {
      Swal.fire("Warning", "Please select an intern to assign this task.", "warning");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({
          title: "",
          description: "",
          assignedIntern: "",
          deadline: "",
          priority: "medium",
          status: "pending",
          sendEmail: false,
        });
        setIsFormOpen(false);
        fetchData();
        Swal.fire("Task Assigned", "The task has been successfully assigned.", "success");
      } else {
        Swal.fire("Error", "Failed to assign task", "error");
      }
    } catch {
      Swal.fire("Error", "Check your internet connection", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...selectedTask, status: newStatus });
        }
        showToast("Status updated", "success");
      }
    } catch {
      showToast("Update failed", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete Task?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it"
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
        if (res.ok) {
          setTasks(tasks.filter((t) => t.id !== id));
          setSelectedTask(null);
          Swal.fire("Deleted", "Task has been removed.", "success");
        } else {
          Swal.fire("Error", "Failed to delete task", "error");
        }
      } catch {
        Swal.fire("Error", "Failed to delete task", "error");
      }
    }
  };

  const getInternName = (internId: string) => {
    return myInterns.find((i) => i.id === internId)?.name || "Unknown";
  };

  const getAssignedToLabel = (task: Task) => {
    if (task.assignedToAll) return "All Interns";
    const ids = task.assignedInterns && task.assignedInterns.length > 0 ? task.assignedInterns : task.assignedIntern ? [task.assignedIntern] : [];
    const names = ids.map(getInternName).filter((name) => name !== "Unknown");
    return names.length === 0 ? "Unknown" : names.join(", ");
  };

  const statsData = [
    {
      label: "Total Tasks",
      value: loading ? "..." : totalCount.toString(),
      icon: <Target />,
      color: "blue" as const,
    },
    {
      label: "Needs Attention",
      value: loading ? "..." : tasks.filter(t => t.status === 'pending' || t.status === 'review').length.toString(),
      icon: <Clock />,
      color: "yellow" as const,
    },
    {
      label: "In Progress",
      value: loading ? "..." : tasks.filter(t => t.status === 'in-progress').length.toString(),
      icon: <Activity />,
      color: "purple" as const,
    },
    {
      label: "Completed",
      value: loading ? "..." : tasks.filter(t => t.status === 'completed').length.toString(),
      icon: <CheckCircle2 />,
      color: "green" as const,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-20">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              Manage Tasks
            </h1>
            <p className="text-sm text-content-secondary mt-1">Assign tasks and monitor the progress of your interns.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsFormOpen(true)}
              icon={<PlusCircle className="w-4 h-4" />}
              className="btn btn-primary px-8"
            >
              Assign Task
            </Button>
          </div>
        </div>

        <StatsGrid stats={statsData} loading={loading} />

        <div className="card p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="label">Search by Title</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted group-focus-within:text-primary transition-colors pointer-events-none" />
                <input
                  placeholder="Find a task..."
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
                <option value="pending">Queued</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Under Review</option>
                <option value="completed">Finished</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="label">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="select"
              >
                <option value="">Any Priority</option>
                <option value="low">Standard</option>
                <option value="medium">Important</option>
                <option value="high">Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="label">View Mode</label>
              <div className="flex bg-surface-muted p-1 rounded-lg border border-border-default h-10">
                <button
                  onClick={() => { setViewMode("kanban"); updateQueryParams({ view: "kanban" }); }}
                  className={`flex-1 flex items-center justify-center rounded transition-all ${viewMode === 'kanban' ? 'bg-surface-card text-primary shadow-subtle' : 'text-content-disabled hover:text-content-secondary'}`}
                >
                  <Layout className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setViewMode("table"); updateQueryParams({ view: "table" }); }}
                  className={`flex-1 flex items-center justify-center rounded transition-all ${viewMode === 'table' ? 'bg-surface-card text-primary shadow-subtle' : 'text-content-disabled hover:text-content-secondary'}`}
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setViewMode("grid"); updateQueryParams({ view: "grid" }); }}
                  className={`flex-1 flex items-center justify-center rounded transition-all ${viewMode === 'grid' ? 'bg-surface-card text-primary shadow-subtle' : 'text-content-disabled hover:text-content-secondary'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-content-muted">
              <div className="spinner spinner-lg mb-6"></div>
              <p className="text-sm text-content-muted">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <Card className="text-center py-24 border-dashed border-2 bg-surface-muted">
              <ClipboardList className="w-16 h-16 text-content-disabled mx-auto mb-6" />
              <h3 className="text-lg font-bold text-content-primary mb-2">No Tasks Found</h3>
              <p className="text-sm text-content-secondary mb-8">Start by assigning a new task to your interns.</p>
              <Button onClick={() => setIsFormOpen(true)} className="btn btn-primary">Assign First Task</Button>
            </Card>
          ) : (
            <>
              {viewMode === "kanban" ? (
                <KanbanBoard
                  tasks={tasks}
                  onStatusChange={handleStatusChange}
                  onQuickView={(id) => setSelectedTask(tasks.find(t => t.id === id) || null)}
                  interns={myInterns}
                />
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {tasks.map((task, idx) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -5 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="bg-surface-card rounded-lg border border-border-subtle group hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden shadow-sm" onClick={() => setSelectedTask(task)}>
                        <div className={`h-2 transition-opacity ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        <div className="p-8">
                          <div className="flex justify-between items-start mb-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              task.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                              task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'badge badge-success border-transparent'
                            }`}>
                              {task.priority} Priority
                            </span>
                            <div className={`w-3 h-3 rounded-full ${task.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : task.status === 'in-progress' ? 'bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.4)]' : 'bg-slate-300'}`} />
                          </div>
                          <h4 className="text-lg font-bold text-content-primary mb-3 group-hover:text-indigo-600 transition-colors tracking-tight">{task.title}</h4>
                          <p className="text-[10px] font-black text-content-muted uppercase tracking-widest mb-4">Assigned to: {getAssignedToLabel(task)}</p>
                          <p className="text-xs text-content-secondary line-clamp-2 mb-8 font-medium leading-relaxed opacity-80">{task.description}</p>
                          <div className="flex justify-between items-center pt-6 border-t border-gray-50 text-[10px] font-black uppercase tracking-widest text-content-muted">
                            <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-400" /> {task.deadline}</span>
                            <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-400" /> {task.status}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface-card rounded-lg border border-border-subtle overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface-muted/50 border-b border-border-subtle">
                          <th className="px-8 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">Task Information</th>
                          <th className="px-6 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">Intern</th>
                          <th className="px-6 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">Deadline</th>
                          <th className="px-6 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em] text-center">Priority</th>
                          <th className="px-8 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {tasks.map((task) => (
                          <tr key={task.id} className="group transition-all duration-300 hover:bg-surface-muted/30">
                            <td className="px-8 py-4 min-w-[300px]">
                              <div className="flex flex-col">
                                <span className="font-bold text-content-primary group-hover:text-indigo-600 transition-colors tracking-tight text-base">{task.title}</span>
                                <span className="text-xs text-content-muted font-medium line-clamp-1">{task.description}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-content-secondary uppercase tracking-tight">{getAssignedToLabel(task)}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2.5 font-bold text-[11px] text-content-secondary uppercase tracking-tight">
                                <Clock className="w-4 h-4 text-indigo-400" /> {task.deadline}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                task.priority === "high" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                task.priority === "medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                "badge badge-success border-transparent"
                              }`}>
                                {task.priority}
                              </span>
                            </td>
                            <td className="px-8 py-4">
                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={() => setSelectedTask(task)}
                                  className="badge badge-primary"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(task.id)}
                                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-muted text-content-muted hover:bg-rose-50 hover:text-rose-600 transition-all border border-border-subtle active:scale-95"
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
                </div>
              )}
              <div className="mt-8">
                <Pagination
                  currentPage={page}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={(p) => updateQueryParams({ page: p })}
                  onPageSizeChange={(s) => updateQueryParams({ pageSize: s, page: 1 })}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Assign New Task"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="label">Task Name</label>
              <input
                name="title"
                type="text"
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="label">Detailed Description</label>
              <textarea
                name="description"
                placeholder="Explain the requirements, goals, and expectations..."
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="input resize-none py-3"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="label">Assign to Intern</label>
                <select
                  name="assignedIntern"
                  value={formData.assignedIntern}
                  onChange={handleInputChange}
                  className="select"
                  required
                >
                  <option value="">Select an intern...</option>
                  {myInterns.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="label">Deadline Date</label>
                <input
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="input cursor-pointer"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 px-8 bg-surface-muted rounded-lg border border-border-default">
              <div className="space-y-3">
                <label className="label">Priority Level</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="select"
                >
                  <option value="low">Standard</option>
                  <option value="medium">Important</option>
                  <option value="high">Urgent</option>
                </select>
              </div>
              <div className="flex items-center gap-4 pt-8">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="sendEmail"
                    checked={formData.sendEmail}
                    onChange={handleInputChange}
                    className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-content-primary uppercase tracking-tight leading-none mb-1">Email Alert</span>
                    <span className="text-[9px] font-bold text-content-muted uppercase tracking-widest">Notify intern via email</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-5 pt-8 border-t border-border-subtle">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              icon={submitting ? <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            >
              Assign Task
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Edit Task Details"
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border-subtle pb-8">
              <div className="flex items-center gap-6">
                <div className={`btn btn-primary`}>
                  <ClipboardList className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-content-primary tracking-tighter uppercase">{selectedTask.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                    <span className="text-[10px] font-black text-content-muted uppercase tracking-widest">Assigned to: {getAssignedToLabel(selectedTask)}</span>
                  </div>
                </div>
              </div>
              <div className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border ${selectedTask.priority === 'high' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                {selectedTask.priority} Priority
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-surface-muted rounded-lg border border-border-subtle flex items-center gap-6 group hover:bg-surface-card hover:shadow-xl transition-all duration-300">
                <div className="badge badge-primary">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-content-muted uppercase tracking-widest mb-1">Deadline</div>
                  <div className="text-[13px] font-black text-content-primary tracking-tight uppercase">{selectedTask.deadline}</div>
                </div>
              </div>
              <div className="p-8 bg-surface-muted rounded-lg border border-border-subtle flex items-center gap-6 group hover:bg-surface-card hover:shadow-xl transition-all duration-300">
                <div className="badge badge-success">
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-content-muted uppercase tracking-widest mb-1">Status</div>
                  <div className="text-[13px] font-black text-content-primary tracking-tight uppercase">{selectedTask.status}</div>
                </div>
              </div>
            </div>

            <div className="bg-surface-muted rounded-lg p-10 border border-border-subtle relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-700">
                <ClipboardList className="w-32 h-32 text-indigo-600" />
              </div>
              <label className="text-[10px] font-black text-content-muted uppercase tracking-[0.4em] mb-6 block">Work Description</label>
              <p className="text-[13px] font-medium text-content-secondary leading-relaxed relative z-10">
                &quot;{selectedTask.description}&quot;
              </p>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-8 border-t border-border-subtle">
              <button
                onClick={() => handleDelete(selectedTask.id)}
                className="flex items-center gap-3 text-rose-500 hover:text-rose-700 transition-all font-black text-[10px] uppercase tracking-[0.2em] outline-none group"
              >
                <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Delete this task
              </button>
              <div className="flex items-center gap-5 w-full md:w-auto">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </DashboardLayout>
  );
}
