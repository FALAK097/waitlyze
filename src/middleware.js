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
  const geo = req.geo || {};
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.ip ||
    req.headers.get("x-real-ip") ||
    "::1";

  res.headers.set("x-country", geo.country || "");
  res.headers.set("x-city", geo.city || "");
  res.headers.set("x-region", geo.region || "");
  res.headers.set("x-latitude", geo.latitude?.toString() || "");
  res.headers.set("x-longitude", geo.longitude?.toString() || "");
  res.headers.set("x-ip", ip);

  return res;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next|forms).*)", "/", "/(api|trpc)(.*)"],
};
