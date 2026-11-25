import { waitlistPublicUrl } from "@/lib/api/platform-ops.mjs";
import { authenticateV1, requireV1Waitlist, v1CorsResponse, v1Json } from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import { publishCampaign } from "@/lib/campaigns/publication.mjs";
import prisma from "@/lib/prisma.js";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function POST(request, { params }) {
  const { id } = await params;
  const auth = await authenticateV1(request, "waitlist:manage");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const body = await request.json().catch(() => ({}));
  const check = await requireV1Waitlist(authContext, id, "publishCampaign", {
    id: true,
    workspaceId: true,
    publicSlug: true,
    templateRevision: true,
    customDomain: { select: { hostname: true, status: true } },
  });
  if (check.error) return check.error;

  try {
    const expectedRevision =
      typeof body?.expectedRevision === "number"
        ? body.expectedRevision
        : check.waitlist.templateRevision;
    const result = await publishCampaign(
      prisma,
      authContext.userId,
      check.waitlist.workspaceId,
      check.waitlist.id,
      expectedRevision,
    );
    const activeHost =
      check.waitlist.customDomain?.status === "ACTIVE"
        ? check.waitlist.customDomain.hostname
        : null;
    return v1Json(
      {
        ...result,
        publicSlug: check.waitlist.publicSlug,
        publicUrl: waitlistPublicUrl(check.waitlist.publicSlug, activeHost),
      },
      { budget },
    );
  } catch (error) {
    return mapOpError(error, budget);
  }
}
