import { getWaitlistAnalytics } from "@/lib/analytics/waitlist-analytics.mjs";
import { authenticateV1, requireV1Waitlist, v1CorsResponse, v1Json } from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import prisma from "@/lib/prisma.js";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { id } = await params;
  const auth = await authenticateV1(request, "analytics:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "viewCampaign", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  const url = new URL(request.url);
  const rawDays = Number.parseInt(url.searchParams.get("days") || "30", 10);
  const days = Number.isFinite(rawDays) && rawDays >= 1 && rawDays <= 90 ? rawDays : 30;
  const endDate = url.searchParams.get("endDate") || undefined;
  const timeZone = url.searchParams.get("timeZone") || "UTC";

  try {
    const [analytics, totalSignups, verifiedSignups] = await Promise.all([
      getWaitlistAnalytics(prisma, {
        waitListId: check.waitlist.id,
        days,
        endDate,
        timeZone,
      }),
      prisma.signUp.count({ where: { waitListId: check.waitlist.id } }),
      prisma.signUp.count({ where: { waitListId: check.waitlist.id, verifiedAt: { not: null } } }),
    ]);

    return v1Json(
      {
        ...analytics,
        liveTotals: {
          totalSignups,
          verifiedSignups,
          unverifiedSignups: Math.max(0, totalSignups - verifiedSignups),
        },
      },
      { budget },
    );
  } catch (error) {
    return mapOpError(error, budget);
  }
}
