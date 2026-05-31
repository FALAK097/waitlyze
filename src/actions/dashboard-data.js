"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache } from "react";

export const getDashboardData = cache(async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
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
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        showReferrals: true,
        signUps: {
          select: {
            signUpEmailSent: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        user,
        waitLists,
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
