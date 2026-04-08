import React from 'react';
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function MentorLoading() {
  return (
    <div className="animate-fade-in space-y-8">
      {/* Mentor Welcome Skeleton */}
      <div className="dm-card p-8 rounded-4xl bg-linear-to-r from-indigo-600/10 to-purple-600/10 border-indigo-500/20">
        <div className="h-8 w-64 bg-indigo-500/20 rounded-xl mb-4 animate-pulse" />
        <div className="h-4 w-96 bg-indigo-500/10 rounded-lg animate-pulse" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Interns List Table Skeleton */}
      <div className="pt-4">
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}
