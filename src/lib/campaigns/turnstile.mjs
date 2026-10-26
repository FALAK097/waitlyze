import "server-only";
import { env } from "@/lib/env.mjs";

import { templateSnapshotSchema } from "../templates/catalog.mjs";

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
  const parsed = templateSnapshotSchema.safeParse(publication?.snapshot);
  return !parsed.success || parsed.data.form.requireTurnstile;
}

function expectedHostname(request) {
  const origin = request.headers.get("origin");
  try {
    const url = new URL(origin || request.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Verifies an untrusted browser token with Cloudflare. Any failure rejects signup. */
export async function verifyTurnstileToken(request, token) {
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  const hostname = expectedHostname(request);
  if (
    !isTurnstileConfigured() ||
    !secret ||
    typeof token !== "string" ||
    token.trim().length === 0 ||
    token.length > MAX_TOKEN_LENGTH ||
    !hostname
  )
    return false;

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return false;
    const result = await response.json();
    return (
      result?.success === true &&
      result.action === "signup" &&
      typeof result.hostname === "string" &&
      result.hostname.toLowerCase() === hostname
    );
  } catch {
    return false;
  }
}
