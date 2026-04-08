'use client';

import { AccessDenied } from '@/components/ui/AccessDenied';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <AccessDenied />
      </div>
    </div>
  );
}
