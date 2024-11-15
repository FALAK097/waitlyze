import prisma from "@/lib/prisma";

export const createSignUp = async (signupData, referralId) => {
	const waitList = await prisma.waitList.findUnique({
		where: {
			id: signupData.waitListId,
		},
	});
	if (!waitList) {
		throw new Error("Invalid WaitList ID");
	}

	const signUp = await prisma.signUp.create({
		data: {
			...signupData,
		},
	});

	// create referral
	if (referralId) {
		const referredBy = await prisma.signUp.findUnique({
			where: {
				uniqueUserId: referralId,
			},
		});
		if (referredBy)
			await prisma.referral.create({
				data: {
					signUpId: signUp.id,
					referredById: referredBy.id,
				},
			});
	}

	// Get all sign ups for this wait list with their referral counts
	const allSignUps = await prisma.signUp.findMany({
		where: {
			waitListId: signupData.waitListId,
		},
		include: {
			// Include both referrals made and referrals received
			referrals: true,
			referredBy: true,
		},
		orderBy: [
			{
				rank: "asc",
			},
		],
	});

	// Sort sign ups by total referrals (desc), createdAt (asc), then existing rank (asc)
	const sortedSignUps = allSignUps.sort((a, b) => {
		// Count total referrals (both made and received) for each signup
		const aTotalReferrals = a.referrals.length + a.referredBy.length;
		const bTotalReferrals = b.referrals.length + b.referredBy.length;

		// First compare by total referrals (descending)
		const referralDiff = bTotalReferrals - aTotalReferrals;
		if (referralDiff !== 0) return referralDiff;

		// Then compare by createdAt timestamp (ascending)
		const createdAtDiff = a.createdAt.getTime() - b.createdAt.getTime();
		if (createdAtDiff !== 0) return createdAtDiff;

		// Finally compare by existing rank if other criteria are equal
		const rankDiff =
			(a.rank || Number.POSITIVE_INFINITY) -
			(b.rank || Number.POSITIVE_INFINITY);
		return rankDiff;
	});

	// Update ranks for all sign ups based on new sorting
	await Promise.all(
		sortedSignUps.map((signup, index) => {
			return prisma.signUp.update({
				where: { id: signup.id },
				data: { rank: index + 1 },
			});
		}),
	);

	// get updated sign up with new rank
	const updatedSignUp = await prisma.signUp.findUnique({
		where: { id: signUp.id },
		include: {
			referrals: true,
			referredBy: true,
		},
	});

	return updatedSignUp;
};
