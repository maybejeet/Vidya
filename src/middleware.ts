import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  
  // Check if user is authenticated with proper session data
  const isLoggedIn = !!(
    req.auth && 
    req.auth.user &&
    req.auth.user.id && 
    req.auth.user.email && 
    req.auth.user.googleId &&
    typeof req.auth.user.id === 'string' &&
    req.auth.user.id.length > 0
  );

  // Debug logging
  console.log(`Middleware: ${pathname}`);
  console.log('Has req.auth:', !!req.auth);
  console.log('req.auth type:', typeof req.auth);
  console.log('Has user:', !!req.auth?.user);
  console.log('User keys:', req.auth?.user ? Object.keys(req.auth.user) : 'no user');
  console.log('User ID:', req.auth?.user?.id || 'missing');
  console.log('User Email:', req.auth?.user?.email || 'missing');
  console.log('Final isLoggedIn:', isLoggedIn);

  // Define protected routes that require authentication
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/classroom") ||
    pathname.startsWith("/api/classroom") ||
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/logs") ||
    pathname.startsWith("/api/user");

  // Define auth routes that authenticated users shouldn't access
  const isAuthRoute = pathname === "/login" || pathname === "/signup" || pathname === "/";

  // Redirect unauthenticated users from protected routes to login
  if (!isLoggedIn && isProtectedRoute) {
    console.log(`Middleware: Redirecting unauthenticated user from ${pathname} to /login`);
    const loginUrl = new URL("/login", nextUrl);
    // Add callback URL for redirect after login
    if (pathname !== "/login") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isLoggedIn && isAuthRoute) {
    console.log(`Middleware: Redirecting authenticated user from ${pathname} to /dashboard`);
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Allow access to auth API routes, static files, etc.
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth/error page
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public|auth/error).*)",
  ],
};