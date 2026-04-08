"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon" | "icon-sm";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

/**
 * Button component using Design System v2.0 tokens.
 * Variants: primary, secondary, ghost, destructive
 * Sizes: sm, md (default), lg, icon, icon-sm
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Build class list
  const variantClass = variant === "destructive"
    ? "btn-destructive"
    : `btn-${variant}`;

  const sizeClass = size === "md" ? "" : `btn-${size}`;

  return (
    <button
      disabled={isDisabled}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      aria-disabled={isDisabled}
      {...props}
    >
      {/* Loading Spinner */}
      {loading && (
        <span className="spinner spinner-sm" />
      )}

      {/* Left Icon */}
      {!loading && icon && iconPosition === "left" && (
        <span className="shrink-0">{icon}</span>
      )}

      <span className="truncate">{children}</span>

      {/* Right Icon */}
      {!loading && icon && iconPosition === "right" && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );
}
