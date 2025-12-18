import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require authentication
const protectedRoutes = ["/dashboard"];

// Routes only accessible to unauthenticated users
const authRoutes = ["/login", "/register", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update session and get user
  const { user, supabaseResponse } = await updateSession(request);

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
