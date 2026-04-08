"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}

/**
 * StatCard component using Design System v2.0 tokens.
 * Uses .card-stat class for KPI / metric display.
 */
export function StatCard({
  label,
  value,
  icon,
}: StatCardProps) {
  return (
    <div className="card-stat">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">
            {label}
          </p>
          <p className="text-3xl font-bold text-content-primary mt-2">
            {value}
          </p>
        </div>

        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-subtle text-primary-text">
            {React.isValidElement(icon) 
              ? React.cloneElement(icon as React.ReactElement<{ size?: number; strokeWidth?: number }>, { size: 20, strokeWidth: 2 }) 
              : icon}
          </div>
        )}
      </div>
    </div>
  );
}
