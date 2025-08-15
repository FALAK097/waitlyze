"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function updateOnboardingStatus(userId) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return { success: false, error: "Authentication required" };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        clerkUserId: clerkUser.id,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isOnboarded: true },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating onboarding status:", error);
    return { success: false, error: error.message };
  }
}
