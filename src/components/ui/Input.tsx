"use client";

import React, { useState, useId } from "react";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

/**
 * Input component using Design System v2.0 tokens.
 * Uses .input class with .form-group, .label, .form-hint, .form-error classes.
 */
export function Input({
  type = "text",
  label,
  required = false,
  className = "",
  error,
  success,
  hint,
  disabled = false,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  value,
  placeholder,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = useId();

  const isPassword = type === "password";
  const actualType = isPassword && showPassword ? "text" : type;

  return (
    <div className={`form-group ${className}`}>
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {required && <span className="text-error-text ml-1">*</span>}
        </label>
      )}

      {/* Input wrapper for icons */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">
            {leftIcon}
          </div>
        )}

        {/* Input Field */}
        <input
          id={inputId}
          type={actualType}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={`
            input
            ${leftIcon ? "has-icon-left" : ""}
            ${(rightIcon || (isPassword && showPasswordToggle) || error || success) ? "has-icon-right" : ""}
          `}
          value={value}
          {...props}
        />

        {/* Right Action/Icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="btn btn-ghost btn-icon-sm text-content-muted hover:text-content-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {rightIcon && <div className="text-content-muted">{rightIcon}</div>}
          {error && <AlertCircle className="w-4 h-4 text-error-text" />}
          {success && !error && <CheckCircle className="w-4 h-4 text-success-text" />}
        </div>
      </div>

      {/* Hint text */}
      {hint && !error && (
        <span id={`${inputId}-hint`} className="form-hint">
          {hint}
        </span>
      )}

      {/* Error message */}
      {error && (
        <span id={`${inputId}-error`} className="form-error">
          {error}
        </span>
      )}

      {/* Success message */}
      {success && !error && (
        <span className="text-xs text-success-text">
          {success}
        </span>
      )}
    </div>
  );
}
