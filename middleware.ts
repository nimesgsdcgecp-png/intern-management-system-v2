import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const isAuth = !!token;
    
    // 1. Redirect authenticated users away from public auth pages
    if (pathname.startsWith("/auth/login") && isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 2. Role-based Access Control (RBAC) Logic
    const role = token?.role as string;

    // Admin-only sectors (Attendance allowed for mentors)
    if (pathname.startsWith("/dashboard/admin")) {
      if (role !== "admin" && !(role === "mentor" && pathname === "/dashboard/admin/attendance")) {
        return NextResponse.redirect(new URL("/access-denied", req.url));
      }
    }

    // Mentor sectors (Admins authorized)
    if (pathname.startsWith("/dashboard/mentor")) {
        if (role !== "mentor" && role !== "admin") {
          return NextResponse.redirect(new URL("/access-denied", req.url));
        }
    }

    // Intern sectors (Admins authorized)
    if (pathname.startsWith("/dashboard/intern")) {
        if (role !== "intern" && role !== "admin") {
          return NextResponse.redirect(new URL("/access-denied", req.url));
        }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Publicly accessible paths (Landing page and auth flows)
        if (pathname === "/" || pathname.startsWith("/auth/")) {
          return true;
        }

        // Everything else requires at least a valid session
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
