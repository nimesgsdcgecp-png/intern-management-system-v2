"use client";

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: "default" | "interactive" | "stat";
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

/**
 * Card component using Design System v2.0 tokens.
 * Variants: default (static), interactive (clickable), stat (KPI metric)
 */
export function Card({
  children,
  title,
  subtitle,
  variant = "default",
  padding = "md",
  className = "",
  onClick,
  ...props
}: CardProps) {
  const isInteractive = variant === "interactive" || !!onClick;

  // Build class list based on variant
  const cardClasses = variant === "stat"
    ? "card-stat"
    : isInteractive
      ? `card card-interactive ${paddingStyles[padding]}`
      : `card ${paddingStyles[padding]}`;

  return (
    <div
      onClick={onClick}
      className={`${cardClasses} ${className}`}
      {...props}
    >
      {/* Header Section */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-content-primary">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-content-secondary mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Main Content */}
      {children}
    </div>
  );
}
