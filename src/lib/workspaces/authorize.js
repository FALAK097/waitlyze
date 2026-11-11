import { notFound } from "next/navigation";
import { cache } from "react";

import { getWorkspaceEntitlements, requireFeature } from "@/lib/billing/plans.mjs";
import prisma from "@/lib/prisma";

import { currentSession, currentWorkspace } from "./current.js";
import {
  AccessError,
  campaignScope,
  createWorkspaceService,
  workspaceRoleCan,
} from "./service.mjs";

const currentWorkspaceCampaign = cache(async (id) => {
  if (typeof id !== "string" || !id) throw new AccessError();
  const { user, workspace } = await currentWorkspace();
  const started = performance.now();
  const result = await prisma.waitList
    .findFirst({
      where: {
        id,
        workspaceId: workspace.id,
        workspace: { members: { some: { userId: user.id } } },
      },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        publicSlug: true,
        status: true,
        showReferrals: true,
        sendEmailsToSubscribers: true,
        templateRevision: true,
        publishedRevision: true,
        publishedTemplateRevision: true,
        workspace: {
          select: {
            members: {
              where: { userId: user.id },
              select: { role: true },
              take: 1,
            },
          },
        },
      },
    })
    .finally(() => {
      const latencyMs = Math.round(performance.now() - started);
      if (latencyMs >= 500) console.warn("Slow campaign authorization lookup", { latencyMs });
    });
  const role = result?.workspace?.members[0]?.role;
  if (!result || !role) throw new AccessError();
  const { workspace: _workspace, ...campaign } = result;
  return { user, workspace, campaign, role };
});

export async function requireAuth() {
  return sessionActor();
}

export async function sessionActor() {
  const session = await currentSession();
  if (!session?.user?.id) throw new AccessError(401);
  return session.user;
}
export async function requireCampaign(id, permission = "viewCampaign") {
  const user = await sessionActor();
  const campaign = await createWorkspaceService(prisma).campaign(user.id, id, permission);
  return { user, campaign, scope: campaignScope(user.id, permission) };
}

export async function requireCampaignFeature(id, permission, feature) {
  const result = await requireCampaign(id, permission);
  const entitlements = await getWorkspaceEntitlements(prisma, result.campaign.workspaceId);
  requireFeature(entitlements, feature);
  return { ...result, entitlements };
}

export async function requireCampaignPage(id, permission) {
  try {
    const result = await currentWorkspaceCampaign(id);
    if (!workspaceRoleCan(permission, result.role)) throw new AccessError();
    return {
      ...result,
      scope: campaignScope(result.user.id, permission, result.workspace.id),
    };
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
}
