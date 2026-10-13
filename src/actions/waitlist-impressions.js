"use server";

import prisma from "@/lib/prisma";
import { sessionActor } from "@/lib/workspaces/authorize";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export async function getWaitlistImpressions(waitListId) {
  try {
    const user = await sessionActor();
    const scope = campaignScope(user.id, "viewAudience");
    const where = Array.isArray(waitListId)
      ? { waitListId: { in: waitListId }, waitList: scope }
      : { waitListId, waitList: scope };

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
    const user = await sessionActor();
    const scope = campaignScope(user.id, "viewAudience");
    const where = Array.isArray(waitListId)
      ? { waitListId: { in: waitListId }, waitList: scope }
      : { waitListId, waitList: scope };

    const impressions = await prisma.impression.groupBy({
      by: ["country"],
      where,
      _count: {
        country: true,
      },
    });

    const formattedData = impressions
      .filter((imp) => imp.country)
      .map((imp) => ({
        name: imp.country,
        value: imp._count.country,
      }))
      .sort((a, b) => b.value - a.value);

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
