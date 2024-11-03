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
			},
			orderBy: {
				id: "desc",
			},
		});

		const transformedSignups = signups.map((signup) => ({
			id: signup.id,
			name: signup.email,
			email: signup.email,
			priority: getPriorityFromSignup(signup),
			city: signup.city,
			country: signup.country,
			device: signup.device,
			deviceType: signup.deviceType,
			waitlistName: signup.waitList.name,
		}));

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

function getPriorityFromSignup(signup) {
	if (signup.impression?.device?.includes("Mobile")) {
		return "High";
	}
	if (signup.country === "US" || signup.country === "CA") {
		return "Medium";
	}
	return "Low";
}
