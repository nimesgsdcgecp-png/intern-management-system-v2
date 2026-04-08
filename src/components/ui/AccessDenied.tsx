'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from './Button';

interface AccessDeniedProps {
  requiredRole?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRole }) => {
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
        {requiredRole 
          ? `This area is restricted to ${requiredRole}s only. You don't have the necessary permissions to view this page.`
          : "You don't have the necessary permissions to access this specific area of the platform."}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Button 
          variant="secondary"
          onClick={() => window.history.back()}
          className="group w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Go Back
        </Button>
        <Link href="/" passHref>
          <Button className="w-full sm:w-auto">
            <Home className="w-4 h-4 mr-2" />
            Home Dashboard
          </Button>
        </Link>
      </div>

      <div className="mt-12 text-sm text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-8 w-full max-w-xs">
        System ID: IMS-403-AUTH
      </div>
    </div>
  );
};
