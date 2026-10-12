"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { createWorkspaceResendSender } from "@/lib/integrations/resend-sender.mjs";
import { decryptIntegrationSecret, encryptIntegrationSecret } from "@/lib/integrations/secrets.mjs";
import { createWorkspaceService } from "@/lib/workspaces/service.mjs";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { acceptWorkspaceInvitation, hashInvitationToken, invitationExpiry, normalizeInvitationEmail, revokeWorkspaceInvitation } from "@/lib/workspaces/invitations.mjs";

import { consumePublicBudget } from "@/lib/security/public-rate-limit.mjs";

const MAX_PENDING_INVITATIONS = 50;

function createInvitationSender() {
  return createWorkspaceResendSender({
    db: prisma,
    defaults: { apiKey: env.RESEND_API_KEY, fromEmail: env.RESEND_FROM_EMAIL, replyTo: env.RESEND_REPLY_TO },
    createClient: (apiKey) => new Resend(apiKey),
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function invitationUrl(token) {
  const base = new URL(env.BETTER_AUTH_URL);
  if (env.NODE_ENV === "production" && base.protocol !== "https:") throw new Error("Invitation links require HTTPS.");
  return new URL(`/accept-invitation/${encodeURIComponent(token)}`, base.origin).toString();
}

async function managerMembership(userId, workspaceId, targetRole, db = prisma) {
  await createWorkspaceService(db).requireAccess(userId, workspaceId, "manageWorkspace");
  const actor = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
  if (!actor || !["OWNER", "ADMIN"].includes(actor.role)) return null;
  if (targetRole === "ADMIN" && actor.role !== "OWNER") return null;
  return actor;
}

async function sendInvitation(invitation, token, inviterName, workspaceName, actorId) {
  await consumePublicBudget(prisma, { kind: "invitation", campaignId: invitation.workspaceId, actorId, email: invitation.emailNormalized });
  const url = invitationUrl(token);
  const safeName = escapeHtml(inviterName || "A workspace admin");
  const safeWorkspace = escapeHtml(workspaceName);
  const safeRole = invitation.role === "ADMIN" ? "Admin" : "Member";
  const result = await createInvitationSender()({
    to: invitation.emailNormalized,
    subject: `Join ${workspaceName.replace(/[\r\n]+/g, " ")} on Waitlyze`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#00160d;max-width:560px;margin:auto"><p>${safeName} invited you to join <strong>${safeWorkspace}</strong> on Waitlyze as a ${safeRole}.</p><p><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 18px;background:#c6fe1e;color:#00160d;text-decoration:none;border-radius:8px;font-weight:600">Review invitation</a></p><p>This invitation expires in seven days. If you weren’t expecting it, you can ignore this email.</p></div>`,
    workspaceId: invitation.workspaceId,
    idempotencyKey: `workspace-invitation-${invitation.id}-${invitation.tokenHash.slice(0, 16)}`,
  });
  if (result?.error) throw new Error("Email provider rejected the invitation.");
}

export async function inviteWorkspaceMember(previous, form) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { error: "Sign in again to invite a teammate." };
  const workspaceId = form.get("workspaceId");
  const email = normalizeInvitationEmail(form.get("email"));
  const role = form.get("role");
  if (typeof workspaceId !== "string" || !workspaceId) return { error: "Choose a workspace first." };
  if (!email) return { error: "Enter a valid email address." };
  if (!new Set(["MEMBER", "ADMIN"]).has(role)) return { error: "Choose Member or Admin." };
  if (email === normalizeInvitationEmail(session.user.email)) return { error: "You already belong to this workspace." };
  if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY) return { error: "Secure invitations aren’t configured for this workspace yet." };

  try {
    const now = new Date();
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashInvitationToken(token);
    const encrypted = encryptIntegrationSecret(token);
    const actor = await managerMembership(session.user.id, workspaceId, role).catch(() => null);
    if (!actor) return { error: "You don’t have permission to invite that role." };
    const prepared = await prisma.$transaction(async (tx) => {
      const actor = await managerMembership(session.user.id, workspaceId, role, tx);
      if (!actor) return { error: "You don’t have permission to invite that role." };
      const [existingMember, workspace] = await Promise.all([
        tx.workspaceMember.findFirst({ where: { workspaceId, user: { email: { equals: email, mode: "insensitive" } } }, select: { userId: true } }),
        tx.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } }),
      ]);
      if (!workspace) return { error: "Workspace not found." };
      if (existingMember) return { error: "That person is already a workspace member." };
      await tx.workspaceInvitation.updateMany({ where: { workspaceId, status: { in: ["PENDING", "SEND_FAILED"] }, expiresAt: { lte: now } }, data: { status: "EXPIRED", tokenCiphertext: "", tokenIv: "", tokenTag: "" } });
      const existingInvite = await tx.workspaceInvitation.findFirst({ where: { workspaceId, emailNormalized: email, status: { in: ["PENDING", "SEND_FAILED"] }, expiresAt: { gt: now } }, select: { id: true } });
      if (existingInvite) return { error: "An invitation is already active for that address. Use its action below." };
      const pendingCount = await tx.workspaceInvitation.count({ where: { workspaceId, status: { in: ["PENDING", "SEND_FAILED"] }, expiresAt: { gt: now } } });
      if (pendingCount >= MAX_PENDING_INVITATIONS) return { error: "This workspace has reached its 50 pending invitation limit." };
      const invitation = await tx.workspaceInvitation.create({
        data: {
          id: randomUUID(), workspaceId, emailNormalized: email, role, tokenHash,
          tokenCiphertext: encrypted.secretCiphertext, tokenIv: encrypted.secretIv, tokenTag: encrypted.secretTag,
          expiresAt: invitationExpiry(now), createdByUserId: session.user.id,
        },
      });
      return { invitation, workspace };
    });
    if (prepared.error) return { error: prepared.error };
    const { invitation, workspace } = prepared;
    try {
      await sendInvitation(invitation, token, session.user.name, workspace.name, session.user.id);
      await prisma.workspaceInvitation.updateMany({ where: { id: invitation.id, status: "PENDING" }, data: { tokenCiphertext: "", tokenIv: "", tokenTag: "" } });
    } catch {
      await prisma.workspaceInvitation.updateMany({ where: { id: invitation.id, status: "PENDING" }, data: { status: "SEND_FAILED" } });
      revalidatePath("/settings#team");
      return { error: "The invite is saved, but email delivery failed. Retry it from Pending invitations." };
    }
    await recordAuditEvent(prisma, { workspaceId, userId: session.user.id, action: AUDIT_ACTIONS.MEMBER_INVITED, resourceType: "invitation", resourceId: invitation.id, resourceName: email, detail: `Invited as ${role}` });
    revalidatePath("/settings#team");
    return { success: `Invitation sent to ${email}.` };
  } catch {
    return { error: "Could not create the invitation. Check your connection and try again." };
  }
}

export async function resendWorkspaceInvitation(invitationId) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id || typeof invitationId !== "string" || !invitationId) return { error: "Sign in again to resend this invitation." };
  try {
    const now = new Date();
    const prepared = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "workspace_invitations" WHERE "id" = ${invitationId} FOR UPDATE`;
      const invite = await tx.workspaceInvitation.findFirst({
        where: { id: invitationId, status: { in: ["PENDING", "SEND_FAILED"] }, expiresAt: { gt: now } },
        include: { workspace: { select: { name: true } } },
      });
      if (!invite) return { error: "This invitation has expired or is no longer available." };
      const actor = await managerMembership(session.user.id, invite.workspaceId, invite.role, tx);
      if (!actor) return { error: "You don’t have permission to resend this invitation." };
      if (invite.tokenCiphertext) {
        return { invite, token: decryptIntegrationSecret({ secretCiphertext: invite.tokenCiphertext, secretIv: invite.tokenIv, secretTag: invite.tokenTag }) };
      }
      const token = randomBytes(32).toString("base64url");
      const encrypted = encryptIntegrationSecret(token);
      const updated = await tx.workspaceInvitation.update({
        where: { id: invite.id },
        data: { tokenHash: hashInvitationToken(token), tokenCiphertext: encrypted.secretCiphertext, tokenIv: encrypted.secretIv, tokenTag: encrypted.secretTag },
        include: { workspace: { select: { name: true } } },
      });
      return { invite: updated, token };
    });
    if (prepared.error) return { error: prepared.error };
    const { invite, token } = prepared;
    try {
      await sendInvitation(invite, token, session.user.name, invite.workspace.name, session.user.id);
    } catch {
      await prisma.workspaceInvitation.updateMany({ where: { id: invite.id, status: "PENDING" }, data: { status: "SEND_FAILED" } });
      revalidatePath("/settings#team");
      return { error: "Email delivery failed. The invitation is still available to retry." };
    }
    await prisma.workspaceInvitation.updateMany({ where: { id: invite.id, status: { in: ["PENDING", "SEND_FAILED"] } }, data: { status: "PENDING", tokenCiphertext: "", tokenIv: "", tokenTag: "" } });
    await recordAuditEvent(prisma, { workspaceId: invite.workspaceId, userId: session.user.id, action: AUDIT_ACTIONS.INVITATION_RESENT, resourceType: "invitation", resourceId: invite.id, resourceName: invite.emailNormalized });
    revalidatePath("/settings#team");
    return { success: `Invitation resent to ${invite.emailNormalized}.` };
  } catch {
    return { error: "Email delivery failed. The invitation is still available to retry." };
  }
}

export async function revokeWorkspaceInvite(invitationId, workspaceId) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id || typeof invitationId !== "string" || typeof workspaceId !== "string") return { error: "Sign in again to manage invitations." };
  try {
    const result = await revokeWorkspaceInvitation(prisma, { invitationId, workspaceId, actorId: session.user.id });
    if (!result.success) return { error: "This invitation has expired or is no longer available." };
    await recordAuditEvent(prisma, { workspaceId, userId: session.user.id, action: AUDIT_ACTIONS.INVITATION_REVOKED, resourceType: "invitation", resourceId: invitationId });
    revalidatePath("/settings#team");
    return { success: "Invitation revoked." };
  } catch {
    return { error: "Could not revoke this invitation. Try again." };
  }
}

export async function removeWorkspaceMember(memberUserId, workspaceId) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id || typeof memberUserId !== "string" || typeof workspaceId !== "string") return { error: "Sign in again to manage members." };
  try {
    const removed = await createWorkspaceService(prisma).removeWorkspaceMember(session.user.id, workspaceId, memberUserId);
    await recordAuditEvent(prisma, { workspaceId, userId: session.user.id, action: AUDIT_ACTIONS.MEMBER_REMOVED, resourceType: "member", resourceId: memberUserId, resourceName: removed.name || removed.email });
    revalidatePath("/settings");
    return { success: `${removed.name || removed.email || "Member"} was removed from the workspace.` };
  } catch (error) {
    if (error instanceof TypeError) return { error: error.message };
    return { error: "Could not remove this member. Try again." };
  }
}

export async function changeWorkspaceMemberRole(memberUserId, workspaceId, role) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id || typeof memberUserId !== "string" || typeof workspaceId !== "string") return { error: "Sign in again to manage members." };
  try {
    const changed = await createWorkspaceService(prisma).changeWorkspaceMemberRole(session.user.id, workspaceId, memberUserId, role);
    if (!changed.unchanged) {
      await recordAuditEvent(prisma, { workspaceId, userId: session.user.id, action: AUDIT_ACTIONS.MEMBER_ROLE_CHANGED, resourceType: "member", resourceId: memberUserId, resourceName: changed.name || changed.email, detail: `Role set to ${role === "ADMIN" ? "Admin" : "Member"}` });
    }
    revalidatePath("/settings");
    return { success: changed.unchanged ? "Role is already set." : `${changed.name || changed.email || "Member"} is now ${role === "ADMIN" ? "an admin" : "a member"}.` };
  } catch (error) {
    if (error instanceof TypeError) return { error: error.message };
    return { error: "Could not change this role. Try again." };
  }
}

export async function acceptWorkspaceInvite(previous, form) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { error: "Sign in with the invited account to continue." };
  const token = form.get("token");
  const result = await acceptWorkspaceInvitation(prisma, { token, user: session.user });
  if (!result.success) {
    const messages = {
      INVALID: "This invitation is no longer available. Ask a workspace admin for a new one.",
      EXPIRED: "This invitation expired. Ask a workspace admin for a new one.",
      WRONG_ACCOUNT: "Sign in with the email address this invitation was sent to.",
      VERIFY_EMAIL: "Verify your sign-in email before accepting this invitation.",
    };
    return { error: messages[result.code] || messages.INVALID };
  }
  await recordAuditEvent(prisma, { workspaceId: result.workspaceId, userId: session.user.id, action: AUDIT_ACTIONS.MEMBER_JOINED, resourceType: "member", resourceId: session.user.id, resourceName: session.user.email || session.user.name });
  (await cookies()).set("waitlyze-workspace", result.workspaceId, { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  revalidatePath("/settings");
  redirect("/waitlists");
}
