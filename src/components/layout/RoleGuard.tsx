'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { AccessDenied } from '../ui/AccessDenied';
import { Skeleton } from '../ui/Skeleton';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const userRole = (session?.user as { role?: string })?.role?.toUpperCase();
  const isAllowed = allowedRoles.some(role => role.toUpperCase() === userRole);

  if (!isAllowed) {
    return <AccessDenied requiredRole={allowedRoles.join(' or ')} />;
  }

  return <>{children}</>;
};
