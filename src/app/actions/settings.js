"use server";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AccessError, createWorkspaceService } from "@/lib/workspaces/service.mjs";
import { requireCampaign } from "@/lib/workspaces/authorize";

export async function saveProfile(previous, form) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { error: "Sign in again to save your profile." };
  const name = form.get("name");
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) return { error: "Enter a name between 1 and 80 characters." };
  try {
    await prisma.user.update({ where: { id: session.user.id }, data: { name: name.trim() } });
    revalidatePath("/settings");
    return { success: "Profile saved." };
  } catch { return { error: "Could not save your profile. Try again." }; }
}

export async function saveWorkspaceName(previous, form) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { error: "Sign in again to save workspace settings." };
  const workspaceId = form.get("workspaceId");
  const name = form.get("name");
  if (typeof workspaceId !== "string" || !workspaceId) return { error: "Choose a workspace to update." };
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    return { error: "Enter a workspace name between 1 and 80 characters." };
  }
  try {
    await createWorkspaceService(prisma).renameWorkspace(session.user.id, workspaceId, name);
    revalidatePath("/settings");
    return { success: "Workspace name saved." };
  } catch (error) {
    if (error instanceof AccessError) return { error: "You don’t have permission to update this workspace." };
    return { error: "Could not save the workspace name. Try again." };
  }
}

export async function setWaitlistReferrals(waitListId, enabled) {
  if (typeof enabled !== "boolean") return { error: "Choose whether referral sharing is enabled." };
  try {
    const { campaign, scope } = await requireCampaign(waitListId, "editCampaign");
    await prisma.waitList.update({
      where: { id: waitListId, ...scope },
      data: { showReferrals: enabled },
    });
    revalidatePath(`/wait-lists/${waitListId}/settings`);
    if (campaign.publicSlug) revalidatePath(`/w/${campaign.publicSlug}`);
    return { success: true };
  } catch {
    return { error: "Could not update referral settings. Try again." };
  }
}

export async function selectWorkspace(form) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/");
  const id = form.get("workspaceId");
  await createWorkspaceService(prisma).requireAccess(session.user.id, id, "viewCampaign");
  (await cookies()).set("waitlyze-workspace", id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && !process.env.WAITLYZE_TEST_FIXTURE, path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect("/wait-lists");
}
