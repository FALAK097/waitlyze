import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AccessError, campaignScope, createWorkspaceService } from "./service.mjs";

export async function sessionActor() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new AccessError(401);
  return session.user;
}
export async function requireCampaign(id, permission = "viewCampaign") {
  const user = await sessionActor();
  const campaign = await createWorkspaceService(prisma).campaign(user.id, id, permission);
  return { user, campaign, scope: campaignScope(user.id, permission) };
}

export async function requireCampaignPage(id, permission) {
  try { return await requireCampaign(id, permission); }
  catch (error) { if (error instanceof AccessError) notFound(); throw error; }
}
