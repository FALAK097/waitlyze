import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { WorkspacePlanError } from "@/lib/billing/plans.mjs";
import { pickCustomFields } from "@/lib/campaigns/form-rules.mjs";
import { findSignupByEmail } from "@/lib/campaigns/signup-lookup.mjs";
import {
  DuplicateSignupError,
  FraudLimitError,
  InvalidCampaignError,
} from "@/lib/campaigns/signups.mjs";
import {
  campaignRequiresTurnstile,
  TurnstileVerificationError,
  verifyTurnstileToken,
} from "@/lib/campaigns/turnstile.mjs";
import { dispatchVerificationNow } from "@/lib/email/dispatch-now.mjs";
import { CustomerSenderNotConnectedError } from "@/lib/email/sender-resolution.mjs";
import { fingerprintSignupDevice } from "@/lib/fraud/gates.mjs";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { summarizeSignupRewards } from "@/lib/referrals/rewards.mjs";
import { apiKeyRateLimitHeaders, consumeApiKeyBudget } from "@/lib/security/api-key-rate-limit.mjs";
import {
  consumePublicBudget,
  publicClientIdentity,
  PublicRateLimitError,
} from "@/lib/security/public-rate-limit.mjs";
import { createSignUp } from "@/services/sign-up";
import { validateApiKeyAndGetWaitlist } from "@/utils/api-key-auth";
import { pickAttribution } from "@/utils/server/attribution.mjs";
import { getDeviceInfo } from "@/utils/server/device";
import { getGeoInfo, getIpAddress, getTimeZone } from "@/utils/server/geo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_-]{1,128}$/;

const appBaseUrl = () => String(process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");

function resolveApiKey(request, body) {
  if (typeof body?.apiKey === "string" && body.apiKey) return body.apiKey;
  const headerKey = request.headers.get("x-api-key");
  if (headerKey && headerKey.trim()) return headerKey.trim();
  const bearer = request.headers.get("authorization");
  if (bearer && /^bearer\s+/i.test(bearer)) return bearer.replace(/^bearer\s+/i, "").trim();
  return null;
}

async function waitlistDetails(waitlistId) {
  return prisma.waitList.findUnique({
    where: { id: waitlistId },
    select: {
      id: true,
      name: true,
      publicSlug: true,
      showReferrals: true,
      _count: { select: { signUps: true } },
    },
  });
}

function referralLink(sharing, referralCode) {
  const base = appBaseUrl();
  if (!base || !sharing?.showReferrals || !sharing.publicSlug || !referralCode) return "";
  return `${base}/w/${encodeURIComponent(sharing.publicSlug)}?r=${encodeURIComponent(referralCode)}`;
}

function publicPageUrl(sharing) {
  const base = appBaseUrl();
  if (!base || !sharing?.publicSlug) return "";
  return `${base}/w/${encodeURIComponent(sharing.publicSlug)}`;
}

async function signupData(waitlistId, signUp, { idempotentReplay = false } = {}) {
  const attached =
    signUp.rewardSummary && typeof signUp.rewardSummary === "object" ? signUp.rewardSummary : null;
  const [sharing, summary] = await Promise.all([
    waitlistDetails(waitlistId),
    attached ?? summarizeSignupRewards(prisma, waitlistId, signUp),
  ]);
  const hideCounts = summary.hideCounts === true;
  const position = hideCounts ? null : (summary.position ?? signUp.rank ?? null);
  const displayPos = hideCounts ? null : (summary.displayPosition ?? position);
  const totalSignups = hideCounts ? null : (sharing?._count?.signUps ?? 0);
  return {
    id: signUp.id,
    email: signUp.email,
    waitlist_id: waitlistId,
    waitlist_name: sharing?.name || null,
    waitlist_slug: sharing?.publicSlug || null,
    public_url: publicPageUrl(sharing),
    total_signups: totalSignups,
    rank: position,
    position,
    display_position: displayPos,
    points: hideCounts ? 0 : summary.points,
    referral_count: hideCounts ? null : summary.referrals,
    next_reward: summary.nextReward,
    unlocked_rewards: summary.unlockedRewards,
    spots_to_advance: hideCounts ? null : summary.spotsToAdvance,
    counts_hidden: hideCounts,
    referral_code: signUp.referralCode || null,
    referral_link: referralLink(sharing, signUp.referralCode),
    verified: Boolean(signUp.verifiedAt),
    verified_at: signUp.verifiedAt ? new Date(signUp.verifiedAt).toISOString() : null,
    marketing_consent: Boolean(signUp.marketingConsentAt && !signUp.marketingUnsubscribedAt),
    phone: signUp.phone ?? null,
    custom_fields: signUp.customFields ?? [],
    created_at: signUp.createdAt ? new Date(signUp.createdAt).toISOString() : null,
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

// GET /api/waitlist?waitlistId=...&email=... - status lookup for custom frontends.
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
    const auth = await validateApiKeyAndGetWaitlist(apiKey, waitlistId, "waitlist:read");
    if (!auth.success)
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    await consumePublicBudget(prisma, {
      kind: "apiStatus",
      campaignId: waitlistId,
      actorId: auth.apiKey?.id || waitlistId,
      headers: request.headers,
    });
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
    if (error instanceof WorkspacePlanError)
      return NextResponse.json(
        { success: false, error: error.message, code: error.code, feature: error.feature },
        { status: error.status },
      );
    if (error instanceof CustomerSenderNotConnectedError)
      return NextResponse.json(
        {
          success: false,
          error:
            "This waitlist is temporarily unable to send confirmation email. Please contact its owner.",
        },
        { status: 503 },
      );
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
    const { waitlistId, email } = body;
    const referralCode =
      typeof body.referralCode === "string" && body.referralCode
        ? body.referralCode
        : typeof body.referral_code === "string" && body.referral_code
          ? body.referral_code
          : typeof body.ref === "string" && body.ref
            ? body.ref
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

    const marketingConsentRaw =
      body.marketingConsent !== undefined ? body.marketingConsent : body.marketing_consent;
    if (marketingConsentRaw !== undefined && typeof marketingConsentRaw !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Marketing consent must be a boolean" },
        { status: 400 },
      );
    }
    if (body.phone !== undefined && (typeof body.phone !== "string" || body.phone.length > 32)) {
      return NextResponse.json(
        { success: false, error: "Phone number is too long." },
        { status: 400 },
      );
    }

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
    const clientIp = publicClientIdentity(request.headers);
    const auth = await validateApiKeyAndGetWaitlist(apiKey, waitlistId, "waitlist:write");
    if (!auth.success) {
      try {
        const authAllowed = await checkRateLimit(
          prisma,
          `waitlist-api-auth-fail:${clientIp}`,
          60,
          15 * 60 * 1000,
        );
        if (!authAllowed) {
          return NextResponse.json(
            {
              success: false,
              error: "Too many failed authentication attempts. Please try again later.",
            },
            { status: 429, headers: { "Retry-After": "300" } },
          );
        }
      } catch {
        // Ignore rate limit check error on invalid auth branch
      }
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        { status: 401 },
      );
    }
    await consumePublicBudget(prisma, {
      kind: "apiSignup",
      campaignId: waitlistId,
      actorId: auth.apiKey?.id || waitlistId,
      headers: request.headers,
      email,
    });
    const budget = await consumeApiKeyBudget(prisma, apiKey);
    const budgetHeaders = apiKeyRateLimitHeaders(budget);

    const requiresTurnstile = await campaignRequiresTurnstile(prisma, waitlistId);
    let turnstileVerified = false;
    if (requiresTurnstile) {
      const customDomain = await prisma.customDomain.findUnique({
        where: { waitListId: waitlistId },
        select: { hostname: true, status: true },
      });
      const allowedHostnames =
        customDomain?.status === "ACTIVE" && customDomain.hostname ? [customDomain.hostname] : [];
      turnstileVerified = await verifyTurnstileToken(request, body["cf-turnstile-response"], {
        allowedHostnames,
      });
    }
    if (requiresTurnstile && !turnstileVerified)
      return NextResponse.json(
        { success: false, error: "Complete the security check and try again." },
        { status: 403 },
      );

    const { device, deviceType } = await getDeviceInfo();
    const ip = getIpAddress(request);
    const geo = getGeoInfo(request);
    const rawCustomFields = body.customFields ?? body.custom_fields;

    let signupDataInput = {
      uniqueUserId,
      email: email.trim(),
      signupProtection: turnstileVerified ? "turnstile" : "none",
      marketingConsent: marketingConsentRaw === true,
      device,
      deviceType,
      deviceFingerprint: fingerprintSignupDevice({
        uniqueUserId,
        userAgent: request.headers.get("user-agent"),
        device,
      }),
      waitListId: waitlistId,
      ipAddress: ip,
      phone: typeof body.phone === "string" ? body.phone.slice(0, 32) : undefined,
      customFields: pickCustomFields({ customFields: rawCustomFields }),
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
    if (signUp.silent) {
      const sharing = await waitlistDetails(waitlistId);
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
      const hideCounts = s.hideCounts === true;
      return NextResponse.json(
        {
          success: true,
          message: "Successfully joined the waitlist!",
          data: {
            id: signUp.id,
            email: signUp.email,
            waitlist_id: waitlistId,
            waitlist_name: sharing?.name || null,
            waitlist_slug: sharing?.publicSlug || null,
            public_url: publicPageUrl(sharing),
            total_signups: hideCounts ? null : (sharing?._count?.signUps ?? 0),
            rank: hideCounts ? null : signUp.rank,
            position: hideCounts ? null : signUp.rank,
            display_position: hideCounts ? null : (s.displayPosition ?? signUp.rank),
            points: hideCounts ? 0 : s.points,
            referral_count: hideCounts ? null : s.referrals,
            next_reward: s.nextReward,
            unlocked_rewards: s.unlockedRewards,
            spots_to_advance: hideCounts ? null : s.spotsToAdvance,
            counts_hidden: hideCounts,
            referral_code: signUp.referralCode || null,
            referral_link: referralLink(sharing, signUp.referralCode),
            verified: false,
            verified_at: null,
            marketing_consent: false,
            phone: null,
            custom_fields: [],
            created_at: new Date().toISOString(),
          },
        },
        { status: 201, headers: { "Cache-Control": "private, no-store", ...budgetHeaders } },
      );
    }
    if (signUp.verificationEventKey) await dispatchVerificationNow(signUp.verificationEventKey);

    if (signUp.signupOutcome !== "returning") {
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

    const isReplay = signUp.signupOutcome === "returning";
    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined the waitlist!",
        data: await signupData(waitlistId, signUp, {
          idempotentReplay: isReplay,
        }),
      },
      {
        status: isReplay ? 200 : 201,
        headers: { "Cache-Control": "private, no-store", ...budgetHeaders },
      },
    );
  } catch (error) {
    if (error instanceof WorkspacePlanError)
      return NextResponse.json(
        { success: false, error: error.message, code: error.code, feature: error.feature },
        { status: error.status },
      );
    if (error instanceof PublicRateLimitError) return rateLimitResponse(error);
    if (
      error instanceof CustomerSenderNotConnectedError ||
      error?.code === "SENDER_NEEDS_ATTENTION"
    )
      return NextResponse.json(
        {
          success: false,
          error:
            "This waitlist cannot send confirmation emails right now. Please contact its owner.",
        },
        { status: 503 },
      );
    if (error instanceof FraudLimitError)
      return NextResponse.json(
        { success: false, message: error.message, error: error.message },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSeconds ?? 3600) },
        },
      );
    if (error instanceof TurnstileVerificationError)
      return NextResponse.json(
        { success: false, error: "Complete the security check and try again." },
        { status: 403 },
      );
    if (error instanceof DuplicateSignupError) {
      const lookupId = body?.waitlistId;
      const existing =
        lookupId && typeof body?.email === "string"
          ? await findSignupByEmail(prisma, lookupId, body.email)
          : null;
      const idempotencyKey = request.headers.get("idempotency-key");
      if (idempotencyKey && IDEMPOTENCY_KEY_RE.test(idempotencyKey) && lookupId) {
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
