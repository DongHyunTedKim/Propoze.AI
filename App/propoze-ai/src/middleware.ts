import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Check if user has required role for admin routes
    if (pathname.startsWith("/admin")) {
      if (!token?.roles?.includes("admin")) {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }

    // Add more role-based checks as needed
    // Example: Check for specific permissions
    // if (pathname.startsWith("/proposals/create")) {
    //   if (!token?.permissions?.includes("proposal:create")) {
    //     return NextResponse.redirect(new URL("/403", req.url));
    //   }
    // }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    // Protected routes that require authentication
    "/dashboard/:path*",
    "/proposals/:path*",
    "/projects/:path*",
    "/admin/:path*",
    "/api/proposals/:path*",
    "/api/projects/:path*",
    "/api/ai/:path*",
    // Add more protected routes as needed
  ],
};
