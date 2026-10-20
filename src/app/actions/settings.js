"use server";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { AccessError, createWorkspaceService } from "@/lib/workspaces/service.mjs";

export async function saveProfile(previous, form) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { error: "Sign in again to save your profile." };
  const name = form.get("name");
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80)
    return { error: "Enter a name between 1 and 80 characters." };
  try {
    await prisma.user.update({ where: { id: session.user.id }, data: { name: name.trim() } });
    revalidatePath("/settings");
    return { success: "Profile saved.", savedName: name.trim() };
  } catch {
    return { error: "Could not save your profile. Try again." };
  }
}

export async function saveWorkspaceName(previous, form) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { error: "Sign in again to save workspace settings." };
  const workspaceId = form.get("workspaceId");
  const name = form.get("name");
  if (typeof workspaceId !== "string" || !workspaceId)
    return { error: "Choose a workspace to update." };
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    return { error: "Enter a workspace name between 1 and 80 characters." };
  }
  try {
    await createWorkspaceService(prisma).renameWorkspace(session.user.id, workspaceId, name);
    await recordAuditEvent(prisma, {
      workspaceId,
      userId: session.user.id,
      action: AUDIT_ACTIONS.WORKSPACE_RENAMED,
      resourceType: "workspace",
      resourceId: workspaceId,
      resourceName: name.trim(),
    });
    revalidatePath("/settings");
    revalidatePath("/(app)", "layout");
    return { success: "Workspace name saved.", savedName: name.trim() };
  } catch (error) {
    if (error instanceof AccessError)
      return { error: "You don’t have permission to rename this workspace." };
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
    revalidatePath(`/waitlists/${waitListId}/settings`);
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
  (await cookies()).set("waitlyze-workspace", id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/waitlists");
}

export async function createWorkspace(previous, form) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/");
  const name = form?.get("name");
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    return { error: "Enter a workspace name between 1 and 80 characters." };
  }
  try {
    const workspace = await createWorkspaceService(prisma).createWorkspace(session.user.id, name);
    await recordAuditEvent(prisma, {
      workspaceId: workspace.id,
      userId: session.user.id,
      action: AUDIT_ACTIONS.WORKSPACE_CREATED,
      resourceType: "workspace",
      resourceId: workspace.id,
      resourceName: workspace.name,
      detail: "Workspace created and selected",
    });
    (await cookies()).set("waitlyze-workspace", workspace.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch {
    return { error: "Could not create the workspace. Try again." };
  }
  redirect("/waitlists");
}

export async function deleteWorkspace(previous, form) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/");
  const workspaceId = form.get("workspaceId");
  const confirmation =
    typeof form.get("confirmation") === "string" ? form.get("confirmation").trim() : "";
  if (typeof workspaceId !== "string" || !workspaceId)
    return { error: "Choose a workspace to delete." };
  try {
    const service = createWorkspaceService(prisma);
    const workspace = await service.requireAccess(session.user.id, workspaceId, "manageWorkspace");
    if (!confirmation || confirmation !== workspace.name) {
      return { error: `Type “${workspace.name}” to confirm deletion.` };
    }
    await service.deleteWorkspace(session.user.id, workspaceId);
  } catch (error) {
    if (error instanceof TypeError) return { error: error.message };
    if (error instanceof AccessError)
      return { error: "Only a workspace owner can delete this workspace." };
    return { error: "Could not delete this workspace. Try again." };
  }
  const store = await cookies();
  if (store.get("waitlyze-workspace")?.value === workspaceId) store.delete("waitlyze-workspace");
  redirect("/waitlists");
}

export async function leaveWorkspace(previous, form) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/");
  const workspaceId = form.get("workspaceId");
  if (typeof workspaceId !== "string" || !workspaceId)
    return { error: "Choose a workspace to leave." };
  try {
    await createWorkspaceService(prisma).leaveWorkspace(session.user.id, workspaceId);
    await recordAuditEvent(prisma, {
      workspaceId,
      userId: session.user.id,
      action: AUDIT_ACTIONS.MEMBER_LEFT,
      resourceType: "member",
      resourceId: session.user.id,
      resourceName: session.user.email || session.user.name,
    });
  } catch (error) {
    if (error instanceof TypeError) return { error: error.message };
    return { error: "Could not leave this workspace. Try again." };
  }
  const store = await cookies();
  if (store.get("waitlyze-workspace")?.value === workspaceId) store.delete("waitlyze-workspace");
  redirect("/waitlists");
}
