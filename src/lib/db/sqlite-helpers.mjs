/**
 * Helpers for Cloudflare D1 / SQLite runtime compatibility where Postgres-only
 * features (scalar String[] columns, interactive transactions, skipDuplicates,
 * and Postgres SQL syntax) are not available.
 */

export function parseJsonStringArray(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string");
  }
  if (typeof value !== "string") {
    return [...fallback];
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return [...fallback];
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string");
    }
  } catch {
    // Better Auth OAuth tokens or legacy values may use space/comma separation
    const parts = trimmed.split(/[\s,]+/).filter(Boolean);
    if (parts.length > 0) {
      return parts;
    }
  }
  return [...fallback];
}

export function serializeJsonStringArray(value, fallback = []) {
  if (Array.isArray(value)) {
    return JSON.stringify(value.filter((item) => typeof item === "string"));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return JSON.stringify(parsed.filter((item) => typeof item === "string"));
        }
      } catch {
        // fall through
      }
    }
  }
  return JSON.stringify(fallback);
}

export const VALID_API_KEY_SCOPES = new Set([
  "waitlist:read",
  "waitlist:write",
  "waitlist:manage",
  "mcp:read",
  "mcp:write",
  "campaigns:read",
  "campaigns:write",
  "subscribers:read",
  "subscribers:write",
  "audience:read",
  "audience:write",
  "analytics:read",
  "emails:read",
  "emails:write",
  "email:read",
  "email:write",
  "webhooks:read",
  "webhooks:write",
  "integrations:write",
  "workspace:read",
  "workspace:write",
  "workspace:manage",
]);

export function parseApiKeyScopes(value) {
  let raw = value;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed.startsWith("[")) return null;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const scopes = [];
  for (const entry of raw) {
    if (typeof entry !== "string" || !VALID_API_KEY_SCOPES.has(entry)) {
      return null;
    }
    if (!scopes.includes(entry)) {
      scopes.push(entry);
    }
  }
  return scopes;
}

export function toSqliteIso(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().replace("Z", "+00:00");
}

export async function runAtomicSqlBatch(db, statements) {
  if (!Array.isArray(statements) || statements.length === 0) return [];
  const d1 = globalThis[Symbol.for("__cloudflare-context__")]?.env?.DB;
  if (d1 && typeof d1.batch === "function") {
    const results = await d1.batch(
      statements.map(({ sql, params = [] }) => d1.prepare(sql).bind(...params)),
    );
    return results.map((entry) => ({
      changes: Number(entry?.meta?.changes ?? entry?.changes ?? 0),
    }));
  }
  const results = await db.$transaction(
    statements.map(({ sql, params = [] }) => db.$executeRawUnsafe(sql, ...params)),
  );
  return results.map((entry) => ({
    changes: Number(
      typeof entry === "number" ? entry : (entry?.changes ?? entry?.meta?.changes ?? 0),
    ),
  }));
}

export function isUniqueConstraintError(err) {
  if (!err || typeof err !== "object") return false;
  if (err.code === "P2002") return true;
  const msg = typeof err.message === "string" ? err.message : "";
  return (
    msg.includes("UNIQUE constraint failed") ||
    msg.includes("P2002") ||
    msg.toLowerCase().includes("unique constraint")
  );
}

export function isNotFoundError(err) {
  return Boolean(err && typeof err === "object" && err.code === "P2025");
}
