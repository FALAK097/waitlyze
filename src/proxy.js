import { NextResponse } from "next/server";

export function proxy(req) {
  const sessionToken = req.cookies.get("better-auth.session_token");
  const { pathname } = req.nextUrl;

  // Protect routes starting with /dashboard and /wait-lists
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/wait-lists");

  // Prevent logged-in users from visiting auth pages
  const isAuthRoute =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up");

  if (isProtectedRoute && !sessionToken) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (
    pathname.startsWith("/forms") ||
    pathname.startsWith("/api/waitlist")
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.ip ||
    req.headers.get("x-real-ip") ||
    "::1";
  res.headers.set("x-forwarded-for", ip);

  return res;
}

export const config = {
  matcher: ["/((?!.*\\..*|_next|forms).*)", "/", "/(api|trpc)(.*)"],
};
