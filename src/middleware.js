import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
	"/dashboard(.*)",
	"/wait-lists(.*)",
]);

export default clerkMiddleware((auth, req) => {
	const res = NextResponse.next(); // Initialize response
	const { cookies } = req;

	// Check if the session has a unique ID cookie
	let uniqueUserId = cookies.get("hypeSession");

	if (!uniqueUserId) {
		// Generate a new unique ID if the cookie is not present
		uniqueUserId = nanoid();

		// Set a cookie with the unique ID
		res.cookies.set("hypeSession", uniqueUserId, {
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 365, // 1 year
		});
	}

	// Check if the request is for a protected route
	if (isProtectedRoute(req)) {
		auth().protect();
	}

	return res;
});

export const config = {
	matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
