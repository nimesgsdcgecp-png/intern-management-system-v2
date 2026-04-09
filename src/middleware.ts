import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { UserRole } from '@/lib/constants';

/**
 * Protected route configuration
 * Maps URL path prefixes to the roles allowed to access them
 */
const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  // Admin-only routes
  '/dashboard/admin': ['admin'],
  '/api/admin': ['admin'],
  '/api/mentors': ['admin'],
  '/api/activity': ['admin'],
  
  // Mentor routes
  '/dashboard/mentor': ['mentor'],
  
  // Intern routes
  '/dashboard/intern': ['intern'],
  
  // Shared routes (all authenticated users)
  '/dashboard/calendar': ['admin', 'mentor', 'intern'],
  '/profile': ['admin', 'mentor', 'intern'],
  
  // API routes with mixed access
  '/api/interns': ['admin', 'mentor'],
  '/api/tasks': ['admin', 'mentor', 'intern'],
  '/api/reports': ['admin', 'mentor', 'intern'],
  '/api/attendance': ['admin', 'mentor', 'intern'],
  '/api/events': ['admin', 'mentor', 'intern'],
  '/api/profile': ['admin', 'mentor', 'intern'],
};

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/verify-otp',
  '/auth/reset-password',
  '/access-denied',
  '/api/auth',
];

/**
 * Check if a given path matches any of the protected route prefixes
 */
function getRequiredRoles(pathname: string): UserRole[] | null {
  // Check exact match first
  if (PROTECTED_ROUTES[pathname]) {
    return PROTECTED_ROUTES[pathname];
  }
  
  // Check prefix matches (longer prefixes first to handle nested routes)
  const sortedPrefixes = Object.keys(PROTECTED_ROUTES).sort((a, b) => b.length - a.length);
  
  for (const prefix of sortedPrefixes) {
    if (pathname.startsWith(prefix)) {
      return PROTECTED_ROUTES[prefix];
    }
  }
  
  return null;
}

/**
 * Check if a path is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a path is an API route
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api');
}

/**
 * Middleware function to protect routes based on authentication and authorization
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes to pass through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Get the user's token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  });
  
  // Check if the route requires authentication
  const requiredRoles = getRequiredRoles(pathname);
  
  // If this is a protected route
  if (requiredRoles) {
    // Not authenticated - redirect to login
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      
      // For API routes, return 401 instead of redirect
      if (isApiRoute(pathname)) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }
      
      return NextResponse.redirect(loginUrl);
    }
    
    // Authenticated but wrong role - deny access
    const userRole = token.role as UserRole;
    if (!requiredRoles.includes(userRole)) {
      // For API routes, return 403 instead of redirect
      if (isApiRoute(pathname)) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      
      // For page routes, redirect to access-denied with context
      const deniedUrl = new URL('/access-denied', request.url);
      deniedUrl.searchParams.set('required', requiredRoles.join(','));
      deniedUrl.searchParams.set('current', userRole);
      return NextResponse.redirect(deniedUrl);
    }
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

/**
 * Matcher configuration for middleware
 * Excludes Next.js internal routes and static assets
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
