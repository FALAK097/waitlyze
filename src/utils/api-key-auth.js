import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function validateApiKeyAndGetWaitlist(apiKey, waitlistId) {
  try {
    if (!apiKey || !apiKey.startsWith("wl_")) {
      return { success: false, error: "Invalid API key format" };
    }

    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        keyHash: true,
        userId: true,
        user: {
          select: {
            waitLists: {
              where: {
                id: waitlistId,
              },
              select: {
                id: true,
                name: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    for (const key of apiKeys) {
      const isValid = await bcrypt.compare(apiKey, key.keyHash);
      if (isValid) {
        const waitlist = key.user.waitLists.find((wl) => wl.id === waitlistId);
        if (waitlist) {
          return {
            success: true,
            waitlist,
            userId: key.userId,
          };
        }
      }
    }

    return {
      success: false,
      error: "Invalid API key or unauthorized waitlist access",
    };
  } catch (error) {
    console.error("API key validation error:", error);
    return { success: false, error: "Authentication failed" };
  }
}
