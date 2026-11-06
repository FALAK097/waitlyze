import { getCampaignPosition } from "../campaigns/referral-position.mjs";

const ELIGIBLE_REFERRAL_STATUSES = ["CLEAR", "APPROVED"];

export function sampleWebhookSubscriber() {
  return {
    email: "ada@example.com",
    phone: "+15555550123",
    customFields: { role: "Founder" },
    verifiedAt: "2026-11-06T09:00:00.000Z",
    marketingConsent: true,
    referralCode: "sample-referral",
    referralLink: "https://example.com/w/sample?r=sample-referral",
    position: 42,
    points: 230,
    referralCount: 5,
    country: "US",
    utmSource: "newsletter",
    utmMedium: "email",
    utmCampaign: "launch",
    utmTerm: null,
    utmContent: null,
  };
}

export async function resolveWebhookSubscriber(db, payload) {
  const data = payload?.data;
  const signupId = data?.signupId || data?.triggeringSignupId;
  if (typeof signupId !== "string" || !signupId) return null;
  const signup = await db.signUp.findFirst({
    where: { id: signupId, waitListId: payload.waitlistId },
    select: {
      id: true,
      email: true,
      phone: true,
      customFields: true,
      verifiedAt: true,
      marketingConsentAt: true,
      marketingUnsubscribedAt: true,
      referralCode: true,
      points: true,
      country: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      utmTerm: true,
      utmContent: true,
      waitList: { select: { publicSlug: true, showReferrals: true } },
    },
  });
  if (!signup) return null;
  const [position, referralCount] = await Promise.all([
    getCampaignPosition(db, payload.waitlistId, signup.id),
    db.referral.count({
      where: {
        referredById: signup.id,
        reviewStatus: { in: ELIGIBLE_REFERRAL_STATUSES },
        signUp: { is: { waitListId: payload.waitlistId, verifiedAt: { not: null } } },
      },
    }),
  ]);
  const base = String(process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");
  const referralLink =
    base && signup.waitList.publicSlug && signup.waitList.showReferrals && signup.referralCode
      ? `${base}/w/${encodeURIComponent(signup.waitList.publicSlug)}?r=${encodeURIComponent(signup.referralCode)}`
      : null;
  return {
    email: signup.email,
    phone: signup.phone,
    customFields: signup.customFields,
    verifiedAt: signup.verifiedAt?.toISOString() ?? null,
    marketingConsent: Boolean(signup.marketingConsentAt && !signup.marketingUnsubscribedAt),
    referralCode: signup.referralCode,
    referralLink,
    position,
    points: signup.points,
    referralCount,
    country: signup.country,
    utmSource: signup.utmSource,
    utmMedium: signup.utmMedium,
    utmCampaign: signup.utmCampaign,
    utmTerm: signup.utmTerm,
    utmContent: signup.utmContent,
  };
}
