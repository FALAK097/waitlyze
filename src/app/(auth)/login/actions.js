"use server";

import { signOut } from "@/lib/auth";

export async function doLogout() {
	await signOut({ redirectTo: "/login" });
}

export async function magicLinkSignIn(email) {
	try {
		// Here you would implement your magic link logic
		// For example:
		// 1. Generate a unique token
		// 2. Save the token and email in your database
		// 3. Send an email with a link containing the token

		// For now, we'll just simulate the process
		console.log(`Magic link sent to ${email}`);
		return { success: true };
	} catch (error) {
		console.error("Magic link error:", error);
		return { error: "Failed to send magic link." };
	}
}
