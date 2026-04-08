import React from 'react';
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function InternLoading() {
  return (
    <div className="animate-fade-in space-y-8">
      {/* Intern Info Bar Skeleton */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-6 card border-indigo-500/10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-indigo-500/20 rounded-lg animate-pulse" />
            <div className="h-3 w-32 bg-indigo-500/10 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-10 w-32 bg-(--deep-space-indigo) rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-(--deep-space-indigo) rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TableSkeleton rows={4} />
        </div>
        <div className="space-y-6">
          <StatCardSkeleton />
          <div className="h-full bg-card rounded-lg p-6 border border-border-default min-h-[300px]">
            <div className="h-6 w-32 bg-indigo-500/10 rounded-lg mb-6 animate-pulse" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/5 animate-pulse" />
                  <div className="h-3 w-48 bg-indigo-500/5 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
