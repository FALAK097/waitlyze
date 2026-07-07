"use server";

import prisma from "@/lib/prisma";
import { requireAuth, verifyWaitlistOwnership } from "@/lib/auth-utils";

async function authorizeWaitlistAccess(waitListId) {
  const user = await requireAuth();
  if (!user) return null;

  if (Array.isArray(waitListId)) {
    const owned = await prisma.waitList.count({
      where: { id: { in: waitListId }, userId: user.id },
    });
    if (owned !== waitListId.length) return null;
  } else {
    const owned = await verifyWaitlistOwnership(waitListId, user.id);
    if (!owned) return null;
  }

  return user;
}

export async function getWaitlistImpressions(waitListId) {
  try {
    const user = await authorizeWaitlistAccess(waitListId);
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

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

export async function getGeographicDistribution(waitListId) {
  try {
    const user = await authorizeWaitlistAccess(waitListId);
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const where = Array.isArray(waitListId)
      ? { waitListId: { in: waitListId } }
      : { waitListId };

    const impressions = await prisma.impression.groupBy({
      by: ["country"],
      where,
      _count: {
        country: true,
      },
    });

    const formattedData = [];
    for (const imp of impressions) {
      if (imp.country) {
        formattedData.push({
          name: imp.country,
          value: imp._count.country,
        });
      }
    }
    formattedData.sort((a, b) => b.value - a.value);

    return {
      success: true,
      data: formattedData,
    };
  } catch (error) {
    console.error("Error fetching geographic distribution:", error);
    return {
      success: false,
      error: "Failed to fetch geographic distribution",
    };
  }
}
