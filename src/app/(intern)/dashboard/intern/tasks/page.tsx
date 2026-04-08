"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KanbanBoard } from "@/components/features/KanbanBoard";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { FileText, Target, Clock, Layout, Grid, CheckCircle2, Timer, Activity, ShieldCheck, ClipboardList, Search } from "lucide-react";
import { StatsGrid } from "@/components/ui/StatsGrid";
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

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "12");
  const viewMode = (searchParams.get("view") as "table" | "kanban") || "kanban";
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const fetchData = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.items || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      showToast("Sync failed", "error");
    } finally {
      setLoading(false);
    }
  }, [session?.user, page, pageSize, search, status]);

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
        showToast(`Task ${newStatus}`, "success");
      } else {
        showToast("Update failed", "error");
      }
    } catch {
      showToast("Check your connection", "error");
    }
  };

  const handleQuickView = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) setSelectedTask(task);
  };

  const statsData = [
    {
      label: "To Do",
      value: loading ? "..." : tasks.filter(t => t.status === 'pending').length.toString(),
      icon: <Timer />,
      color: "blue" as const,
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
      <div className="space-y-12 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl font-extrabold text-content-primary tracking-tight uppercase">
              My <span className="text-indigo-600">Tasks</span>
            </h1>
            <p className="text-content-secondary mt-1 font-medium italic">Track progress and hit your milestones.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black flex items-center gap-3 border border-indigo-100 uppercase tracking-widest shadow-sm">
                <Target className="w-4 h-4" />
                WORKSPACE ACTIVE
             </div>
          </div>
        </div>

        <StatsGrid stats={statsData} loading={loading} />

        <div className="bg-surface-card rounded-lg p-8 border border-border-subtle shadow-sm mb-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto">
              <div className="relative group w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                <input
                  placeholder="Task title..."
                  value={search}
                  onChange={(e) => updateQueryParams({ search: e.target.value, page: 1 })}
                  className="input has-icon-left"
                />
              </div>
              <div className="flex p-1 bg-surface-muted rounded-2xl border border-border-subtle h-[46px] w-full md:w-auto">
                <button
                  onClick={() => updateQueryParams({ view: "table" })}
                  className={`flex-1 md:px-6 flex items-center justify-center gap-2 rounded-xl transition-all ${viewMode === "table" ? "bg-surface-card shadow-sm text-indigo-600 border border-border-subtle" : "text-content-muted hover:text-content-secondary"}`}
                >
                  <Layout className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Table</span>
                </button>
                <button
                  onClick={() => updateQueryParams({ view: "kanban" })}
                  className={`flex-1 md:px-6 flex items-center justify-center gap-2 rounded-xl transition-all ${viewMode === "kanban" ? "bg-surface-card shadow-sm text-indigo-600 border border-border-subtle" : "text-content-muted hover:text-content-secondary"}`}
                >
                  <Grid className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Kanban</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6">
               <div className="text-right hidden sm:block">
                  <h3 className="text-sm font-black text-content-primary uppercase tracking-tighter">Current Status</h3>
                  <p className="text-[10px] font-black text-content-muted uppercase tracking-widest">Filters applied: {status || 'none'}</p>
               </div>
               <select 
                 value={status}
                 onChange={(e) => updateQueryParams({ status: e.target.value, page: 1 })}
                 className="input"
               >
                 <option value="">All Tasks</option>
                 <option value="pending">Queued</option>
                 <option value="in-progress">Building</option>
                 <option value="review">Audit</option>
                 <option value="completed">Live</option>
               </select>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-indigo-600">
              <div className="premium-spinner mb-6"></div>
              <p className="text-sm font-black text-content-muted uppercase tracking-widest">Retrieving Workflow...</p>
            </div>
          ) : tasks.length === 0 ? (
            <Card className="text-center py-32 rounded-lg border-dashed border-2 border-border-subtle bg-surface-muted/20">
              <ClipboardList className="w-20 h-20 text-content-muted mx-auto mb-8 opacity-20" />
              <h3 className="text-2xl font-black text-content-primary mb-2 uppercase tracking-tight">No Tasks Discovered</h3>
              <p className="text-content-secondary max-w-sm mx-auto font-medium tracking-tight mb-8">You&apos;re all caught up. Check back later for new assignments.</p>
            </Card>
          ) : (
            <div className="mt-8">
              {viewMode === "table" ? (
                <div className="bg-surface-card rounded-lg border border-border-subtle overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface-muted/50 border-b border-border-subtle">
                          <th className="px-8 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">Task Objective</th>
                          <th className="px-6 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">Deadline</th>
                          <th className="px-6 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em] text-center">Priority</th>
                          <th className="px-8 py-5 text-[10px] font-black text-content-muted uppercase tracking-[0.2em] text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {tasks.map((task) => (
                          <tr key={task.id} className="group transition-all duration-300 cursor-pointer hover:bg-surface-muted/30" onClick={() => handleQuickView(task.id)}>
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-content-primary group-hover:text-indigo-600 transition-colors tracking-tight text-base uppercase">{task.title}</span>
                                <span className="text-xs text-content-muted font-medium line-clamp-1">{task.description}</span>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <div className="flex items-center gap-3 font-bold text-xs text-content-secondary tracking-tight">
                                <Clock className="w-4 h-4 text-indigo-400" /> {task.deadline}
                              </div>
                            </td>
                            <td className="px-6 py-6 text-center">
                              <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                task.priority === "high" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                task.priority === "medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                "badge badge-success border-transparent"
                              }`}>
                                {task.priority}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center justify-end gap-3 font-bold text-xs text-content-secondary uppercase tracking-tight">
                                <div className={`w-2 h-2 rounded-full ${task.status === "completed" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : task.status === "in-progress" ? "bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" : "bg-gray-300"}`} />
                                {task.status}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <KanbanBoard 
                  tasks={tasks} 
                  onStatusChange={handleStatusChange} 
                  onQuickView={handleQuickView}
                  interns={[{ id: (session?.user as { id: string })?.id, name: session?.user?.name as string }]}
                />
              )}

              <div className="mt-12">
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

        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title="Workflow Briefing"
          size="lg"
        >
          {selectedTask && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-surface-muted p-10 rounded-lg border border-border-subtle shadow-sm relative overflow-hidden group">
                <div className="z-10 space-y-3">
                  <p className="text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">Priority Matrix</p>
                  <span className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 border ${
                    selectedTask.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    selectedTask.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'badge badge-success border-transparent'
                  }`}>
                    <Target className="w-4 h-4" />
                    {selectedTask.priority}
                  </span>
                </div>
                <div className="z-10 text-left md:text-right space-y-3">
                  <p className="text-[10px] font-black text-content-muted uppercase tracking-[0.2em]">Target Date</p>
                  <div className="flex items-center md:justify-end gap-3 font-black text-lg text-content-primary uppercase tracking-tight">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    {selectedTask.deadline}
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                  <ClipboardList className="w-32 h-32 text-indigo-600" />
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="btn btn-primary">
                    <ClipboardList className="w-8 h-8" />
                  </div>
                  <h4 className="text-3xl font-black text-content-primary tracking-tighter uppercase">{selectedTask.title}</h4>
                </div>
                <div className="bg-surface-muted rounded-lg p-10 border border-border-subtle relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-700">
                      <FileText className="w-32 h-32 text-indigo-600" />
                   </div>
                   <p className="text-sm font-medium text-content-secondary leading-relaxed relative z-10 italic">
                     &quot;{selectedTask.description}&quot;
                   </p>
                </div>
              </div>

              <div className="pt-10 border-t border-border-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4 text-[10px] font-black text-content-muted uppercase tracking-widest">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  SUPERVISOR: <span className="text-content-primary uppercase">{selectedTask.mentorName || 'Lead Mentor'}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black text-content-muted uppercase tracking-widest">
                  <Activity className="w-6 h-6 text-indigo-500" />
                  PIPELINE: <span className="text-content-primary uppercase">{selectedTask.status}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-5 pt-8">
                {selectedTask.status === "pending" && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedTask.id, "in-progress");
                      setSelectedTask({ ...selectedTask, status: "in-progress" });
                    }}
                    className="btn btn-primary"
                  >
                    <Activity className="w-4 h-4" />
                    Commence Work
                  </button>
                )}
                {selectedTask.status === "in-progress" && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedTask.id, "completed");
                      setSelectedTask({ ...selectedTask, status: "completed" });
                    }}
                    className="px-10 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all outline-none flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Success
                  </button>
                )}
                <button
                  onClick={() => setSelectedTask(null)}
                  className="btn btn-primary"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>

      <style jsx global>{`
        .premium-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </DashboardLayout>
  );
}
