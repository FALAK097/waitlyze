import { authenticateV1, requireV1Waitlist, v1CorsResponse, v1Json } from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import { rollbackCampaign } from "@/lib/campaigns/publication.mjs";
import prisma from "@/lib/prisma.js";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function POST(request, { params }) {
  const { id } = await params;
  const auth = await authenticateV1(request, "waitlist:manage");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "publishCampaign", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  try {
    const result = await rollbackCampaign(
      prisma,
      authContext.userId,
      check.waitlist.workspaceId,
      check.waitlist.id,
    );
    return v1Json(result, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
