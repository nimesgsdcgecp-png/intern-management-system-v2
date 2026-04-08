/**
 * @fileoverview Authentication and authorization guard utilities.
 * Provides reusable functions for protecting API routes.
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth";
import { unauthorized, forbidden } from "./responseHelper";
import type { UserRole } from "../constants";

// =============================================================================
// TYPES
// =============================================================================

/** Extended user type with role information */
export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
  department?: string;
}

/** Authentication check result */
export interface AuthResult {
  authenticated: boolean;
  user: AuthUser | null;
}

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

/**
 * Checks if the current request is authenticated.
 * Returns the user object if authenticated, null otherwise.
 * 
 * @returns Authentication result with user data
 * 
 * @example
 * const { authenticated, user } = await getAuthUser();
 * if (!authenticated) return unauthorized();
 */
export async function getAuthUser(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { authenticated: false, user: null };
  }
  
  const user = session.user as AuthUser;
  
  return { 
    authenticated: true, 
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    }
  };
}

/**
 * Requires authentication and returns user or error response.
 * Use this in API routes that require any authenticated user.
 * 
 * @returns User object if authenticated, or unauthorized response
 * 
 * @example
 * export async function GET(req: Request) {
 *   const auth = await requireAuth();
 *   if ('error' in auth) return auth.error;
 *   const { user } = auth;
 * }
 */
export async function requireAuth(): Promise<{ user: AuthUser } | { error: ReturnType<typeof unauthorized> }> {
  const { authenticated, user } = await getAuthUser();
  
  if (!authenticated || !user) {
    return { error: unauthorized() };
  }
  
  return { user };
}

// =============================================================================
// AUTHORIZATION FUNCTIONS
// =============================================================================

/**
 * Checks if user has one of the allowed roles.
 * 
 * @param user - The authenticated user
 * @param allowedRoles - Array of roles that are permitted
 * @returns true if user has an allowed role
 */
export function hasRole(user: AuthUser, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Requires authentication AND one of the specified roles.
 * Use this for role-restricted endpoints.
 * 
 * @param allowedRoles - Array of roles that can access the endpoint
 * @returns User object if authorized, or appropriate error response
 * 
 * @example
 * export async function POST(req: Request) {
 *   const auth = await requireRole(["admin"]);
 *   if ('error' in auth) return auth.error;
 * }
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<{ user: AuthUser } | { error: ReturnType<typeof unauthorized> | ReturnType<typeof forbidden> }> {
  const authResult = await requireAuth();
  
  if ('error' in authResult) {
    return authResult;
  }
  
  const { user } = authResult;
  
  if (!hasRole(user, allowedRoles)) {
    return { error: forbidden(`This action requires one of these roles: ${allowedRoles.join(", ")}`) };
  }
  
  return { user };
}

/** Requires admin role. Shortcut for requireRole(["admin"]). */
export async function requireAdmin() {
  return requireRole(["admin"]);
}

/** Requires admin or mentor role. */
export async function requireAdminOrMentor() {
  return requireRole(["admin", "mentor"]);
}

// =============================================================================
// RESOURCE OWNERSHIP
// =============================================================================

/**
 * Checks if user owns a resource or has admin privileges.
 * 
 * @param user - The authenticated user
 * @param resourceOwnerId - The ID of the resource owner
 * @returns true if user can access the resource
 */
export function canAccessResource(user: AuthUser, resourceOwnerId: string): boolean {
  if (user.role === "admin") return true;
  return user.id === resourceOwnerId;
}

/**
 * Checks if a mentor can access an intern's data.
 * Mentors can only access data for interns assigned to them.
 * 
 * @param user - The authenticated user
 * @param internMentorId - The mentor ID assigned to the intern
 * @returns true if user can access the intern's data
 */
export function canAccessIntern(user: AuthUser, internMentorId: string | null): boolean {
  if (user.role === "admin") return true;
  if (user.role === "mentor") return internMentorId === user.id;
  return false;
}
