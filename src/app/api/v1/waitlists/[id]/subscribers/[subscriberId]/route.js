import { deleteWaitlistSubscriberOp, updateWaitlistSubscriberOp } from "@/lib/api/platform-ops.mjs";
import {
  authenticateV1,
  requireV1Waitlist,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import prisma from "@/lib/prisma.js";
import { summarizeSignupRewards } from "@/lib/referrals/rewards.mjs";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { id, subscriberId } = await params;
  const auth = await authenticateV1(request, "subscribers:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "viewAudience", {
    id: true,
    workspaceId: true,
    showReferrals: true,
  });
  if (check.error) return check.error;

  const [subscriber, totalSignups] = await Promise.all([
    prisma.signUp.findFirst({
      where: { id: subscriberId, waitListId: check.waitlist.id },
      include: {
        referredBy: { select: { referredById: true, referralCode: true, reviewStatus: true } },
        pointEvents: { orderBy: { createdAt: "desc" }, take: 25 },
      },
    }),
    prisma.signUp.count({ where: { waitListId: check.waitlist.id } }),
  ]);

  if (!subscriber) {
    return v1Error(404, "NOT_FOUND", "Subscriber not found.", undefined, budget);
  }

  const summary = await summarizeSignupRewards(prisma, check.waitlist.id, subscriber);

  return v1Json(
    {
      id: subscriber.id,
      waitlistId: check.waitlist.id,
      email: subscriber.email,
      phone: subscriber.phone,
      referralCode: subscriber.referralCode,
      position: summary.position ?? null,
      totalSignups,
      points: subscriber.points,
      referralCount: summary.referralCount ?? 0,
      isVerified: Boolean(subscriber.verifiedAt),
      verifiedAt: subscriber.verifiedAt,
      marketingConsent: Boolean(
        subscriber.marketingConsentAt && !subscriber.marketingUnsubscribedAt,
      ),
      marketingConsentAt: subscriber.marketingConsentAt,
      marketingUnsubscribedAt: subscriber.marketingUnsubscribedAt,
      customFields: subscriber.customFields,
      country: subscriber.country,
      city: subscriber.city,
      device: subscriber.deviceType,
      utmSource: subscriber.utmSource,
      utmMedium: subscriber.utmMedium,
      utmCampaign: subscriber.utmCampaign,
      referredBy: subscriber.referredBy,
      rewardSummary: summary,
      recentPointEvents: subscriber.pointEvents,
      createdAt: subscriber.createdAt,
    },
    { budget },
  );
}

export async function PATCH(request, { params }) {
  const { id, subscriberId } = await params;
  const auth = await authenticateV1(request, "subscribers:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return v1Error(400, "INVALID_JSON", "Request body must be valid JSON.", undefined, budget);
  }

  const check = await requireV1Waitlist(authContext, id, "manageAudience", {
    id: true,
    workspaceId: true,
    showReferrals: true,
  });
  if (check.error) return check.error;

  try {
    const updated = await updateWaitlistSubscriberOp({
      waitlist: check.waitlist,
      subscriberId,
      updates: body,
    });
    return v1Json(updated, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function DELETE(request, { params }) {
  const { id, subscriberId } = await params;
  const auth = await authenticateV1(request, "subscribers:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "manageAudience", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  try {
    const deleted = await deleteWaitlistSubscriberOp({
      waitlistId: check.waitlist.id,
      subscriberId,
    });
    const totalSignups = await prisma.signUp.count({ where: { waitListId: check.waitlist.id } });
    return v1Json({ ...deleted, totalSignups }, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
