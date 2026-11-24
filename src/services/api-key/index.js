import { createHash, randomBytes } from "node:crypto";

import {
  parseJsonStringArray,
  serializeJsonStringArray,
  VALID_API_KEY_SCOPES,
} from "@/lib/db/sqlite-helpers.mjs";
import prisma from "@/lib/prisma";

const API_KEY_BYTES = 32;

export async function generateApiKey() {
  const keyId = randomBytes(16).toString("hex");
  const secret = randomBytes(API_KEY_BYTES).toString("base64url");
  return {
    apiKey: `wl2_${keyId}_${secret}`,
    keyId,
    hashedKey: createHash("sha256").update(secret).digest("hex"),
  };
}

export async function createApiKey({
  name,
  userId,
  waitlistId = null,
  workspaceId = null,
  expiresAt,
  scopes = ["waitlist:write"],
  db = prisma,
}) {
  if (
    !Array.isArray(scopes) ||
    scopes.length === 0 ||
    scopes.some((scope) => !VALID_API_KEY_SCOPES.has(scope))
  ) {
    throw new TypeError("Choose at least one supported API key scope.");
  }
  if (!waitlistId && !workspaceId) {
    throw new TypeError("An API key must be scoped to a waitlist or workspace.");
  }
  const uniqueScopes = [...new Set(scopes)];
  const { apiKey, keyId, hashedKey } = await generateApiKey();
  const record = await db.apiKey.create({
    data: {
      name,
      keyId,
      keyHash: hashedKey,
      userId,
      waitlistId: waitlistId || null,
      workspaceId: workspaceId || null,
      scopes: serializeJsonStringArray(uniqueScopes, ["waitlist:write"]),
      expiresAt,
    },
    select: {
      id: true,
      name: true,
      keyId: true,
      scopes: true,
      expiresAt: true,
      createdAt: true,
      waitlistId: true,
      workspaceId: true,
      waitlist: { select: { id: true, name: true } },
      workspace: { select: { id: true, name: true } },
    },
  });
  return {
    ...record,
    scopes: parseJsonStringArray(record.scopes, ["waitlist:write"]),
    apiKey,
  };
}

export async function revokeApiKey(id, userId, waitlistId = null, workspaceId = null) {
  try {
    const result = await prisma.apiKey.updateMany({
      where: {
        id,
        revokedAt: null,
        ...(waitlistId
          ? { waitlistId }
          : workspaceId
            ? { workspaceId, waitlistId: null }
            : { userId, waitlistId: null }),
      },
      data: { revokedAt: new Date() },
    });
    return result.count === 1;
  } catch (error) {
    console.error("Error revoking API key:", error);
    return false;
  }
}

export async function listUserApiKeys(userId, waitlistIds = [], workspaceIds = []) {
  try {
    const records = await prisma.apiKey.findMany({
      where: {
        revokedAt: null,
        OR: [
          { userId, waitlistId: null, workspaceId: null },
          ...(waitlistIds.length ? [{ waitlistId: { in: waitlistIds } }] : []),
          ...(workspaceIds.length ? [{ workspaceId: { in: workspaceIds }, waitlistId: null }] : []),
        ],
      },
      include: {
        waitlist: {
          select: { id: true, name: true },
        },
        workspace: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => ({
      ...record,
      scopes: parseJsonStringArray(record.scopes, ["waitlist:write"]),
    }));
  } catch (error) {
    console.error("Error listing API keys:", error);
    throw new Error("Failed to list API keys", { cause: error });
  }
}
