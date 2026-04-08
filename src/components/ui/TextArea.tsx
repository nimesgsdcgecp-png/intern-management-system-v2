"use client";

import React, { useId } from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * TextArea component using Design System v2.0 tokens.
 * Uses .input class (on textarea) with .form-group, .label, .form-hint, .form-error classes.
 */
export function TextArea({
  label,
  error,
  hint,
  className = "",
  value,
  disabled = false,
  required = false,
  rows = 4,
  ...props
}: TextAreaProps) {
  const textAreaId = useId();

  return (
    <div className={`form-group ${className}`}>
      {/* Label */}
      {label && (
        <label htmlFor={textAreaId} className="label">
          {label}
          {required && <span className="text-error-text ml-1">*</span>}
        </label>
      )}

      <textarea
        id={textAreaId}
        disabled={disabled}
        rows={rows}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${textAreaId}-error` : hint ? `${textAreaId}-hint` : undefined}
        className="input"
        value={value}
        {...props}
      />

      {/* Hint text */}
      {hint && !error && (
        <span id={`${textAreaId}-hint`} className="form-hint">
          {hint}
        </span>
      )}

      {/* Error message */}
      {error && (
        <span id={`${textAreaId}-error`} className="form-error">
          {error}
        </span>
      )}
    </div>
  );
}
