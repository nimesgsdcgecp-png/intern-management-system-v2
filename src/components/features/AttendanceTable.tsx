"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Clock, AlertCircle, Calendar } from "lucide-react";
import { Pagination } from "../ui/Pagination";

interface AttendanceTableProps {
  mode?: "personal" | "all";
  date?: string;
  department?: string;
  month?: number;
  year?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

interface AttendanceLog {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: string | null;
  status: string;
  department?: string;
  user?: {
    name?: string;
    profile?: {
      name?: string | null;
      department?: string | null;
    } | null;
    department?: string;
  };
}

export function AttendanceTable({ 
  mode = "all", 
  date = new Date().toISOString().split('T')[0],
  department = "",
  month,
  year,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange
}: AttendanceTableProps) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      
      if (mode === "all") {
        params.set("all", "true");
        params.set("date", date);
        if (department) params.set("department", department);
      } else {
        params.set("history", "true");
        if (month && year) {
          params.set("month", month.toString());
          params.set("year", year.toString());
        }
      }
      
      const response = await fetch(`/api/attendance?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        
        let items = data.items || [];
        items = items.map((l: AttendanceLog) => {
          const userObj = l.user || {};
          const profile = userObj.profile || userObj || {};
          return {
            ...l,
            user: {
              ...userObj,
              profile: {
                name: profile.name || userObj.name || "Unknown Intern",
                department: profile.department || userObj.department || l.department || "General"
              }
            }
          };
        });
        
        setLogs(items);
        setTotalCount(data.totalCount || 0);
      } else {
        setError("Synchronization failed");
      }
    } catch {
      setError("Network interruption");
    } finally {
      setLoading(false);
    }
  }, [mode, date, department, month, year, page, pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center gap-4">
       <div className="spinner spinner-lg" />
       <p className="text-xs font-medium text-content-muted">Loading attendance data...</p>
    </div>
  );

  if (error) return (
    <div className="py-16 text-center">
       <AlertCircle className="w-12 h-12 text-error mx-auto mb-4 opacity-50" />
       <p className="text-xs font-medium text-error">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="table-container">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Intern</th>
                <th>Date</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Duration</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr 
                  key={log.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar avatar-sm">
                        {log.user?.profile?.name?.[0] || log.user?.name?.[0] || "U"}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-content-primary block">
                          {log.user?.profile?.name || log.user?.name || "Unknown Intern"}
                        </span>
                        {mode === "all" && (
                           <span className="badge badge-primary text-xs">
                              {log.user?.profile?.department || log.user?.department || "General"}
                           </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-content-secondary">
                      <Calendar className="w-3.5 h-3.5" />
                      {log.date}
                    </div>
                  </td>
                  <td>
                     <div className="flex items-center gap-2 text-content-primary">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        {log.clock_in ? new Date(log.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Pending"}
                     </div>
                  </td>
                  <td>
                     <div className="flex items-center gap-2 text-content-secondary">
                        <div className="w-2 h-2 rounded-full bg-error opacity-50" />
                        {log.clock_out ? new Date(log.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active"}
                     </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {log.total_hours || "0.00"}H
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={log.status === 'present' ? 'badge badge-success' : 'badge badge-error'}>
                      {log.status === 'present' ? 'Verified' : 'Absent'}
                    </span>
                  </td>
                </tr>
              ))}
              
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <Calendar className="w-10 h-10 text-content-muted" />
                       <div>
                          <p className="text-sm font-medium text-content-secondary mb-1">No attendance records found</p>
                          <p className="text-xs text-content-muted">Try adjusting your filters or date selection.</p>
                       </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(onPageChange || onPageSizeChange) && totalCount > pageSize && (
        <Pagination
          currentPage={page}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange || (() => {})}
          onPageSizeChange={onPageSizeChange || (() => {})}
        />
      )}
    </div>
  );
}
