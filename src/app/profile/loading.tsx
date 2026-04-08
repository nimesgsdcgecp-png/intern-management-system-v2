import React from 'react';
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-12 animate-fade-in">
      {/* Profile Header Skeleton */}
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
        <Skeleton className="w-32 h-32 rounded-3xl" />
        <div className="space-y-4 pt-4">
          <Skeleton className="w-64 h-10" />
          <div className="flex gap-4">
            <Skeleton className="w-32 h-5 rounded-full" />
            <Skeleton className="w-24 h-5 rounded-full" />
          </div>
        </div>
      </div>

      {/* Profile Form Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
             <Skeleton className="w-32 h-4" />
             <Skeleton className="w-full h-12 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Button Skeleton */}
      <div className="flex justify-end pt-6">
        <Skeleton className="w-48 h-12 rounded-xl" />
      </div>
    </div>
  );
}
