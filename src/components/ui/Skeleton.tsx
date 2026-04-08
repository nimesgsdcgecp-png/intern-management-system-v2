"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton loading placeholder using Design System v2.0 tokens.
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-surface-muted rounded-md animate-pulse ${className}`}
    />
  );
}

/**
 * StatCard skeleton for loading states.
 */
export function StatCardSkeleton() {
  return (
    <div className="card-stat">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="w-20 h-3" />
          <Skeleton className="w-16 h-8" />
        </div>
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Chart skeleton for loading states.
 */
export function ChartSkeleton() {
  return (
    <div className="card p-6 h-[400px] flex flex-col">
      <div className="flex justify-between mb-6">
        <Skeleton className="w-40 h-5" />
        <Skeleton className="w-20 h-5 rounded-full" />
      </div>
      <div className="flex-1 flex flex-col gap-4">
        <Skeleton className="w-full flex-1 rounded-lg" />
        <div className="flex justify-between gap-4">
          <Skeleton className="w-full h-3" />
          <Skeleton className="w-full h-3" />
          <Skeleton className="w-full h-3" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table skeleton for loading states.
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="table-container">
      {/* Header */}
      <div className="p-4 border-b border-border-default flex gap-4 bg-surface-muted">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-full h-4" />
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="p-4 flex gap-4 border-b border-border-subtle">
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-full h-4" />
        </div>
      ))}
    </div>
  );
}
