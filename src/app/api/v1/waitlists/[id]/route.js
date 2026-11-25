import { formatSafeDomain } from "@/lib/api/infra-ops.mjs";
import {
  publicBaseUrl,
  updateWaitlistFieldsOp,
  waitlistPublicUrl,
} from "@/lib/api/platform-ops.mjs";
import {
  authenticateV1,
  requireV1Waitlist,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import prisma from "@/lib/prisma.js";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";

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
    name: true,
    description: true,
    websiteUrl: true,
    publicSlug: true,
    status: true,
    showReferrals: true,
    sendEmailsToSubscribers: true,
    templateRevision: true,
    publishedRevision: true,
    publishedTemplateRevision: true,
    createdAt: true,
    updatedAt: true,
    customDomain: {
      select: {
        hostname: true,
        status: true,
        verification: true,
        dnsRecords: true,
        lastCheckedAt: true,
        lastErrorCode: true,
      },
    },
    _count: { select: { signUps: true } },
  });
  if (check.error) return check.error;
  const { waitlist } = check;

  const verifiedSignups = await prisma.signUp.count({
    where: { waitListId: waitlist.id, verifiedAt: { not: null } },
  });

  const activeHost =
    waitlist.customDomain?.status === "ACTIVE" ? waitlist.customDomain.hostname : null;

  return v1Json(
    {
      id: waitlist.id,
      workspaceId: waitlist.workspaceId,
      name: waitlist.name,
      description: waitlist.description,
      websiteUrl: waitlist.websiteUrl,
      publicSlug: waitlist.publicSlug,
      publicUrl: waitlistPublicUrl(waitlist.publicSlug, activeHost),
      fallbackPublicUrl: waitlist.publicSlug
        ? `${publicBaseUrl()}/w/${encodeURIComponent(waitlist.publicSlug)}`
        : null,
      showReferrals: waitlist.showReferrals,
      sendEmailsToSubscribers: waitlist.sendEmailsToSubscribers,
      templateRevision: waitlist.templateRevision,
      publishedRevision: waitlist.publishedRevision,
      publishedTemplateRevision: waitlist.publishedTemplateRevision,
      status: waitlist.status,
      totalSignups: waitlist._count?.signUps ?? 0,
      verifiedSignups,
      customDomain: formatSafeDomain(waitlist.customDomain),
      createdAt: waitlist.createdAt,
      updatedAt: waitlist.updatedAt,
    },
    { budget },
  );
}

export async function PATCH(request, { params }) {
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

  const check = await requireV1Waitlist(authContext, id, "editCampaign", {
    id: true,
    workspaceId: true,
    name: true,
    description: true,
    websiteUrl: true,
    publicSlug: true,
    templateRevision: true,
    templateSnapshot: true,
    showReferrals: true,
    sendEmailsToSubscribers: true,
  });
  if (check.error) return check.error;

  try {
    const updated = await updateWaitlistFieldsOp({
      userId: authContext.userId,
      waitlist: check.waitlist,
      updates: body,
    });
    return v1Json(updated, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const auth = await authenticateV1(request, "waitlist:manage");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "deleteCampaign", {
    id: true,
    workspaceId: true,
    name: true,
  });
  if (check.error) return check.error;

  try {
    await prisma.waitList.delete({ where: { id: check.waitlist.id } });
    await recordAuditEvent(prisma, {
      workspaceId: check.waitlist.workspaceId,
      userId: authContext.userId,
      action: AUDIT_ACTIONS.WAITLIST_DELETED,
      resourceType: "waitlist",
      resourceId: check.waitlist.id,
      resourceName: check.waitlist.name,
    });
    return v1Json({ deleted: true, id: check.waitlist.id }, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
