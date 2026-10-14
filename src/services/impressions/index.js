import prisma from "@/lib/prisma";

export const createImpression = async (data) => {
	const waitList = await prisma.waitList.findUnique({
		where: {
			id: data.waitListId,
			status: "PUBLISHED",
		},
	});
	if (!waitList) {
		throw new Error("Invalid WaitList ID");
	}
	// Check if impression already exists for this user and waitlist
	const existingImpression = await prisma.impression.findFirst({
		where: {
			AND: [
				{ uniqueUserId: data.uniqueUserId },
				{ waitListId: data.waitListId },
			],
		},
	});

	if (existingImpression) {
		return existingImpression;
	}
	// Remove waitListId from data
	const finalData = Object.fromEntries(
		Object.entries(data).filter(([key]) => key !== "waitListId"),
	);

	try {
		const impression = await prisma.impression.create({
			data: {
				...finalData,
				waitList: {
					connect: { id: data.waitListId },
				},
			},
		});
		return impression;
	} catch (error) {
		// A concurrent request (double-fired tracker, retry) may win the insert
		// race; the unique [waitListId, uniqueUserId] pair makes this idempotent.
		if (error?.code !== "P2002") throw error;
		return prisma.impression.findFirst({
			where: {
				AND: [
					{ uniqueUserId: data.uniqueUserId },
					{ waitListId: data.waitListId },
				],
			},
		});
	}
};
