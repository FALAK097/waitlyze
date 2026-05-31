import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(req) {
  const sessionCookie = getSessionCookie(req, {
    cookiePrefix: "ba",
  });
  const { pathname } = req.nextUrl;

  // Protect routes starting with /dashboard and /wait-lists
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/wait-lists");

  // Prevent logged-in users from visiting auth pages
  const isAuthRoute =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up");

  if (
    pathname.startsWith("/forms") ||
    pathname.startsWith("/api/waitlist")
  ) {
    return NextResponse.next();
  }

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
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
