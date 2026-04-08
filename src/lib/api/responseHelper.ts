/**
 * @fileoverview Standardized API response helpers for consistent response formats.
 * All API routes should use these helpers instead of manual NextResponse.json() calls.
 */

import { NextResponse } from "next/server";
import { HTTP_STATUS, ERROR_CODES, type ErrorCode } from "../constants";

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** Standard success response structure */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/** Standard error response structure */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: ErrorCode;
}

// =============================================================================
// SUCCESS RESPONSES
// =============================================================================

/**
 * Creates a standardized success response.
 * 
 * @param data - The response payload
 * @param message - Optional success message
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with standardized format
 * 
 * @example
 * return successResponse({ users: [...] }, "Users fetched successfully");
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = HTTP_STATUS.OK
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Creates a response for successful resource creation.
 * 
 * @param data - The created resource
 * @param message - Optional success message
 * @returns NextResponse with 201 status
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<SuccessResponse<T>> {
  return successResponse(data, message, HTTP_STATUS.CREATED);
}

// =============================================================================
// ERROR RESPONSES
// =============================================================================

/**
 * Creates a standardized error response.
 * 
 * @param error - Error message
 * @param status - HTTP status code (default: 500)
 * @param code - Application error code for client handling
 * @returns NextResponse with error format
 * 
 * @example
 * return errorResponse("User not found", 404, "NOT_FOUND");
 */
export function errorResponse(
  error: string,
  status: number = HTTP_STATUS.INTERNAL_ERROR,
  code?: ErrorCode
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error,
      ...(code && { code }),
    },
    { status }
  );
}

// =============================================================================
// COMMON ERROR SHORTCUTS
// =============================================================================

/**
 * Returns a 401 Unauthorized response.
 * Use when user is not authenticated.
 */
export function unauthorized(message: string = "Authentication required"): NextResponse<ErrorResponse> {
  return errorResponse(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED);
}

/**
 * Returns a 403 Forbidden response.
 * Use when user lacks required permissions.
 */
export function forbidden(message: string = "Insufficient permissions"): NextResponse<ErrorResponse> {
  return errorResponse(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.INSUFFICIENT_PERMISSIONS);
}

/**
 * Returns a 404 Not Found response.
 * 
 * @param entity - Name of the entity that wasn't found
 */
export function notFound(entity: string = "Resource"): NextResponse<ErrorResponse> {
  return errorResponse(`${entity} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
}

/**
 * Returns a 400 Bad Request response.
 * Use for validation errors or malformed requests.
 */
export function badRequest(message: string): NextResponse<ErrorResponse> {
  return errorResponse(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
}

/**
 * Returns a 409 Conflict response.
 * Use when a resource already exists.
 */
export function conflict(message: string = "Resource already exists"): NextResponse<ErrorResponse> {
  return errorResponse(message, HTTP_STATUS.CONFLICT, ERROR_CODES.DUPLICATE_ENTRY);
}

/**
 * Returns a 429 Too Many Requests response.
 * Use for rate limiting.
 */
export function rateLimited(message: string = "Too many requests, please try again later"): NextResponse<ErrorResponse> {
  return errorResponse(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMITED);
}

/**
 * Returns a 500 Internal Server Error response.
 * Use for unexpected server errors.
 */
export function serverError(message: string = "An unexpected error occurred"): NextResponse<ErrorResponse> {
  return errorResponse(message, HTTP_STATUS.INTERNAL_ERROR, ERROR_CODES.DATABASE_ERROR);
}

// =============================================================================
// ERROR HANDLER WRAPPER
// =============================================================================

/**
 * Wraps an async API handler with standardized error handling.
 * Catches any thrown errors and returns appropriate error responses.
 * 
 * @param handler - The async API handler function
 * @returns Wrapped handler with error catching
 * 
 * @example
 * export const GET = withErrorHandler(async (req) => {
 *   const data = await fetchData();
 *   return successResponse(data);
 * });
 */
export function withErrorHandler<T>(
  handler: (request: Request) => Promise<NextResponse<T>>
) {
  return async (request: Request): Promise<NextResponse<T | ErrorResponse>> => {
    try {
      return await handler(request);
    } catch (error) {
      console.error("API Error:", error);

      if (error instanceof Error) {
        return serverError(error.message) as NextResponse<ErrorResponse>;
      }

      return serverError() as NextResponse<ErrorResponse>;
    }
  };
}
