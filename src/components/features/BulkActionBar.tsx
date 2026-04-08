"use client";

import React from "react";
import { Trash2, X, Download } from "lucide-react";
import { Button } from "../ui/Button";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  onExport?: () => void;
  actions?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: "primary" | "secondary" | "destructive" | "ghost";
  }[];
}

export function BulkActionBar({ 
  selectedCount, 
  onClear, 
  onDelete, 
  onExport,
  actions = []
}: BulkActionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl animate-fade-in-up">
      <div className="bg-surface-nav border border-border-default rounded-lg p-4 shadow-overlay flex items-center justify-between gap-6">
        <div className="flex items-center gap-4 pl-2">
          <div className="w-10 h-10 rounded-lg bg-primary-subtle flex items-center justify-center text-primary-text border border-primary-border">
            <span className="text-sm font-bold">{selectedCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-content-nav text-xs font-semibold uppercase tracking-wide">Items Selected</span>
            <button 
              onClick={onClear}
              className="text-content-muted hover:text-content-nav text-xs flex items-center gap-1 mt-0.5 transition-colors group"
            >
              <X className="w-3 h-3 group-hover:rotate-90 transition-transform" /> Clear Selection
            </button>
          </div>
        </div>

        <div className="h-8 w-px bg-border-default hidden sm:block" />

        <div className="flex items-center gap-2 pr-2">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant || "secondary"}
              size="sm"
              onClick={action.onClick}
              className="flex items-center gap-2"
            >
              {action.icon}
              <span className="hidden md:inline">{action.label}</span>
            </Button>
          ))}

          {onExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> 
              <span className="hidden md:inline">Export</span>
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> 
            <span>Delete</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
