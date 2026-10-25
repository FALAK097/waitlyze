import { NextResponse } from "next/server";

import { getCampaignPosition } from "@/lib/campaigns/referral-position.mjs";
import { DuplicateSignupError, InvalidCampaignError } from "@/lib/campaigns/signups.mjs";
import {
  campaignRequiresTurnstile,
  TurnstileVerificationError,
  verifyTurnstileToken,
} from "@/lib/campaigns/turnstile.mjs";
import { dispatchVerificationNow } from "@/lib/email/dispatch-now.mjs";
import prisma from "@/lib/prisma";
import { consumePublicBudget, PublicRateLimitError } from "@/lib/security/public-rate-limit.mjs";
import { createSignUp } from "@/services/sign-up";
import { pickAttribution } from "@/utils/server/attribution.mjs";
import { getDeviceInfo } from "@/utils/server/device";
import { getGeoInfo, getIpAddress, getTimeZone } from "@/utils/server/geo";
import { validateRequest } from "@/utils/server/validations/sign-up";

const legacySignupResponse = (signUp, { includeReferralCode = false } = {}) => {
  // This endpoint is public. Keep the legacy fields needed by its browser
  // clients, and never serialize operational or location data from the DB row.
  const response = {
    id: signUp.id,
    email: signUp.email,
    uniqueUserId: signUp.uniqueUserId,
    waitListId: signUp.waitListId,
    rank: signUp.rank,
    verified: !!signUp.verifiedAt,
    outcome: signUp.signupOutcome || "created",
    referralCount: Array.isArray(signUp.referrals) ? signUp.referrals.length : 0,
  };
  if (includeReferralCode) response.referralCode = signUp.referralCode;
  return response;
};

export const GET = async (req) => {
  const signUpId = req.nextUrl.searchParams.get("signUpId");
  if (!signUpId) {
    return NextResponse.json({ message: "Sign up ID is required" }, { status: 400 });
  }

  const signUp = await prisma.signUp.findUnique({
    where: { id: signUpId, waitList: { status: "PUBLISHED" } },
    select: { id: true, waitListId: true },
  });

  if (!signUp) {
    return NextResponse.json({ message: "Sign up not found" }, { status: 404 });
  }

  const rank = await getCampaignPosition(prisma, signUp.waitListId, signUp.id);
  return NextResponse.json(
    { signUp: { ...signUp, rank } },
    { headers: { "Cache-Control": "private, no-store" } },
  );
};

export const POST = async (req) => {
  try {
    const body = await req.json();
    if (
      typeof body?.waitListId !== "string" ||
      !body.waitListId ||
      body.waitListId.length > 128 ||
      typeof body.email !== "string" ||
      body.email.length > 320
    )
      return NextResponse.json(
        { message: "A valid waitlist and email are required." },
        { status: 400 },
      );
    await consumePublicBudget(prisma, {
      kind: "signup",
      campaignId: body.waitListId,
      headers: req.headers,
      email: body.email,
    });
    const validator = await validateRequest(body);
    if (validator) return validator;
    if (body.marketingConsent !== undefined && typeof body.marketingConsent !== "boolean") {
      return NextResponse.json({ message: "Marketing consent must be a boolean" }, { status: 400 });
    }
    const requiresTurnstile = await campaignRequiresTurnstile(prisma, body.waitListId);
    const turnstileVerified =
      requiresTurnstile && (await verifyTurnstileToken(req, body["cf-turnstile-response"]));
    if (requiresTurnstile && !turnstileVerified)
      return NextResponse.json(
        { message: "Complete the security check and try again." },
        { status: 403 },
      );

    const { device, deviceType } = await getDeviceInfo();
    const ip = getIpAddress(req);
    const geo = getGeoInfo(req);

    const hypeSession = body.hypeSession;

    if (!hypeSession) {
      return NextResponse.json({ message: "Unique User ID is required" }, { status: 400 });
    }

    const impression = await prisma.impression.findFirst({
      where: {
        waitListId: body.waitListId,
        uniqueUserId: hypeSession,
      },
    });

    let data = {
      uniqueUserId: hypeSession,
      email: body.email,
      marketingConsent: body.marketingConsent === true,
      signupProtection: turnstileVerified ? "turnstile" : "none",
      device,
      deviceType,
      waitListId: body.waitListId,
      ipAddress: ip,
      impressionId: impression?.id,
      ...pickAttribution(body),
    };

    if (geo && (geo.city || geo.country || geo.timezone)) {
      const timezone = getTimeZone(geo.city, geo.country, geo.timezone);
      data = {
        ...data,
        city: geo.city,
        country: geo.country,
        latitude: geo.latitude?.toString(),
        longitude: geo.longitude?.toString(),
        timezone,
      };
    }

    const signUp = await createSignUp(data, body?.referralId);
    if (signUp.verificationEventKey) await dispatchVerificationNow(signUp.verificationEventKey);
    return NextResponse.json({
      message: "Signed up successfully",
      signUp: legacySignupResponse(signUp, { includeReferralCode: true }),
    });
  } catch (error) {
    if (error instanceof TurnstileVerificationError)
      return NextResponse.json(
        { message: "Complete the security check and try again." },
        { status: 403 },
      );
    if (error instanceof PublicRateLimitError)
      return NextResponse.json(
        { message: error.message, error: error.message },
        { status: error.status, headers: { "Retry-After": error.status === 429 ? "3600" : "60" } },
      );
    if (error instanceof DuplicateSignupError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof InvalidCampaignError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof TypeError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Error in sign up route", error);
    return NextResponse.json({ message: "Failed to sign up" }, { status: 500 });
  }
};
