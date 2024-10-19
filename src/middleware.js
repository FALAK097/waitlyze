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

	// Check if the request is for a protected route
	if (isProtectedRoute(req)) {
		auth().protect();
	} else {
		// Check if the user has a unique ID cookie
		let uniqueUserId = cookies.get("unique_user_id");

		if (!uniqueUserId) {
			// Generate a new unique ID if the cookie is not present
			uniqueUserId = nanoid();

			// Set a cookie with the unique ID
			res.cookies.set("unique_user_id", uniqueUserId, {
				httpOnly: true,
				maxAge: 60 * 60 * 24 * 365, // 1 year
			});
		}
	}

	return res;
});

export const config = {
	matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
