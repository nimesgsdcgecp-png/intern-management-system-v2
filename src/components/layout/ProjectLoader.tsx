"use client";

import React from 'react';
import { Building } from 'lucide-react';

interface ProjectLoaderProps {
  fullPage?: boolean;
  text?: string;
}

/**
 * ProjectLoader using Design System v2.0 tokens.
 * Clean, minimal loading component — no gradients, glows, or colored shadows.
 */
export function ProjectLoader({ fullPage = true, text = "Loading..." }: ProjectLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${fullPage ? 'fixed inset-0 z-9999 bg-surface-app' : 'w-full min-h-[300px] p-12'}`}>
      <div className="relative">
        {/* Spinner ring */}
        <div className="w-20 h-20 rounded-full border-2 border-border-default border-t-primary animate-spin" />

        {/* Central icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center shadow-md">
            <Building className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {text && (
        <div className="mt-8 text-center animate-fade-in">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-content-secondary mb-2">
            Intern Management
          </h3>
          <p className="text-xs text-content-muted uppercase tracking-wide">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}
