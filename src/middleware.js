import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/wait-lists(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
  const res = NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/forms")) return NextResponse.next();

  const ip =
    req.headers.get("x-forwarded-for") ||
    req.ip ||
    req.headers.get("x-real-ip") ||
    "::1";
  res.headers.set("x-forwarded-for", ip);

  return res;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next|forms).*)", "/", "/(api|trpc)(.*)"],
};
