import prisma from "@/lib/prisma";

export const createImpression = async (data) => {
	const waitList = await prisma.waitList.findUnique({
		where: {
			id: data.waitListId,
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

	const impression = await prisma.impression.create({
		data: {
			...finalData,
			waitList: {
				connect: { id: data.waitListId },
			},
		},
	});
	return impression;
};
