/**
 * @fileoverview Centralized constants for the Intern Management System.
 * All magic strings, numbers, and configuration values should be defined here.
 */

// =============================================================================
// DEPARTMENT CONFIGURATION
// =============================================================================

/** Available departments in the organization */
export const DEPARTMENTS = [
  "AI",
  "ODOO", 
  "JAVA",
  "MOBILE",
  "SAP",
  "QC",
  "PHP",
  "RPA",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

// =============================================================================
// USER ROLES
// =============================================================================

/** User role types in the system */
export const USER_ROLES = ["admin", "mentor", "intern"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// =============================================================================
// TASK CONFIGURATION
// =============================================================================

/** Task status values matching database enum */
export const TASK_STATUSES = [
  "pending",
  "in-progress", 
  "review",
  "completed",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Task priority levels */
export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

// =============================================================================
// INTERN CONFIGURATION
// =============================================================================

/** Intern status values matching database enum */
export const INTERN_STATUSES = ["active", "inactive"] as const;
export type InternStatus = (typeof INTERN_STATUSES)[number];

// =============================================================================
// SESSION & AUTHENTICATION
// =============================================================================

/** Session expiry time in seconds (24 hours) */
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

/** OTP configuration */
export const OTP_EXPIRY_MINUTES = 10;
export const MAX_OTP_ATTEMPTS = 3;

// =============================================================================
// POLLING & REFRESH INTERVALS (milliseconds)
// =============================================================================

/** Calendar data polling interval */
export const CALENDAR_POLL_INTERVAL = 30000;

/** Dashboard stats refresh interval */
export const STATS_REFRESH_INTERVAL = 60000;

/** Activity feed refresh interval */
export const ACTIVITY_FEED_INTERVAL = 15000;

// =============================================================================
// PAGINATION
// =============================================================================

/** Default number of items per page */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum items per page */
export const MAX_PAGE_SIZE = 100;

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

/** Standard HTTP status codes for API responses */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// =============================================================================
// ERROR CODES
// =============================================================================

/** Application-specific error codes for client handling */
export const ERROR_CODES = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  RATE_LIMITED: "RATE_LIMITED",
  EMAIL_SEND_FAILED: "EMAIL_SEND_FAILED",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// =============================================================================
// VALIDATION PATTERNS
// =============================================================================

/** Email validation regex pattern */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Phone number validation pattern (basic) */
export const PHONE_PATTERN = /^[+]?[\d\s-()]{10,}$/;

/** Password minimum length */
export const PASSWORD_MIN_LENGTH = 8;

// =============================================================================
// UI CONFIGURATION
// =============================================================================

/** Maximum notifications to display simultaneously */
export const MAX_NOTIFICATIONS = 5;

/** Default notification duration in milliseconds */
export const NOTIFICATION_DURATION = 5000;

/** Sidebar collapsed width */
export const SIDEBAR_COLLAPSED_WIDTH = 80;

/** Sidebar expanded width */
export const SIDEBAR_EXPANDED_WIDTH = 280;

// =============================================================================
// REPORT CONFIGURATION
// =============================================================================

/** Maximum hours that can be reported per day */
export const MAX_DAILY_HOURS = 24;

/** Minimum hours for a valid report */
export const MIN_REPORT_HOURS = 0.5;
