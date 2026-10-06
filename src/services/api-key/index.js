import { createHash, randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";

const API_KEY_BYTES = 32;

export async function generateApiKey() {
  const keyId = randomBytes(16).toString("hex");
  const secret = randomBytes(API_KEY_BYTES).toString("base64url");
  return { apiKey: `wl2_${keyId}_${secret}`, keyId, hashedKey: createHash("sha256").update(secret).digest("hex") };
}

export async function createApiKey({ name, userId, waitlistId, expiresAt, scopes = ["waitlist:write"], db = prisma }) {
  if (!Array.isArray(scopes) || scopes.length === 0 || scopes.some((scope) => !["waitlist:read", "waitlist:write"].includes(scope))) {
    throw new TypeError("Choose at least one supported API key scope.");
  }
  const { apiKey, keyId, hashedKey } = await generateApiKey();
  const record = await db.apiKey.create({
    data: { name, keyId, keyHash: hashedKey, userId, waitlistId, scopes, expiresAt },
    select: { id: true, name: true, keyId: true, scopes: true, expiresAt: true, createdAt: true, waitlist: { select: { id: true, name: true } } },
  });
  return { ...record, apiKey };
}

export async function revokeApiKey(id, userId, waitlistId = null) {
  try {
    const result = await prisma.apiKey.updateMany({
      where: { id, revokedAt: null, ...(waitlistId ? { waitlistId } : { userId, waitlistId: null }) },
      data: { revokedAt: new Date() },
    });
    return result.count === 1;
  } catch (error) {
    console.error("Error revoking API key:", error);
    return false;
  }
}

export async function listUserApiKeys(userId, waitlistIds = []) {
  try {
    return await prisma.apiKey.findMany({
      where: { revokedAt: null, OR: [{ userId, keyId: null }, ...(waitlistIds.length ? [{ waitlistId: { in: waitlistIds } }] : [])] },
      include: {
        waitlist: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error listing API keys:", error);
    throw new Error("Failed to list API keys");
  }
}
