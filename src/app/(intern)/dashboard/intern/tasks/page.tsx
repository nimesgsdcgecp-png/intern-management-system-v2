"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KanbanBoard } from "@/components/features/KanbanBoard";
import { Modal } from "@/components/ui/Modal";
import { Clock, List, LayoutGrid, CheckCircle2, Activity, Eye, ChevronDown, ChevronUp, XCircle, Search } from "lucide-react";
import { showToast } from "@/lib/notifications";
import { Pagination } from "@/components/ui/Pagination";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  priority: string;
  assignedBy?: string;
  mentorName?: string;
}

export default function MyTasksPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sortBy, setSortBy] = useState<string>("deadline");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const viewMode = (searchParams.get("view") as "table" | "kanban") || "table";
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";

  const fetchData = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.items || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      showToast("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [session?.user, page, pageSize, search, status, priority]);

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

  const handleToggleView = (mode: "table" | "kanban") => {
    updateQueryParams({ view: mode, page: 1 });
  };

  const handleClearFilters = () => {
    updateQueryParams({ search: null, status: null, priority: null, page: 1 });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const getComparable = (task: Task): string | number => {
      if (sortBy === "deadline") {
        return new Date(task.deadline).getTime();
      }
      const value = task[sortBy as keyof Task];
      if (typeof value === "string") {
        return value.toLowerCase();
      }
      return value ?? "";
    };

    const aValue = getComparable(a);
    const bValue = getComparable(b);

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

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
        showToast("Task status updated", "success");
      } else {
        showToast("Failed to update status", "error");
      }
    } catch {
      showToast("Network error occurred", "error");
    }
  };

  const handleQuickView = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) setSelectedTask(task);
  };

  return (
    <DashboardLayout>
      <div className="w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              My Tasks
            </h1>
            <p className="text-sm text-content-secondary mt-1">View and manage your assigned tasks.</p>
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
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
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
                  value={search}
                  onChange={(e) => updateQueryParams({ search: e.target.value, page: 1 })}
                  className="input has-icon-left"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Status</label>
              <select
                value={status}
                onChange={(e) => updateQueryParams({ status: e.target.value, page: 1 })}
                className="select"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="label">Priority</label>
              <select
                value={priority}
                onChange={(e) => updateQueryParams({ priority: e.target.value, page: 1 })}
                className="select"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="label">&nbsp;</label>
              <button
                onClick={handleClearFilters}
                className="btn btn-ghost w-full flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Clear Filters
              </button>
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
            <div className="empty-state">
              <CheckCircle2 className="w-16 h-16 text-content-disabled mx-auto mb-6" />
              <h3 className="text-lg font-bold text-content-primary">No tasks assigned to you yet</h3>
              <p className="text-content-secondary mt-2 text-sm">Check back later for new assignments from your mentor.</p>
            </div>
          ) : viewMode === 'kanban' ? (
            <KanbanBoard
              tasks={tasks}
              onStatusChange={handleStatusChange}
              onQuickView={handleQuickView}
              interns={[{ id: (session?.user as { id: string })?.id, name: session?.user?.name as string }]}
            />
          ) : (
            <div className="table-container">
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>
                        <button
                          onClick={() => handleSort("title")}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          Title
                          {sortBy === "title" && (
                            sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th>
                        <button
                          onClick={() => handleSort("assignedBy")}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          Assigned By
                          {sortBy === "assignedBy" && (
                            sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th>
                        <button
                          onClick={() => handleSort("deadline")}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          Deadline
                          {sortBy === "deadline" && (
                            sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-center">
                        <button
                          onClick={() => handleSort("status")}
                          className="flex items-center gap-2 hover:text-primary transition-colors mx-auto"
                        >
                          Status
                          {sortBy === "status" && (
                            sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-center">
                        <button
                          onClick={() => handleSort("priority")}
                          className="flex items-center gap-2 hover:text-primary transition-colors mx-auto"
                        >
                          Priority
                          {sortBy === "priority" && (
                            sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTasks.map((task) => (
                      <tr key={task.id} className="group transition-all hover:bg-surface-muted">
                        <td className="min-w-62.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-content-primary group-hover:text-primary transition-colors tracking-tight text-base">{task.title}</span>
                            <span className="text-xs text-content-muted line-clamp-1">{task.description}</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-sm font-medium text-content-secondary">{task.mentorName || 'N/A'}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 text-content-primary font-medium text-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            {task.deadline}
                          </div>
                        </td>
                        <td>
                          <div className="flex justify-center">
                            <span className={`badge ${
                                task.status === "completed" ? "badge-success" :
                                task.status === "in-progress" ? "badge-primary" :
                                task.status === "review" ? "badge-warning" :
                                "badge-neutral"
                              }`}>
                              {task.status === "completed" ? "Completed" : 
                               task.status === "in-progress" ? "In Progress" : 
                               task.status === "review" ? "In Review" : 
                               "Pending"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex justify-center">
                            <span className={`badge ${
                                task.priority === "high" ? "badge-error" :
                                task.priority === "medium" ? "badge-warning" :
                                "badge-success"
                              }`}>
                              {task.priority}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleQuickView(task.id)}
                              className="btn btn-ghost btn-sm flex items-center gap-2"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                              View
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

      {/* Task Details Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Task Details"
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="label">Title</label>
                <p className="text-lg font-bold text-content-primary">{selectedTask.title}</p>
              </div>

              <div>
                <label className="label">Description</label>
                <p className="text-sm text-content-secondary leading-relaxed">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Assigned By</label>
                  <p className="text-sm font-medium text-content-primary">{selectedTask.mentorName || 'N/A'}</p>
                </div>

                <div>
                  <label className="label">Deadline</label>
                  <div className="flex items-center gap-2 text-content-primary font-medium">
                    <Clock className="w-4 h-4 text-primary" />
                    {selectedTask.deadline}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Priority</label>
                  <span className={`badge ${
                      selectedTask.priority === "high" ? "badge-error" :
                      selectedTask.priority === "medium" ? "badge-warning" :
                      "badge-success"
                    }`}>
                    {selectedTask.priority}
                  </span>
                </div>

                <div>
                  <label className="label">Current Status</label>
                  <span className={`badge ${
                      selectedTask.status === "completed" ? "badge-success" :
                      selectedTask.status === "in-progress" ? "badge-primary" :
                      selectedTask.status === "review" ? "badge-warning" :
                      "badge-neutral"
                    }`}>
                    {selectedTask.status === "completed" ? "Completed" : 
                     selectedTask.status === "in-progress" ? "In Progress" : 
                     selectedTask.status === "review" ? "In Review" : 
                     "Pending"}
                  </span>
                </div>
              </div>

              {/* Status Update Section */}
              <div className="pt-6 border-t border-border-subtle">
                <label className="label">Update Status</label>
                <div className="flex flex-wrap gap-3">
                  {selectedTask.status === "pending" && (
                    <button
                      onClick={() => {
                        handleStatusChange(selectedTask.id, "in-progress");
                      }}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Activity className="w-4 h-4" />
                      Start Task
                    </button>
                  )}
                  {selectedTask.status === "in-progress" && (
                    <>
                      <button
                        onClick={() => {
                          handleStatusChange(selectedTask.id, "review");
                        }}
                        className="btn btn-warning flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Submit for Review
                      </button>
                      <button
                        onClick={() => {
                          handleStatusChange(selectedTask.id, "completed");
                        }}
                        className="btn btn-success flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Complete
                      </button>
                    </>
                  )}
                  {selectedTask.status === "review" && (
                    <button
                      onClick={() => {
                        handleStatusChange(selectedTask.id, "in-progress");
                      }}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Activity className="w-4 h-4" />
                      Move to In Progress
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="btn btn-ghost"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
