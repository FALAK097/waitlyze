import "server-only";
import { env } from "@/lib/env.mjs";
import { publicClientIdentity } from "@/lib/security/public-rate-limit.mjs";

import { sanitizeLegacySnapshotForRead, templateSnapshotSchema } from "../templates/catalog.mjs";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_TOKEN_LENGTH = 2048;

export class TurnstileVerificationError extends Error {
  constructor() {
    super("Complete the security check and try again.");
    this.name = "TurnstileVerificationError";
  }
}

export function isTurnstileConfigured() {
  return Boolean(env.TURNSTILE_SITE_KEY?.trim() && env.TURNSTILE_SECRET_KEY?.trim());
}

/** Reads the active published setting. Invalid snapshots fail closed. */
export async function campaignRequiresTurnstile(db, waitListId) {
  const waitList = await db.waitList.findUnique({
    where: { id: waitListId },
    select: { status: true, publishedRevision: true },
  });
  if (waitList?.status !== "PUBLISHED" || waitList.publishedRevision == null) return false;

  const publication = await db.waitListPublicationRevision.findUnique({
    where: {
      waitListId_revision: { waitListId, revision: waitList.publishedRevision },
    },
    select: { snapshot: true },
  });
  const parsed = templateSnapshotSchema.safeParse(
    sanitizeLegacySnapshotForRead(publication?.snapshot),
  );
  return !parsed.success || parsed.data.form.requireTurnstile;
}

function allowedHostnamesForRequest(request, extraHostnames = []) {
  const allowed = new Set();
  try {
    const reqUrl = new URL(request.url);
    if (reqUrl.protocol === "http:" || reqUrl.protocol === "https:") {
      allowed.add(reqUrl.hostname.toLowerCase());
    }
  } catch {
    // Ignore invalid request URL
  }
  if (env.BETTER_AUTH_URL) {
    try {
      allowed.add(new URL(env.BETTER_AUTH_URL).hostname.toLowerCase());
    } catch {
      // Ignore invalid BETTER_AUTH_URL
    }
  }
  const appRoot = (process.env.APP_ROOT_DOMAIN ?? "").trim().toLowerCase();
  if (appRoot) allowed.add(appRoot);
  if (process.env.NODE_ENV !== "production") {
    allowed.add("localhost");
    allowed.add("127.0.0.1");
  }
  for (const host of extraHostnames) {
    if (typeof host === "string" && host.trim()) allowed.add(host.trim().toLowerCase());
  }
  return allowed;
}

/** Verifies an untrusted browser token with Cloudflare. Any failure rejects signup. */
export async function verifyTurnstileToken(request, token, { allowedHostnames = [] } = {}) {
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  const allowed = allowedHostnamesForRequest(request, allowedHostnames);
  if (
    !isTurnstileConfigured() ||
    !secret ||
    typeof token !== "string" ||
    token.trim().length === 0 ||
    token.length > MAX_TOKEN_LENGTH ||
    allowed.size === 0
  )
    return false;

  try {
    const payload = new URLSearchParams({ secret, response: token });
    const clientIp = publicClientIdentity(request.headers);
    if (clientIp && clientIp !== "untrusted-client") {
      payload.set("remoteip", clientIp);
    }
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return false;
    const result = await response.json();
    const tokenHost = typeof result?.hostname === "string" ? result.hostname.toLowerCase() : "";
    const hostMatches =
      Boolean(tokenHost) &&
      (allowed.has(tokenHost) || [...allowed].some((host) => tokenHost.endsWith(`.${host}`)));
    return result?.success === true && result.action === "signup" && hostMatches;
  } catch {
    return false;
  }
}
