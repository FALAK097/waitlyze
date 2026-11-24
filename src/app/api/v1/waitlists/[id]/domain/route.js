import {
  connectCustomDomainOp,
  formatSafeDomain,
  removeCustomDomainOp,
  verifyCustomDomainOp,
} from "@/lib/api/infra-ops.mjs";
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
  const auth = await authenticateV1(request, "waitlist:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "viewCampaign", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  const row = await prisma.customDomain.findUnique({ where: { waitListId: check.waitlist.id } });
  return v1Json(formatSafeDomain(row), { budget });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const auth = await authenticateV1(request, "waitlist:manage");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return v1Error(400, "INVALID_JSON", "Request body must be valid JSON.", undefined, budget);
  }

  const check = await requireV1Waitlist(authContext, id, "publishCampaign", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  try {
    const domain = await connectCustomDomainOp({
      waitlist: check.waitlist,
      rawHostname: body?.hostname || body?.domain,
    });
    return v1Json(domain, { status: 201, budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function PATCH(request, { params }) {
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
    const domain = await verifyCustomDomainOp(check.waitlist.id);
    return v1Json(domain, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function DELETE(request, { params }) {
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
    const result = await removeCustomDomainOp(check.waitlist.id);
    return v1Json(result, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
