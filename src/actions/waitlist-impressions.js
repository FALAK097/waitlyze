"use server";
import prisma from "@/lib/prisma";

export async function getWaitlistImpressions(waitlistId) {
	if (!waitlistId) {
		return {
			success: false,
			error: "Waitlist ID is required",
		};
	}

	try {
		const impressions = await prisma.impression.findMany({
			where: {
				waitListId: waitlistId,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return {
			success: true,
			data: impressions,
		};
	} catch (error) {
		console.error("Failed to fetch waitlist impressions:", error);
		return {
			success: false,
			error: "Failed to fetch impressions",
		};
	}
}
