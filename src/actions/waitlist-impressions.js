"use server";

import prisma from "@/lib/prisma";

export async function getWaitlistImpressions(waitListId) {
  try {
    const where = Array.isArray(waitListId)
      ? { waitListId: { in: waitListId } }
      : { waitListId };

    const impressions = await prisma.impression.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      success: true,
      data: impressions,
    };
  } catch (error) {
    console.error("Error fetching impressions:", error);
    return {
      success: false,
      error: "Failed to fetch impressions",
    };
  }
}
