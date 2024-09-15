import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const isAuthPage =
      req.nextUrl.pathname.startsWith("/login") ||
      req.nextUrl.pathname.startsWith("/register") ||
      req.nextUrl.pathname.startsWith("/reset-pass/") ||
      req.nextUrl.pathname.startsWith("/forgot-pass");

    const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
    const isApi = req.nextUrl.pathname.startsWith("/api/v1");

    if (isApi && req.nextUrl.pathname === "/api/v1/contact") {
      return null;
    }

    if (isApi && req.nextUrl.pathname === "/api/v1/forgot-pass") {
      return null;
    }

    if (isApi && req.nextUrl.pathname === "/api/v1/reset-pass") {
      return null;
    }

    if (isApi && !isAuth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/app", req.url));
      }

      return null;
    }

    if (isAdminPage && isAuth && token.role.name !== "admin") {
      return NextResponse.redirect(new URL("/app", req.url));
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      );
    }
  },
  {
    callbacks: {
      async authorized() {
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/app/:path*",
    "/login",
    "/register",
    "/admin",
    "/api/v1/:path*",
    "/profile",
  ],
};
