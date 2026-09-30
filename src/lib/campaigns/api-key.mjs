import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

const failed = (error = "Invalid API key or unauthorized waitlist access") => ({ success: false, error });

async function findPublishedWaitlist(db, waitlistId) {
  return db.waitList.findFirst({
    where: { id: waitlistId, status: "PUBLISHED" },
    select: { id: true, name: true, userId: true },
  });
}

export async function validatePublishedApiKey(apiKey, waitlistId, db, { now = new Date() } = {}) {
  try {
    if (typeof apiKey !== "string" || typeof waitlistId !== "string" || !waitlistId) return failed("Invalid API key format");

    const v2 = /^wl2_([a-f0-9]{32})_([A-Za-z0-9_-]{43})$/.exec(apiKey);
    if (v2) {
      const [, keyId, secret] = v2;
      const key = await db.apiKey.findUnique({
        where: { keyId },
        select: { id: true, keyHash: true, keyId: true, userId: true, waitlistId: true, scopes: true, expiresAt: true, revokedAt: true },
      });
      if (!key || key.waitlistId !== waitlistId || key.revokedAt || (key.expiresAt && key.expiresAt <= now) || !key.scopes.includes("waitlist:write")) return failed();
      const expected = Buffer.from(key.keyHash, "hex");
      const actual = createHash("sha256").update(secret).digest();
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return failed();
      const waitlist = await findPublishedWaitlist(db, waitlistId);
      if (!waitlist) return failed();
      await db.apiKey.updateMany({ where: { id: key.id, revokedAt: null }, data: { lastUsedAt: now } });
      return { success: true, waitlist, userId: key.userId, scopes: key.scopes };
    }

    // Existing keys retain their original owner-level behavior until rotated.
    if (!apiKey.startsWith("wl_")) return failed("Invalid API key format");
    const apiKeys = await db.apiKey.findMany({
      where: { keyId: null, revokedAt: null },
      select: { id: true, keyHash: true, userId: true, user: { select: { waitLists: {
        where: { id: waitlistId, status: "PUBLISHED" },
        select: { id: true, name: true, userId: true },
      } } } },
    });
    for (const key of apiKeys) {
      if (await bcrypt.compare(apiKey, key.keyHash)) {
        const waitlist = key.user.waitLists.find((item) => item.id === waitlistId);
        if (waitlist) {
          await db.apiKey.updateMany({ where: { id: key.id, revokedAt: null }, data: { lastUsedAt: now } });
          return { success: true, waitlist, userId: key.userId, scopes: ["legacy:owner"] };
        }
      }
    }
    return failed();
  } catch (error) {
    console.error("API key validation error:", error);
    return failed("Authentication failed");
  }
}
