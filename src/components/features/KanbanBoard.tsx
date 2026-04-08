"use client";

import React from "react";
import { Clock, Activity, CheckSquare, Calendar, Users, ArrowRight } from "lucide-react";

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

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (id: string, newStatus: string) => void;
  onQuickView: (id: string) => void;
  interns: { id: string, name: string }[];
}

const COLUMNS = [
  { id: "pending", label: "Queued", icon: <Clock className="w-4 h-4" />, style: "bg-surface-muted text-content-secondary" },
  { id: "in-progress", label: "Executing", icon: <Activity className="w-4 h-4" />, style: "bg-primary-subtle text-primary-text" },
  { id: "review", label: "Review", icon: <Users className="w-4 h-4" />, style: "bg-warning-subtle text-warning-text" },
  { id: "completed", label: "Finished", icon: <CheckSquare className="w-4 h-4" />, style: "bg-success-subtle text-success-text" },
];

export function KanbanBoard({ tasks, onStatusChange, onQuickView, interns }: KanbanBoardProps) {
  const getInternNames = (task: Task) => {
    if (task.assignedToAll) return "All Interns";
    const ids = task.assignedInterns || [];
    if (ids.length === 0) return "Unassigned";
    return ids.length > 2 
      ? `${ids.length} Interns` 
      : ids.map(id => interns.find(i => i.id === id)?.name).filter(Boolean).join(", ");
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return "badge badge-error";
      case "medium": return "badge badge-warning";
      default: return "badge badge-neutral";
    }
  };

  const getPriorityStrip = (priority: string) => {
    switch (priority) {
      case "high": return "bg-error";
      case "medium": return "bg-warning";
      default: return "bg-surface-muted";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
      {COLUMNS.map((col) => (
        <div key={col.id} className="flex flex-col h-full bg-surface-muted rounded-lg p-4 border border-border-default">
          {/* Column Header */}
          <div className="flex items-center justify-between px-2 py-3 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${col.style} flex items-center justify-center`}>
                {col.icon}
              </div>
              <h3 className="text-sm font-semibold text-content-primary uppercase tracking-wide">{col.label}</h3>
            </div>
            <span className="text-xs font-medium text-content-muted bg-surface-card px-2 py-1 rounded-full border border-border-default">
              {tasks.filter(t => t.status === col.id).length}
            </span>
          </div>

          {/* Cards Area */}
          <div 
            className="flex-1 space-y-3 overflow-y-auto max-h-[800px] p-1 transition-colors rounded-lg"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("bg-primary-subtle");
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove("bg-primary-subtle");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("bg-primary-subtle");
              const taskId = e.dataTransfer.getData("taskId");
              if (taskId) {
                onStatusChange(taskId, col.id);
              }
            }}
          >
            {tasks
              .filter((t) => t.status === col.id)
              .map((task, index) => (
                <div
                  key={task.id}
                  onClick={() => onQuickView(task.id)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("taskId", task.id);
                  }}
                  className="card card-interactive p-4 cursor-grab active:cursor-grabbing group relative overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  {/* Priority Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${getPriorityStrip(task.priority)}`} />
                  
                  <div className="flex flex-col gap-3 pl-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-sm font-semibold text-content-primary leading-tight group-hover:text-primary transition-colors">
                        {task.title}
                      </h4>
                      <span className={`${getPriorityBadge(task.priority)} text-[10px]`}>
                        {task.priority}
                      </span>
                    </div>

                    <p className="text-xs text-content-muted line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border-subtle">
                      <div className="flex items-center gap-1.5 text-xs text-content-muted">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-content-muted">
                        <Users className="w-3 h-3" />
                        {getInternNames(task)}
                      </div>
                    </div>

                    {/* Status Advancement Button */}
                    {col.id !== "completed" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          let nextStatus = "in-progress";
                          if (col.id === "in-progress") nextStatus = "review";
                          if (col.id === "review") nextStatus = "completed";
                          onStatusChange(task.id, nextStatus);
                        }}
                        className="btn btn-ghost btn-sm w-full mt-1 flex items-center justify-center gap-2"
                      >
                        Move to {col.id === "pending" ? "Executing" : col.id === "in-progress" ? "Review" : "Finished"}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
