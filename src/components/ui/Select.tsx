"use client";

import React, { useId } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  children?: React.ReactNode;
}

/**
 * Select component using Design System v2.0 tokens.
 * Uses .select class with .form-group, .label, .form-hint, .form-error classes.
 */
export function Select({
  label,
  error,
  hint,
  className = "",
  options,
  children,
  value,
  disabled = false,
  required = false,
  ...props
}: SelectProps) {
  const selectId = useId();

  return (
    <div className={`form-group ${className}`}>
      {/* Label */}
      {label && (
        <label htmlFor={selectId} className="label">
          {label}
          {required && <span className="text-error-text ml-1">*</span>}
        </label>
      )}

      <select
        id={selectId}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
        className="select"
        value={value}
        {...props}
      >
        {options ? options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        )) : children}
      </select>

      {/* Hint text */}
      {hint && !error && (
        <span id={`${selectId}-hint`} className="form-hint">
          {hint}
        </span>
      )}

      {/* Error message */}
      {error && (
        <span id={`${selectId}-error`} className="form-error">
          {error}
        </span>
      )}
    </div>
  );
}
