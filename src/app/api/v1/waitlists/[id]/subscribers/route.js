import { importSubscribersJsonOp } from "@/lib/api/audience-ops.mjs";
import { addSubscriberDirectOp, listSubscribersOp } from "@/lib/api/platform-ops.mjs";
import {
  authenticateV1,
  requireV1Waitlist,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import prisma from "@/lib/prisma.js";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { id } = await params;
  const auth = await authenticateV1(request, "subscribers:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "viewAudience", {
    id: true,
    workspaceId: true,
    showReferrals: true,
  });
  if (check.error) return check.error;

  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") || "50", 10);
  const rawOffset = Number.parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;
  const status = (url.searchParams.get("status") || "ALL").toUpperCase();
  const search = url.searchParams.get("search") || url.searchParams.get("q") || "";
  const country = url.searchParams.get("country") || "";
  const city = url.searchParams.get("city") || "";
  const utmSource = url.searchParams.get("utmSource") || "";
  const device = url.searchParams.get("device") || "";
  const sortBy = url.searchParams.get("sortBy") || "createdAt";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";

  try {
    const result = await listSubscribersOp({
      waitlist: check.waitlist,
      status,
      search,
      country,
      city,
      utmSource,
      device,
      sortBy,
      sortOrder,
      limit,
      offset,
    });
    return v1Json(result.items, {
      budget,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.items.length < result.total,
      },
    });
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function POST(request, { params }) {
  const { id } = await params;
  const auth = await authenticateV1(request, "subscribers:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return v1Error(400, "INVALID_JSON", "Request body must be valid JSON.", undefined, budget);
  }

  const bulkRows = Array.isArray(body?.subscribers)
    ? body.subscribers
    : Array.isArray(body?.rows)
      ? body.rows
      : null;

  if (bulkRows) {
    const check = await requireV1Waitlist(authContext, id, "manageAudience", {
      id: true,
      workspaceId: true,
      name: true,
      publicSlug: true,
      showReferrals: true,
      templateSnapshot: true,
    });
    if (check.error) return check.error;

    try {
      const result = await importSubscribersJsonOp({ waitlist: check.waitlist, rows: bulkRows });
      const totalSignups = await prisma.signUp.count({ where: { waitListId: check.waitlist.id } });
      return v1Json({ ...result, totalSignups }, { status: 201, budget });
    } catch (error) {
      return mapOpError(error, budget);
    }
  }

  const check = await requireV1Waitlist(authContext, id, "manageAudience", {
    id: true,
    workspaceId: true,
    name: true,
    publicSlug: true,
    status: true,
    showReferrals: true,
    sendEmailsToSubscribers: true,
    templateSnapshot: true,
  });
  if (check.error) return check.error;

  try {
    const result = await addSubscriberDirectOp({
      waitlist: check.waitlist,
      email: body?.email,
      referralCode: body?.referralCode ?? body?.ref ?? null,
      autoVerify: body?.autoVerify !== undefined ? Boolean(body.autoVerify) : true,
      marketingConsent: Boolean(body?.marketingConsent ?? body?.marketing_consent ?? false),
      phone: body?.phone ?? null,
      customFields: body?.customFields ?? body?.custom_fields ?? null,
      utmSource: body?.utmSource ?? body?.utm_source ?? null,
      utmMedium: body?.utmMedium ?? body?.utm_medium ?? null,
      utmCampaign: body?.utmCampaign ?? body?.utm_campaign ?? null,
      utmTerm: body?.utmTerm ?? body?.utm_term ?? null,
      utmContent: body?.utmContent ?? body?.utm_content ?? null,
      referrer: body?.referrer ?? null,
      landingPage: body?.landingPage ?? null,
    });
    return v1Json(
      {
        alreadyExists: result.alreadyExists,
        totalSignups: result.totalSignups,
        subscriber: {
          id: result.subscriber.id,
          email: result.subscriber.email,
          phone: result.subscriber.phone,
          referralCode: result.subscriber.referralCode,
          position: result.position,
          points: result.subscriber.points,
          isVerified: Boolean(result.subscriber.verifiedAt),
          verifiedAt: result.subscriber.verifiedAt,
          marketingConsent: Boolean(
            result.subscriber.marketingConsentAt && !result.subscriber.marketingUnsubscribedAt,
          ),
          customFields: result.subscriber.customFields,
          createdAt: result.subscriber.createdAt,
        },
        rewardSummary: result.rewardSummary,
      },
      { status: result.alreadyExists ? 200 : 201, budget },
    );
  } catch (error) {
    return mapOpError(error, budget);
  }
}
