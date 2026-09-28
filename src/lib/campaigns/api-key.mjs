import bcrypt from "bcryptjs";

export async function validatePublishedApiKey(apiKey, waitlistId, db) {
  try {
    if (!apiKey || !apiKey.startsWith("wl_")) return { success: false, error: "Invalid API key format" };
    const apiKeys = await db.apiKey.findMany({
      select: { id: true, keyHash: true, userId: true, user: { select: { waitLists: {
        where: { id: waitlistId, status: "PUBLISHED" },
        select: { id: true, name: true, userId: true },
      } } } },
    });
    for (const key of apiKeys) {
      if (await bcrypt.compare(apiKey, key.keyHash)) {
        const waitlist = key.user.waitLists.find((item) => item.id === waitlistId);
        if (waitlist) return { success: true, waitlist, userId: key.userId };
      }
    }
    return { success: false, error: "Invalid API key or unauthorized waitlist access" };
  } catch (error) {
    console.error("API key validation error:", error);
    return { success: false, error: "Authentication failed" };
  }
}
