import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
	"/dashboard(.*)",
	"/wait-lists(.*)",
]);

export default clerkMiddleware((auth, req) => {
	const res = NextResponse.next(); // Initialize response

	if (req.nextUrl.pathname.startsWith("/forms")) return NextResponse.next();

	// Check if the request is for a protected route
	if (isProtectedRoute(req)) {
		auth().protect();
	}

	return res;
});

export const config = {
	matcher: ["/((?!.*\\..*|_next|forms).*)", "/", "/(api|trpc)(.*)"],
};
