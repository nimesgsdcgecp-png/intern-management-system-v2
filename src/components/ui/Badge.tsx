"use client";

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "primary" | "neutral";
  className?: string;
}

/**
 * Badge component using Design System v2.0 tokens.
 * Variants map to status colors:
 * - success: Active, Approved, Completed
 * - warning: Pending, Under Review, Expiring
 * - error: Inactive, Rejected, Overdue
 * - info: New, Updated, Invited
 * - primary: Admin, Mentor (role indicators)
 * - neutral: Draft, Archived, Unknown
 */
export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = "neutral", 
  className = "" 
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};
