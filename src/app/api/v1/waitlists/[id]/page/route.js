import {
  configureWaitlistFormRulesOp,
  configureWaitlistRewardsOp,
  parseTemplateSnapshotOrDefault,
  updateWaitlistSnapshotOp,
} from "@/lib/api/platform-ops.mjs";
import {
  authenticateV1,
  requireV1Waitlist,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";

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
    status: true,
    templateRevision: true,
    publishedRevision: true,
    templateSnapshot: true,
    publicationRevisions: {
      orderBy: { revision: "desc" },
      take: 1,
      select: { revision: true, snapshot: true, createdAt: true },
    },
    updatedAt: true,
  });
  if (check.error) return check.error;

  const snapshot = parseTemplateSnapshotOrDefault(check.waitlist);
  const latestPub = check.waitlist.publicationRevisions?.[0] ?? null;
  return v1Json(
    {
      waitlistId: check.waitlist.id,
      status: check.waitlist.status,
      templateRevision: check.waitlist.templateRevision,
      publishedRevision: check.waitlist.publishedRevision,
      templateSnapshot: snapshot,
      publishedSnapshot: latestPub?.snapshot ?? null,
      publishedAt: latestPub?.createdAt ?? null,
      form: snapshot.form,
      rewards: snapshot.rewards,
      updatedAt: check.waitlist.updatedAt,
    },
    { budget },
  );
}

export async function PUT(request, { params }) {
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
    templateRevision: true,
    templateSnapshot: true,
  });
  if (check.error) return check.error;

  try {
    const snapshot = body?.snapshot ?? body;
    const result = await updateWaitlistSnapshotOp({
      userId: authContext.userId,
      waitlist: check.waitlist,
      snapshot,
      expectedRevision: body?.expectedRevision,
    });
    return v1Json(result, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
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
    templateRevision: true,
    templateSnapshot: true,
  });
  if (check.error) return check.error;

  try {
    const hasForm = Boolean(body?.form && typeof body.form === "object");
    const hasRewards = Boolean(
      (body?.rewards && typeof body.rewards === "object") || Array.isArray(body?.tiers),
    );
    if (!hasForm && !hasRewards) {
      const result = await updateWaitlistSnapshotOp({
        userId: authContext.userId,
        waitlist: check.waitlist,
        snapshot: body?.snapshot ?? body,
        expectedRevision: body?.expectedRevision,
      });
      return v1Json(result, { budget });
    }

    let latest = {
      templateRevision: check.waitlist.templateRevision,
      snapshot: parseTemplateSnapshotOrDefault(check.waitlist),
    };
    if (hasForm) {
      const formRes = await configureWaitlistFormRulesOp({
        userId: authContext.userId,
        waitlist: check.waitlist,
        formPatch: body.form,
      });
      latest = {
        templateRevision: formRes.revision,
        form: formRes.form,
        snapshot: formRes.snapshot,
      };
    }
    if (hasRewards) {
      const rwRes = await configureWaitlistRewardsOp({
        userId: authContext.userId,
        waitlist: {
          ...check.waitlist,
          templateSnapshot: latest.snapshot,
          templateRevision: latest.templateRevision,
        },
        rewardsPatch: body.rewards || {},
        tiers: body.tiers,
      });
      latest = {
        ...latest,
        templateRevision: rwRes.revision,
        rewards: rwRes.rewards,
        snapshot: rwRes.snapshot,
      };
    }
    return v1Json(latest, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
