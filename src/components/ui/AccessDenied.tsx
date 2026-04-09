'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft, LayoutDashboard, User } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from './Button';
import type { UserRole } from '@/lib/constants';

interface AccessDeniedProps {
  requiredRole?: string;
}

/**
 * Get the appropriate dashboard path based on user role
 */
function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'mentor':
      return '/dashboard/mentor';
    case 'intern':
      return '/dashboard/intern';
    default:
      return '/';
  }
}

/**
 * Format role name for display
 */
function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRole }) => {
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;
  
  // Parse URL parameters if available (set by middleware)
  const [requiredRoles, setRequiredRoles] = React.useState<string[]>([]);
  const [currentRole, setCurrentRole] = React.useState<string>('');
  
  React.useEffect(() => {
    // Check URL parameters for role context
    const params = new URLSearchParams(window.location.search);
    const required = params.get('required');
    const current = params.get('current');
    
    if (required) {
      setRequiredRoles(required.split(','));
    } else if (requiredRole) {
      setRequiredRoles([requiredRole]);
    }
    
    if (current) {
      setCurrentRole(current);
    } else if (userRole) {
      setCurrentRole(userRole);
    }
  }, [requiredRole, userRole]);
  
  // Build the message based on available context
  const getMessage = () => {
    if (requiredRoles.length > 0 && currentRole) {
      const formattedRequired = requiredRoles.map(formatRole).join(' or ');
      const formattedCurrent = formatRole(currentRole);
      
      if (requiredRoles.length === 1) {
        return (
          <>
            This page is restricted to <span className="font-semibold text-red-600 dark:text-red-400">{formattedRequired}</span> users only.
            <br />
            You are currently logged in as <span className="font-semibold text-slate-900 dark:text-white">{formattedCurrent}</span>.
          </>
        );
      } else {
        return (
          <>
            This page requires <span className="font-semibold text-red-600 dark:text-red-400">{formattedRequired}</span> access.
            <br />
            Your current role is <span className="font-semibold text-slate-900 dark:text-white">{formattedCurrent}</span>.
          </>
        );
      }
    } else if (currentRole) {
      return (
        <>
          You do not have the necessary permissions to access this area.
          <br />
          Current role: <span className="font-semibold text-slate-900 dark:text-white">{formatRole(currentRole)}</span>
        </>
      );
    } else {
      return "You do not have the necessary permissions to access this specific area of the platform.";
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl shadow-red-500/5">
          <ShieldAlert className="w-16 h-16 text-red-500" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
        Access Denied
      </h1>
      
      <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8 text-lg leading-relaxed">
        {getMessage()}
      </p>
      
      {/* Role context card (if we have role information) */}
      {currentRole && (
        <div className="mb-8 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 max-w-xs">
          <div className="flex items-center justify-center gap-2 text-sm">
            <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300">
              Logged in as <span className="font-semibold">{formatRole(currentRole)}</span>
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Button 
          variant="secondary"
          onClick={() => window.history.back()}
          className="group w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Go Back
        </Button>
        
        {userRole ? (
          <Link href={getDashboardPath(userRole)} passHref>
            <Button className="w-full sm:w-auto">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Go to My Dashboard
            </Button>
          </Link>
        ) : (
          <Link href="/" passHref>
            <Button className="w-full sm:w-auto">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Home Dashboard
            </Button>
          </Link>
        )}
      </div>

      <div className="mt-12 text-sm text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-8 w-full max-w-xs">
        System ID: IMS-403-AUTH
      </div>
    </div>
  );
};
