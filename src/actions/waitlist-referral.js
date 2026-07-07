"use server";
import prisma from "@/lib/prisma";
import { requireAuth, verifyWaitlistOwnership } from "@/lib/auth-utils";

export async function getWaitlistReferrals(waitlistId) {
	try {
		const user = await requireAuth();
		if (!user) {
			return { success: false, error: "Unauthorized" };
		}

		if (!waitlistId) {
			return {
				success: false,
				error: "Waitlist ID is required",
			};
		}

		const owned = await verifyWaitlistOwnership(waitlistId, user.id);
		if (!owned) {
			return { success: false, error: "Unauthorized" };
		}

		const referrals = await prisma.referral.groupBy({
			by: ["referredById"],
			_count: {
				signUpId: true,
			},
			where: {
				signUp: {
					waitListId: waitlistId,
				},
			},
		});

		return {
			success: true,
			data: referrals,
		};
	} catch (error) {
		console.error("Error fetching waitlist referrals:", error);
		return {
			success: false,
			error: "Failed to fetch referrals",
		};
	}
}
