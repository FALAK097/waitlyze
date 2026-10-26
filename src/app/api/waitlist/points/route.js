import { NextResponse } from "next/server";

import { findSignupByEmail } from "@/lib/campaigns/signup-lookup.mjs";
import prisma from "@/lib/prisma";
import { awardPoints, customEventKey, isFarmSuspect } from "@/lib/referrals/points.mjs";
import { getPublishedRewards } from "@/lib/referrals/rewards.mjs";
import { apiKeyRateLimitHeaders, consumeApiKeyBudget } from "@/lib/security/api-key-rate-limit.mjs";
import { consumePublicBudget, PublicRateLimitError } from "@/lib/security/public-rate-limit.mjs";
import { validateApiKeyAndGetWaitlist } from "@/utils/api-key-auth";

const EVENT_RE = /^[a-z0-9-]{1,40}$/i;
const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_-]{1,128}$/;
const MAX_POINTS = 100000;

// Founder-authenticated custom point awards for off-site events the join flow
// never sees (survey completed, Discord joined, ...). The caller names an
// event; the waitlist's configured custom events supply the default points
// and label, and an explicit points value may override them.
//
// Idempotent: retries reuse the ledger event key
// (custom-credit:{signup}:{event}:{idempotencyKey or "once"}), so a safe
// retry never double-pays. Only verified, non-farm-suspect signups earn.
// The API key travels in headers only. Body-carried keys are rejected: JSON
// bodies end up in logs and error reports, and a secret there would leak.
function resolveApiKey(request) {
  const headerKey = request.headers.get("x-api-key");
  if (headerKey && headerKey.trim()) return headerKey.trim();
  const bearer = request.headers.get("authorization");
  if (bearer && /^bearer\s+/i.test(bearer)) return bearer.replace(/^bearer\s+/i, "").trim();
  return null;
}

function rateLimitResponse(error, extraHeaders) {
  const retryAfter = error.retryAfterSeconds ?? (error.status === 429 ? "3600" : "60");
  return NextResponse.json(
    { success: false, message: error.message, error: error.message },
    { status: error.status, headers: { "Retry-After": String(retryAfter), ...extraHeaders } },
  );
}

export async function POST(request) {
  let body;
  try {
    body = await request.json().catch(() => null);
    if (!body || typeof body !== "object")
      return NextResponse.json(
        { success: false, error: "Invalid points request" },
        { status: 400 },
      );
    const apiKey = resolveApiKey(request);
    const { waitlistId, email, signupId, event } = body;
    if (typeof body?.apiKey === "string" && body.apiKey)
      return NextResponse.json(
        {
          success: false,
          error: "Pass the API key in the X-Api-Key or Authorization header, not the request body",
        },
        { status: 400 },
      );
    if (!apiKey || typeof waitlistId !== "string" || !waitlistId || waitlistId.length > 128)
      return NextResponse.json(
        {
          success: false,
          error: "X-Api-Key (or Authorization) header and waitlistId are required",
        },
        { status: 400 },
      );
    if (typeof event !== "string" || !EVENT_RE.test(event.trim()))
      return NextResponse.json(
        { success: false, error: "event must be 1-40 chars: a-z 0-9 -" },
        { status: 400 },
      );
    if ((typeof email !== "string" || !email.trim()) && (typeof signupId !== "string" || !signupId))
      return NextResponse.json(
        { success: false, error: "email or signupId is required" },
        { status: 400 },
      );
    if (typeof email === "string" && email.length > 320)
      return NextResponse.json(
        { success: false, error: "Invalid points request" },
        { status: 400 },
      );
    let idempotencyKey = "once";
    if (body.idempotencyKey !== undefined) {
      if (typeof body.idempotencyKey !== "string" || !IDEMPOTENCY_KEY_RE.test(body.idempotencyKey))
        return NextResponse.json(
          { success: false, error: "idempotencyKey must be 1-128 chars: A-Z a-z 0-9 _ -" },
          { status: 400 },
        );
      idempotencyKey = body.idempotencyKey;
    }
    await consumePublicBudget(prisma, {
      kind: "points",
      campaignId: waitlistId,
      headers: request.headers,
    });
    const auth = await validateApiKeyAndGetWaitlist(apiKey, waitlistId);
    if (!auth.success)
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    const budget = await consumeApiKeyBudget(prisma, apiKey);
    const budgetHeaders = apiKeyRateLimitHeaders(budget);

    const signup =
      typeof signupId === "string" && signupId
        ? await prisma.signUp.findFirst({
            where: { id: signupId, waitListId: waitlistId },
            select: { id: true, waitListId: true, verifiedAt: true, ipAddress: true, points: true },
          })
        : await findSignupByEmail(prisma, waitlistId, email);
    if (!signup || signup.waitListId !== waitlistId)
      return NextResponse.json(
        { success: false, error: "No signup found for this waitlist" },
        { status: 404, headers: budgetHeaders },
      );
    if (!signup.verifiedAt)
      return NextResponse.json(
        { success: false, error: "Custom events only pay out for verified signups" },
        { status: 409, headers: budgetHeaders },
      );

    const eventKey = event.trim().toLowerCase();
    const { rewards } = await getPublishedRewards(prisma, waitlistId);
    const configured = rewards.customEvents.find((entry) => entry.key === eventKey);
    let points = configured?.points ?? 0;
    let label = configured?.label ?? eventKey;
    if (body.points !== undefined) {
      if (!Number.isInteger(body.points) || body.points < 0 || body.points > MAX_POINTS)
        return NextResponse.json(
          { success: false, error: `points must be an integer 0-${MAX_POINTS}` },
          { status: 400, headers: budgetHeaders },
        );
      points = body.points;
    } else if (!configured) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown event "${eventKey}". Configure it under Rewards or pass explicit points.`,
        },
        { status: 400, headers: budgetHeaders },
      );
    }
    if (typeof body.label === "string" && body.label.trim()) label = body.label.trim().slice(0, 80);

    const result = await prisma.$transaction(async (tx) => {
      // All awaits below share the one transaction connection and must keep
      // this order: fraud gate → award. Promise.all would still serialize on
      // the shared connection and would break the ordering. The balance comes
      // back from awardPoints itself, so there is no separate read-back.
      if (await isFarmSuspect(tx, signup.ipAddress, new Date()))
        return { awarded: false, balance: signup.points ?? 0 };
      const award = await awardPoints(tx, {
        waitListId: waitlistId,
        signUpId: signup.id,
        kind: "CUSTOM",
        points,
        eventKey: customEventKey(signup.id, eventKey, idempotencyKey),
      });
      return { awarded: award.awarded, balance: award.balance ?? signup.points ?? 0 };
    });
    return NextResponse.json(
      {
        success: true,
        data: {
          awarded: result.awarded,
          event: eventKey,
          label,
          points: result.awarded ? points : 0,
          balance: result.balance,
        },
      },
      { headers: budgetHeaders },
    );
  } catch (error) {
    if (error instanceof PublicRateLimitError) return rateLimitResponse(error);
    console.error("Custom points award error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
