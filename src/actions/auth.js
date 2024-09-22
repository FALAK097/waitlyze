"use server";

import { signOut } from "@/lib/auth";

export async function doLogout() {
	await signOut({ redirectTo: "/login" });
}
