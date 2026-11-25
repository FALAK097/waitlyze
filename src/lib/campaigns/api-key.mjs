import { createHash, timingSafeEqual } from "node:crypto";

import { parseApiKeyScopes } from "../db/sqlite-helpers.mjs";
import { campaignScope } from "../workspaces/service.mjs";

const failed = (error = "Invalid API key or unauthorized waitlist access") => ({
  success: false,
  error,
});

const LAST_USED_THROTTLE_MS = 5 * 60 * 1000;

const ALL_READ_SCOPES = [
  "waitlist:read",
  "mcp:read",
  "campaigns:read",
  "subscribers:read",
  "audience:read",
  "analytics:read",
  "emails:read",
  "email:read",
  "webhooks:read",
  "workspace:read",
];

const ALL_WRITE_SCOPES = [
  ...ALL_READ_SCOPES,
  "waitlist:write",
  "waitlist:manage",
  "mcp:write",
  "campaigns:write",
  "subscribers:write",
  "audience:write",
  "emails:write",
  "email:write",
  "webhooks:write",
  "integrations:write",
  "workspace:write",
  "workspace:manage",
];

const READ_WRITE_IMPLIED = Object.freeze({
  "waitlist:read": [
    "waitlist:read",
    "audience:read",
    "subscribers:read",
    "analytics:read",
    "campaigns:read",
  ],
  "waitlist:write": [
    "waitlist:read",
    "waitlist:write",
    "audience:read",
    "audience:write",
    "subscribers:read",
    "subscribers:write",
    "analytics:read",
    "campaigns:read",
  ],
  "waitlist:manage": [
    "waitlist:read",
    "waitlist:write",
    "waitlist:manage",
    "campaigns:read",
    "campaigns:write",
  ],
  "campaigns:write": ["waitlist:read", "waitlist:manage", "campaigns:read", "campaigns:write"],
  "mcp:read": ALL_READ_SCOPES,
  "mcp:write": ALL_WRITE_SCOPES,
  "subscribers:read": ["subscribers:read", "audience:read"],
  "subscribers:write": ["subscribers:read", "subscribers:write", "audience:read", "audience:write"],
  "audience:read": ["subscribers:read", "audience:read"],
  "audience:write": ["subscribers:read", "subscribers:write", "audience:read", "audience:write"],
  "emails:read": ["emails:read", "email:read"],
  "emails:write": ["emails:read", "emails:write", "email:read", "email:write"],
  "email:read": ["emails:read", "email:read"],
  "email:write": ["emails:read", "emails:write", "email:read", "email:write"],
  "webhooks:write": ["webhooks:read", "webhooks:write"],
  "workspace:write": ["workspace:read", "workspace:write", "workspace:manage"],
  "workspace:manage": ["workspace:read", "workspace:write", "workspace:manage"],
});

export function expandApiKeyScopes(scopes) {
  const expanded = new Set();
  for (const scope of scopes || []) {
    expanded.add(scope);
    const implied = READ_WRITE_IMPLIED[scope];
    if (implied) {
      for (const item of implied) expanded.add(item);
    }
  }
  return expanded;
}

export function apiKeyHasScope(scopes, requiredScope) {
  if (!requiredScope) return true;
  return expandApiKeyScopes(scopes).has(requiredScope);
}

function touchLastUsed(db, key, now) {
  if (
    key.lastUsedAt &&
    now.getTime() - new Date(key.lastUsedAt).getTime() < LAST_USED_THROTTLE_MS
  ) {
    return;
  }
  db.apiKey
    .updateMany({
      where: {
        id: key.id,
        revokedAt: null,
        OR: [
          { lastUsedAt: null },
          { lastUsedAt: { lt: new Date(now.getTime() - LAST_USED_THROTTLE_MS) } },
        ],
      },
      data: { lastUsedAt: now },
    })
    .catch(() => {});
}

/**
 * Validates any wl2_ API key without tying it to a specific waitlist yet.
 * Used by both Public REST API v1 and MCP authentication.
 */
export async function validateApiKeyToken(apiKey, db, { now = new Date() } = {}) {
  try {
    if (typeof apiKey !== "string" || apiKey.length > 160) {
      return failed("Invalid API key format");
    }
    const v2 = /^wl2_([a-f0-9]{32})_([A-Za-z0-9_-]{43})$/.exec(apiKey);
    if (!v2) {
      return failed("Invalid API key format");
    }
    const [, keyId, secret] = v2;
    const key = await db.apiKey.findUnique({
      where: { keyId },
      select: {
        id: true,
        keyHash: true,
        keyId: true,
        userId: true,
        waitlistId: true,
        workspaceId: true,
        scopes: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        user: { select: { id: true, name: true, email: true } },
        waitlist: { select: { id: true, name: true, workspaceId: true, status: true } },
      },
    });
    const scopes = key ? parseApiKeyScopes(key.scopes) : null;
    if (!key || !scopes || key.revokedAt || (key.expiresAt && key.expiresAt <= now)) {
      return failed("Invalid or expired API key");
    }
    const expected = Buffer.from(key.keyHash, "hex");
    const actual = createHash("sha256").update(secret).digest();
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return failed("Invalid or expired API key");
    }

    const effectiveWorkspaceId = key.waitlist?.workspaceId || key.workspaceId || null;
    touchLastUsed(db, key, now);
    return {
      success: true,
      id: key.id,
      keyId: key.keyId,
      userId: key.userId,
      user: key.user,
      waitlistId: key.waitlistId,
      workspaceId: effectiveWorkspaceId,
      waitlist: key.waitlist,
      scopes,
    };
  } catch (error) {
    console.error("API key token validation error:", error);
    return failed("Authentication failed");
  }
}

async function findPublishedWaitlist(db, waitlistId, userId, workspaceId) {
  return db.waitList.findFirst({
    where: {
      id: waitlistId,
      status: "PUBLISHED",
      ...campaignScope(userId, "viewCampaign", workspaceId || undefined),
    },
    select: { id: true, name: true, userId: true, workspaceId: true },
  });
}

export async function validatePublishedApiKey(
  apiKey,
  waitlistId,
  db,
  { now = new Date(), requiredScope = "waitlist:write" } = {},
) {
  if (typeof waitlistId !== "string" || !waitlistId || waitlistId.length > 128) {
    return failed("Invalid waitlist ID");
  }
  const auth = await validateApiKeyToken(apiKey, db, { now });
  if (!auth.success) return auth;

  if (auth.waitlistId && auth.waitlistId !== waitlistId) {
    return failed();
  }
  if (!apiKeyHasScope(auth.scopes, requiredScope)) {
    return failed(`Insufficient API key scope. Requires '${requiredScope}'.`);
  }

  const waitlist = await findPublishedWaitlist(
    db,
    waitlistId,
    auth.userId,
    auth.waitlistId ? undefined : auth.workspaceId,
  );
  if (!waitlist) return failed();
  return {
    success: true,
    waitlist,
    userId: auth.userId,
    workspaceId: waitlist.workspaceId,
    scopes: auth.scopes,
  };
}
