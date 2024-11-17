"use server";
import prisma from "@/lib/prisma";

export async function getWaitlistReferrals(waitlistId) {
	try {
		if (!waitlistId) {
			return {
				success: false,
				error: "Waitlist ID is required",
			};
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
