"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { cache } from "react";

export const getDashboardData = cache(async () => {
  try {
    const { userId, redirectToSignIn } = await auth();

    const user = await prisma.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      include: {
        waitLists: true,
      },
    });

    if (!user) redirectToSignIn();

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
});
