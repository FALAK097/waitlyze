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
    if (trimmed.includes(" ")) {
      return trimmed.split(/\s+/).filter(Boolean);
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

export function toSqliteIso(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().replace("Z", "+00:00");
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
