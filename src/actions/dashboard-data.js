"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function getDashboardData() {
	try {
		const clerkUser = await currentUser();

		if (!clerkUser) {
			return {
				success: false,
				error: "User not authenticated",
			};
		}

		const user = await prisma.user.findUnique({
			where: {
				clerkUserId: clerkUser.id,
			},
			include: {
				waitLists: true,
			},
		});

		if (!user) {
			return {
				success: false,
				error: "User not found",
			};
		}

		const waitLists = await prisma.waitList.findMany({
			where: {
				userId: user.id,
			},
		});

		return {
			success: true,
			data: {
				user,
				waitLists,
				waitListIds: user.waitLists.map((waitList) => waitList.id),
			},
		};
	} catch (error) {
		console.error("Error fetching dashboard data:", error);
		return {
			success: false,
			error: "Failed to fetch dashboard data",
		};
	}
}
