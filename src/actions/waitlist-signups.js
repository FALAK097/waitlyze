"use server";
import prisma from "@/lib/prisma";

export async function getWaitlistSignups(waitlistId) {
	try {
		if (!waitlistId) {
			return {
				success: false,
				error: "Waitlist ID is required",
			};
		}

		const waitlist = await prisma.waitList.findUnique({
			where: {
				id: waitlistId,
			},
		});

		if (!waitlist) {
			return {
				success: false,
				error: "Waitlist not found",
			};
		}

		const signups = await prisma.signUp.findMany({
			where: {
				waitListId: waitlistId,
			},
			include: {
				impression: true,
				waitList: {
					select: {
						name: true,
						description: true,
					},
				},
				referrals: true,
			},
			orderBy: {
				id: "desc",
			},
		});

		const transformedSignups = signups.map((signup) => {
			const referralCount = signup.referrals.length;
			let priority;

			if (referralCount > 5) {
				priority = "High";
			} else if (referralCount > 0 && referralCount <= 5) {
				priority = "Medium";
			} else {
				priority = "Low";
			}

			return {
				id: signup.id,
				name: signup.email,
				email: signup.email,
				priority,
				city: signup.city,
				country: signup.country,
				device: signup.device,
				deviceType: signup.deviceType,
				waitlistName: signup.waitList.name,
				signUpEmailSent: signup.signUpEmailSent,
			};
		});

		return {
			success: true,
			data: transformedSignups,
		};
	} catch (error) {
		console.error("Error fetching waitlist signups:", error);
		return {
			success: false,
			error: "Failed to fetch signups",
		};
	}
}
