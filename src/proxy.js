import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(req) {
  const hostname = req.headers.get("host")?.split(":")[0]?.toLowerCase().replace(/\.$/, "");
  const appRoot = process.env.APP_ROOT_DOMAIN?.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const isPlatformHost = !hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".vercel.app");
  const isAppHost = appRoot && (hostname === appRoot || hostname.endsWith(`.${appRoot}`));
  const { pathname } = req.nextUrl;
  if (appRoot && !isPlatformHost && !isAppHost && pathname !== "/domain" && !pathname.startsWith("/api") && !pathname.startsWith("/_next/")) {
    const target = req.nextUrl.clone();
    target.pathname = "/domain";
    target.search = "";
    return NextResponse.rewrite(target);
  }
  const sessionCookie = getSessionCookie(req, {
    cookiePrefix: "ba",
  });
  // Protect routes starting with /dashboard and /wait-lists
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/wait-lists") || pathname.startsWith("/settings");

  if (
    pathname.startsWith("/forms") ||
    pathname.startsWith("/api/waitlist")
  ) {
    return NextResponse.next();
  }

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/", req.url));
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
