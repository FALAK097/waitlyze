import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { env } from "./lib/env.mjs";

export async function middleware(req) {
	const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });
	const isAuth = !!token;
	const isAuthPage =
		req.nextUrl.pathname.startsWith("/login") ||
		req.nextUrl.pathname.startsWith("/register") ||
		req.nextUrl.pathname.startsWith("/reset-pass/") ||
		req.nextUrl.pathname.startsWith("/forgot-pass");

	const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
	const isApi = req.nextUrl.pathname.startsWith("/api/v1");

	// Allow public API routes
	if (
		isApi &&
		["/api/v1/contact", "/api/v1/forgot-pass", "/api/v1/reset-pass"].includes(
			req.nextUrl.pathname,
		)
	) {
		return null;
	}

	// Protect API routes
	if (isApi && !isAuth) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Redirect authenticated users from auth pages to dashboard
	if (isAuthPage && isAuth) {
		return NextResponse.redirect(new URL("/dashboard", req.url));
	}

	// Allow access to auth pages
	if (isAuthPage) {
		return null;
	}

	// Protect admin pages
	if (isAdminPage && (!isAuth || token.role.name !== "admin")) {
		return NextResponse.redirect(new URL("/dashboard", req.url));
	}

	// Protect authenticated routes
	if (!isAuth) {
		let from = req.nextUrl.pathname;
		if (req.nextUrl.search) {
			from += req.nextUrl.search;
		}
		return NextResponse.redirect(
			new URL(`/login?from=${encodeURIComponent(from)}`, req.url),
		);
	}

	// Allow access to authenticated users
	return null;
}

export const config = {
	matcher: [
		"/dashboard/:path*",
		"/admin/:path*",
		"/profile/:path*",
		"/login",
		"/register",
		"/reset-pass/:path*",
		"/forgot-pass",
		"/api/v1/:path*",
	],
};
