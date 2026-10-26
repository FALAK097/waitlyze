import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { getCampaignPosition } from "@/lib/campaigns/referral-position.mjs";
import { findSignupByEmail } from "@/lib/campaigns/signup-lookup.mjs";
import {
  DuplicateSignupError,
  FraudLimitError,
  InvalidCampaignError,
} from "@/lib/campaigns/signups.mjs";
import { dispatchVerificationNow } from "@/lib/email/dispatch-now.mjs";
import { fingerprintSignupDevice } from "@/lib/fraud/gates.mjs";
import prisma from "@/lib/prisma";
import { summarizeSignupRewards } from "@/lib/referrals/rewards.mjs";
import { apiKeyRateLimitHeaders, consumeApiKeyBudget } from "@/lib/security/api-key-rate-limit.mjs";
import { consumePublicBudget, PublicRateLimitError } from "@/lib/security/public-rate-limit.mjs";
import { createSignUp } from "@/services/sign-up";
import { validateApiKeyAndGetWaitlist } from "@/utils/api-key-auth";
import { pickAttribution } from "@/utils/server/attribution.mjs";
import { getDeviceInfo } from "@/utils/server/device";
import { getGeoInfo, getIpAddress, getTimeZone } from "@/utils/server/geo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_-]{1,128}$/;

const appBaseUrl = () => String(process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");

// API keys authenticate server-to-server calls. Accept the legacy body field,
// plus x-api-key / Authorization: Bearer headers (required for GET, where a
// secret must never travel in the query string).
function resolveApiKey(request, body) {
  if (typeof body?.apiKey === "string" && body.apiKey) return body.apiKey;
  const headerKey = request.headers.get("x-api-key");
  if (headerKey && headerKey.trim()) return headerKey.trim();
  const bearer = request.headers.get("authorization");
  if (bearer && /^bearer\s+/i.test(bearer)) return bearer.replace(/^bearer\s+/i, "").trim();
  return null;
}

async function waitlistSharing(waitlistId) {
  return prisma.waitList.findUnique({
    where: { id: waitlistId },
    select: { id: true, publicSlug: true, showReferrals: true },
  });
}

function referralLink(sharing, referralCode) {
  const base = appBaseUrl();
  if (!base || !sharing?.showReferrals || !sharing.publicSlug || !referralCode) return "";
  return `${base}/w/${encodeURIComponent(sharing.publicSlug)}?r=${encodeURIComponent(referralCode)}`;
}

// Canonical per-signup payload: position answers "where am I?", referral_code
// + referral_link power custom-frontend sharing UI. rank is the legacy alias.
// Rewards progress rides along: points balance, referral_count (verified
// only), display_position (founder inflation applied), next_reward
// ("X more to unlock"), and spots_to_advance (verified referrals needed to
// take the spot above, 0 at the top).
async function signupData(waitlistId, signUp, { idempotentReplay = false } = {}) {
  const sharing = await waitlistSharing(waitlistId);
  // The signup service already attached a summary on the POST path; the
  // status-lookup path resolves it here. A null summary recomputes so the
  // progress fields are never silently dropped.
  const attached =
    signUp.rewardSummary && typeof signUp.rewardSummary === "object" ? signUp.rewardSummary : null;
  const [position, summary] = await Promise.all([
    getCampaignPosition(prisma, waitlistId, signUp.id),
    attached ?? summarizeSignupRewards(prisma, waitlistId, signUp),
  ]);
  return {
    rank: position,
    position,
    display_position: summary.displayPosition ?? position,
    points: summary.points,
    referral_count: summary.referrals,
    next_reward: summary.nextReward,
    unlocked_rewards: summary.unlockedRewards,
    spots_to_advance: summary.spotsToAdvance,
    counts_hidden: summary.hideCounts,
    referral_code: signUp.referralCode || null,
    referral_link: referralLink(sharing, signUp.referralCode),
    verified: Boolean(signUp.verifiedAt),
    ...(idempotentReplay ? { idempotentReplay: true } : {}),
  };
}

function rateLimitResponse(error, extraHeaders) {
  const retryAfter = error.retryAfterSeconds ?? (error.status === 429 ? 3600 : 60);
  return NextResponse.json(
    { success: false, message: error.message, error: error.message },
    { status: error.status, headers: { "Retry-After": String(retryAfter), ...extraHeaders } },
  );
}

// GET /api/waitlist?waitlistId=...&email=... — status lookup for custom
// frontends ("where am I?") without consuming signup intake budget. The API
// key travels in x-api-key / Authorization headers only.
export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const waitlistId = params.get("waitlistId");
  const email = params.get("email")?.trim();
  const apiKey = resolveApiKey(request, null);
  if (!apiKey || typeof waitlistId !== "string" || !waitlistId || !email)
    return NextResponse.json(
      { success: false, error: "waitlistId, email, and an API key header are required" },
      { status: 400 },
    );
  if (waitlistId.length > 128 || email.length > 320 || !EMAIL_RE.test(email))
    return NextResponse.json({ success: false, error: "Invalid lookup request" }, { status: 400 });
  try {
    await consumePublicBudget(prisma, {
      kind: "status",
      campaignId: waitlistId,
      headers: request.headers,
    });
    const auth = await validateApiKeyAndGetWaitlist(apiKey, waitlistId);
    if (!auth.success)
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    const budget = await consumeApiKeyBudget(prisma, apiKey);
    const signUp = await findSignupByEmail(prisma, waitlistId, email);
    if (!signUp)
      return NextResponse.json(
        { success: false, error: "No signup found for this email" },
        { status: 404, headers: apiKeyRateLimitHeaders(budget) },
      );
    return NextResponse.json(
      { success: true, data: await signupData(waitlistId, signUp) },
      {
        headers: {
          "Cache-Control": "private, no-store",
          ...apiKeyRateLimitHeaders(budget),
        },
      },
    );
  } catch (error) {
    if (error instanceof PublicRateLimitError) return rateLimitResponse(error);
    console.error("Waitlist status lookup error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
    if (!body || typeof body !== "object")
      return NextResponse.json(
        { success: false, error: "Invalid signup request" },
        { status: 400 },
      );
    const apiKey = resolveApiKey(request, body);
    // Todo Phase 4 contract: POST /signup {email, referral_code}. Accept both
    // snake_case and the legacy camelCase referral field.
    const { waitlistId, email } = body;
    const referralCode =
      typeof body.referralCode === "string" && body.referralCode
        ? body.referralCode
        : typeof body.referral_code === "string" && body.referral_code
          ? body.referral_code
          : undefined;

    if (!apiKey || !waitlistId || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "apiKey, waitlistId, and email are required",
        },
        { status: 400 },
      );
    }

    if (!EMAIL_RE.test(email.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 },
      );
    }

    if (typeof waitlistId !== "string" || waitlistId.length > 128 || email.length > 320)
      return NextResponse.json(
        { success: false, error: "Invalid signup request" },
        { status: 400 },
      );
    // Optional client-generated idempotency key. Replays reuse a deterministic
    // identity, so the service layer returns the original signup instead of a
    // duplicate — safe to retry on timeouts and 5xx.
    const idempotencyKey = request.headers.get("idempotency-key");
    let uniqueUserId = crypto.randomUUID();
    if (idempotencyKey !== null) {
      if (!IDEMPOTENCY_KEY_RE.test(idempotencyKey))
        return NextResponse.json(
          { success: false, error: "Idempotency-Key must be 1-128 chars: A-Z a-z 0-9 _ -" },
          { status: 400 },
        );
      uniqueUserId = `api-idem-${createHash("sha256").update(`${waitlistId}:${idempotencyKey}`).digest("hex")}`;
    }
    await consumePublicBudget(prisma, {
      kind: "signup",
      campaignId: waitlistId,
      headers: request.headers,
      email,
    });
    const auth = await validateApiKeyAndGetWaitlist(apiKey, waitlistId);
    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        { status: 401 },
      );
    }
    const budget = await consumeApiKeyBudget(prisma, apiKey);
    const budgetHeaders = apiKeyRateLimitHeaders(budget);

    const { device, deviceType } = await getDeviceInfo();
    const ip = getIpAddress(request);
    const geo = getGeoInfo(request);
    if (body.marketingConsent !== undefined && typeof body.marketingConsent !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Marketing consent must be a boolean" },
        { status: 400 },
      );
    }

    let signupDataInput = {
      uniqueUserId,
      email: email.trim(),
      marketingConsent: body.marketingConsent === true,
      device,
      deviceType,
      deviceFingerprint: fingerprintSignupDevice({
        uniqueUserId,
        userAgent: request.headers.get("user-agent"),
        device,
      }),
      waitListId: waitlistId,
      ipAddress: ip,
      ...pickAttribution(body),
    };

    if (geo && (geo.city || geo.country || geo.timezone)) {
      const timezone = getTimeZone(geo.city, geo.country, geo.timezone);
      signupDataInput = {
        ...signupDataInput,
        city: geo.city,
        country: geo.country,
        latitude: geo.latitude?.toString(),
        longitude: geo.longitude?.toString(),
        timezone,
      };
    }

    const signUp = await createSignUp(signupDataInput, referralCode);
    // Silent-mode fraud verdict: same success shape, nothing persisted —
    // no verification email, no impression, no points, no webhooks. The
    // service attached a zero-value rewardSummary (real visibility flags,
    // zero progress), so every key a real response carries is present —
    // including counts_hidden for stealth launches, which the UI hides per
    // the flag exactly like a real response.
    if (signUp.silent) {
      const sharing = await waitlistSharing(waitlistId);
      const summary =
        signUp.rewardSummary && typeof signUp.rewardSummary === "object"
          ? signUp.rewardSummary
          : null;
      const fallback = {
        displayPosition: signUp.rank ?? null,
        points: 0,
        referrals: 0,
        nextReward: null,
        unlockedRewards: [],
        spotsToAdvance: 0,
        hideCounts: false,
      };
      const s = summary ?? fallback;
      return NextResponse.json(
        {
          success: true,
          message: "Successfully joined the waitlist!",
          data: {
            rank: signUp.rank,
            position: signUp.rank,
            display_position: s.displayPosition ?? signUp.rank,
            points: s.points,
            referral_count: s.referrals,
            next_reward: s.nextReward,
            unlocked_rewards: s.unlockedRewards,
            spots_to_advance: s.spotsToAdvance,
            counts_hidden: s.hideCounts,
            referral_code: signUp.referralCode || null,
            referral_link: referralLink(sharing, signUp.referralCode),
            verified: false,
          },
        },
        { headers: budgetHeaders },
      );
    }
    if (signUp.verificationEventKey) await dispatchVerificationNow(signUp.verificationEventKey);

    // Replays (same Idempotency-Key) return the original signup: no new page
    // view happened, so skip the impression. The P2002 guard covers the
    // hairline concurrent same-key double-submit where both pass createSignUp.
    if (signUp.signupOutcome !== "returning") {
      // Link the signup to its page view, mirroring the browser funnel where
      // the tracker row predates the join. Best-effort: intake must never
      // fail because the linkage write did.
      const linkImpression = async (impressionId) => {
        if (signUp.impressionId || !impressionId) return;
        await prisma.signUp
          .update({ where: { id: signUp.id }, data: { impressionId } })
          .catch(() => {});
      };
      try {
        const impression = await prisma.impression.create({
          data: {
            uniqueUserId: signUp.uniqueUserId,
            device,
            deviceType,
            waitListId: waitlistId,
            ipAddress: ip,
            city: signupDataInput.city,
            region: geo?.region,
            country: signupDataInput.country,
            latitude: signupDataInput.latitude,
            longitude: signupDataInput.longitude,
            timezone: signupDataInput.timezone,
            ...pickAttribution(body),
          },
        });
        await linkImpression(impression.id);
      } catch (error) {
        if (error?.code !== "P2002") throw error;
        // A tracker row already exists for this browser (a real page view
        // predates the API join): link to it instead of leaving
        // impressionId null.
        const existing = await prisma.impression
          .findFirst({
            where: { waitListId: waitlistId, uniqueUserId: signUp.uniqueUserId },
            orderBy: { createdAt: "desc" },
            select: { id: true },
          })
          .catch(() => null);
        await linkImpression(existing?.id);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined the waitlist!",
        data: await signupData(waitlistId, signUp, {
          idempotentReplay: signUp.signupOutcome === "returning",
        }),
      },
      { headers: budgetHeaders },
    );
  } catch (error) {
    if (error instanceof PublicRateLimitError) return rateLimitResponse(error);
    // Fraud IP-velocity gate: explicit 429 (fail-closed on clear abuse).
    if (error instanceof FraudLimitError)
      return NextResponse.json(
        { success: false, message: error.message, error: error.message },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSeconds ?? 3600) },
        },
      );
    if (error instanceof DuplicateSignupError) {
      const lookupId = body?.waitlistId;
      const lookupEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
      const existing =
        lookupId && lookupEmail
          ? await prisma.signUp.findUnique({
              where: {
                waitListId_emailNormalized: {
                  waitListId: lookupId,
                  emailNormalized: lookupEmail,
                },
              },
              select: {
                id: true,
                createdAt: true,
                referralCode: true,
                verifiedAt: true,
                points: true,
              },
            })
          : null;
      const idempotencyKey = request.headers.get("idempotency-key");
      if (idempotencyKey && IDEMPOTENCY_KEY_RE.test(idempotencyKey) && lookupId) {
        // Same key, different email: the caller must mint a fresh key. This
        // distinguishes key reuse from a genuinely duplicate email.
        const keyIdentity = `api-idem-${createHash("sha256").update(`${lookupId}:${idempotencyKey}`).digest("hex")}`;
        const keyOwner = await prisma.signUp.findFirst({
          where: { waitListId: lookupId, uniqueUserId: keyIdentity },
          select: { id: true },
        });
        if (keyOwner && (!existing || keyOwner.id !== existing.id))
          return NextResponse.json(
            {
              success: false,
              error: "Idempotency-Key was already used for a different email. Use a new key.",
            },
            { status: 409 },
          );
      }
      return NextResponse.json(
        {
          success: false,
          error: "Email already registered for this waitlist",
          data: {
            ...(existing && lookupId ? await signupData(lookupId, existing).catch(() => ({})) : {}),
            signupDate: existing?.createdAt,
          },
        },
        { status: 409 },
      );
    }
    if (error instanceof InvalidCampaignError) {
      return NextResponse.json(
        { success: false, error: "This waitlist is not accepting signups" },
        { status: 409 },
      );
    }
    if (error instanceof TypeError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("Waitlist API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Api-Key, Authorization, Idempotency-Key",
    },
  });
}
