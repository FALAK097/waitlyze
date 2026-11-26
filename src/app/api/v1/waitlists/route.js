import { createDraftWaitlistOp, waitlistPublicUrl } from "@/lib/api/platform-ops.mjs";
import {
  authenticateV1,
  resolveV1Workspace,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import prisma from "@/lib/prisma";
import { selectedWorkspaceId } from "@/lib/workspaces/current";
import { AccessError, campaignScope } from "@/lib/workspaces/service.mjs";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request) {
  let budget = null;
  try {
    const authResult = await authenticateV1(request, "campaigns:read");
    if (authResult.response) return authResult.response;
    const { authContext } = authResult;
    budget = authResult.budget;

    const params = request.nextUrl.searchParams;
    const status = params.get("status") || "ALL";
    const search = (params.get("search") || "").trim();
    const limitParam = params.get("limit");
    const offsetParam = params.get("offset");
    const limit = limitParam
      ? Math.min(Math.max(Number.parseInt(limitParam, 10) || 20, 1), 100)
      : 100;
    const offset = offsetParam ? Math.max(Number.parseInt(offsetParam, 10) || 0, 0) : 0;

    const requestedWorkspaceId = params.get("workspaceId");
    const workspaceId =
      authContext.workspaceId ||
      requestedWorkspaceId ||
      (authContext.authType === "session" ? await selectedWorkspaceId(authContext.userId) : null);

    const where = {
      ...campaignScope(authContext.userId, "viewCampaign", workspaceId || undefined),
      ...(authContext.waitlistId ? { id: authContext.waitlistId } : {}),
      ...(status !== "ALL" && ["DRAFT", "PUBLISHED", "PAUSED"].includes(status) ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
              { publicSlug: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, waitlists] = await Promise.all([
      prisma.waitList.count({ where }),
      prisma.waitList.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          publicSlug: true,
          websiteUrl: true,
          showReferrals: true,
          sendEmailsToSubscribers: true,
          fraudMode: true,
          workspaceId: true,
          createdAt: true,
          updatedAt: true,
          customDomain: { select: { hostname: true, status: true } },
          _count: { select: { signUps: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
    ]);

    const data = waitlists.map((w) => {
      const activeHost = w.customDomain?.status === "ACTIVE" ? w.customDomain.hostname : null;
      return {
        id: w.id,
        name: w.name,
        description: w.description,
        status: w.status,
        publicSlug: w.publicSlug,
        publicUrl: waitlistPublicUrl(w.publicSlug, activeHost),
        customDomain: w.customDomain?.hostname || null,
        customDomainStatus: w.customDomain?.status || null,
        websiteUrl: w.websiteUrl,
        showReferrals: w.showReferrals,
        sendEmailsToSubscribers: w.sendEmailsToSubscribers,
        fraudMode: w.fraudMode,
        workspaceId: w.workspaceId,
        totalSubscribers: w._count.signUps,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      };
    });

    return v1Json(data, { budget, pagination: { total, limit, offset } });
  } catch (error) {
    if (error instanceof AccessError) {
      return mapOpError(error, budget);
    }
    console.error("Error fetching waitlists:", error);
    return v1Error(500, "server_error", "Internal server error", undefined, budget);
  }
}

export async function POST(request) {
  let budget = null;
  try {
    const authResult = await authenticateV1(request, "campaigns:write");
    if (authResult.response) return authResult.response;
    const { authContext } = authResult;
    budget = authResult.budget;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return v1Error(400, "invalid_request", "JSON body is required.");
    }

    const ws = await resolveV1Workspace(authContext, body.workspaceId || null, "editCampaign");
    if (ws.error) return ws.error;

    if (typeof body.name !== "string" || !body.name.trim()) {
      return v1Error(400, "invalid_name", "Waitlist name is required.");
    }

    const draft = await createDraftWaitlistOp({
      userId: authContext.userId,
      workspaceId: ws.workspaceId,
      name: body.name.trim(),
      description: typeof body.description === "string" ? body.description : "",
      websiteUrl: typeof body.websiteUrl === "string" ? body.websiteUrl : null,
      publicSlug: typeof body.publicSlug === "string" ? body.publicSlug : undefined,
      templateId: typeof body.templateId === "string" ? body.templateId : "simple",
      showReferrals: typeof body.showReferrals === "boolean" ? body.showReferrals : true,
      sendEmailsToSubscribers:
        typeof body.sendEmailsToSubscribers === "boolean" ? body.sendEmailsToSubscribers : true,
      creationKey: typeof body.creationKey === "string" ? body.creationKey : undefined,
    });

    return v1Json(
      {
        id: draft.id,
        name: draft.name,
        description: draft.description,
        status: draft.status,
        publicSlug: draft.publicSlug,
        publicUrl: waitlistPublicUrl(draft.publicSlug),
        workspaceId: draft.workspaceId,
        templateRevision: draft.templateRevision,
        createdAt: draft.createdAt,
      },
      { status: 201, budget },
    );
  } catch (error) {
    if (error?.name === "ZodError") {
      return v1Error(
        400,
        "validation_error",
        error.message || "Invalid waitlist input.",
        undefined,
        budget,
      );
    }
    return mapOpError(error, budget);
  }
}
