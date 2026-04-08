"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ClipboardList, Search, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  user?: {
    profile?: {
      name?: string;
    };
  };
  metadata: Record<string, unknown>;
}

const ACTION_TYPES = ["all", "create", "update", "delete"];

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/activity");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  return (
    <DashboardLayout>
      <div className="w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              Activity Logs
            </h1>
            <p className="text-sm text-content-secondary mt-1">
              Track all actions and events across the platform.
            </p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="card p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 lg:col-span-2">
              <label className="label">Search Logs</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted group-focus-within:text-primary transition-colors pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by action, user, or entity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input has-icon-left"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Action Type</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="select"
              >
                {ACTION_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Actions" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="label">&nbsp;</label>
              <button
                onClick={() => { setSearchQuery(""); setActionFilter("all"); }}
                className="btn btn-secondary w-full"
              >
                <Filter className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="section">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-content-primary flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Log Entries
                </h2>
                <span className="text-sm text-content-secondary">
                  {filteredLogs.length} record{filteredLogs.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="table-container">
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Entity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        Array(5).fill(0).map((_, i) => (
                          <tr key={i}>
                            <td colSpan={4}><TableSkeleton rows={1} /></td>
                          </tr>
                        ))
                      ) : filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                          <tr
                            key={log.id}
                            className={`cursor-pointer ${selectedLog?.id === log.id ? 'bg-primary-subtle' : ''}`}
                            onClick={() => setSelectedLog(log)}
                          >
                            <td>
                              <div className="flex flex-col">
                                <span className="font-medium text-content-primary">
                                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-xs text-content-muted">
                                  {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="avatar avatar-sm">
                                  {(log.user?.profile?.name || "S").charAt(0)}
                                </div>
                                <span className="text-sm text-content-primary">
                                  {log.user?.profile?.name || "System"}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${
                                log.action.includes('delete') ? 'badge-error' :
                                log.action.includes('update') ? 'badge-warning' :
                                log.action.includes('create') ? 'badge-success' :
                                'badge-primary'
                              }`}>
                                {log.action.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td>
                              <div className="flex flex-col">
                                <span className="text-sm text-content-primary">{log.entity_type}</span>
                                <span className="text-xs text-content-muted font-mono">
                                  {log.entity_id?.slice(0, 8)}...
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-16">
                            <ClipboardList className="w-12 h-12 text-content-disabled mx-auto mb-4" />
                            <p className="text-content-muted font-medium">No activity logs found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            <div className="section sticky top-8">
              <AnimatePresence mode="wait">
                {selectedLog ? (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-content-primary">
                        Log Details
                      </h3>
                      <button 
                        onClick={() => setSelectedLog(null)} 
                        className="btn btn-ghost btn-sm btn-icon-delete"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="label mb-2">Event Data</label>
                        <div className="bg-slate-900 rounded-lg p-4 overflow-hidden">
                          <pre className="text-emerald-400 text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[300px]">
                            {JSON.stringify(selectedLog.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-surface-muted rounded-lg">
                          <div className="text-xs text-content-muted uppercase tracking-wider mb-1">Type</div>
                          <div className="text-sm font-semibold text-content-primary">{selectedLog.entity_type}</div>
                        </div>
                        <div className="p-4 bg-surface-muted rounded-lg">
                          <div className="text-xs text-content-muted uppercase tracking-wider mb-1">Impact</div>
                          <div className={`text-sm font-bold ${selectedLog.action.includes('delete') ? 'text-error-text' : 'text-primary-text'}`}>
                            {selectedLog.action.includes('delete') ? 'Deletion' : 'Modification'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <ClipboardList className="w-12 h-12 text-content-disabled mb-4" />
                    <p className="text-sm text-content-muted max-w-[200px]">
                      Select a log entry to view details
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
