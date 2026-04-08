import React from 'react';
import { StatCardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="animate-fade-in space-y-8">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-64 bg-surface-muted rounded-lg animate-pulse" />
        <div className="h-4 w-96 bg-surface-muted rounded-lg animate-pulse" />
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Lower Section Skeleton */}
      <div className="h-[300px] w-full bg-surface-muted rounded-lg border border-border-default animate-pulse" />
    </div>
  );
}
