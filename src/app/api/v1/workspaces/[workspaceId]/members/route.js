import { randomBytes, randomUUID } from "node:crypto";

import { renderWorkspaceInvitation } from "@/emails/render.jsx";
import { workspaceInvitationText } from "@/emails/text.mjs";
import {
  authenticateV1,
  resolveV1Workspace,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import { getWorkspaceEntitlements, requireCapacity } from "@/lib/billing/plans.mjs";
import { sendPlatformEmail } from "@/lib/emails/platform.mjs";
import { env } from "@/lib/env.mjs";
import { encryptIntegrationSecret } from "@/lib/integrations/secrets.mjs";
import prisma from "@/lib/prisma.js";
import { consumePublicBudget } from "@/lib/security/public-rate-limit.mjs";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import {
  hashInvitationToken,
  invitationExpiry,
  normalizeInvitationEmail,
  revokeWorkspaceInvitation,
} from "@/lib/workspaces/invitations.mjs";
import { createWorkspaceService } from "@/lib/workspaces/service.mjs";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "workspace:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "viewCampaign");
  if (wsCheck.error) return wsCheck.error;

  const now = new Date();
  const [members, invitations] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId: wsCheck.workspaceId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    prisma.workspaceInvitation.findMany({
      where: {
        workspaceId: wsCheck.workspaceId,
        status: { in: ["PENDING", "SEND_FAILED"] },
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        emailNormalized: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return v1Json(
    {
      members: members.map((m) => ({
        userId: m.userId,
        role: m.role,
        name: m.user.name,
        email: m.user.email,
        createdAt: m.createdAt,
      })),
      pendingInvitations: invitations,
    },
    { budget },
  );
}

export async function POST(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "workspace:manage");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageWorkspace");
  if (wsCheck.error) return wsCheck.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return v1Error(400, "INVALID_JSON", "Request body must be valid JSON.", undefined, budget);
  }

  const email = normalizeInvitationEmail(body?.email);
  const role = body?.role || "MEMBER";
  if (!email) {
    return v1Error(400, "INVALID_EMAIL", "Enter a valid email address.", undefined, budget);
  }
  if (!["MEMBER", "ADMIN"].includes(role)) {
    return v1Error(400, "INVALID_ROLE", "Choose MEMBER or ADMIN.", undefined, budget);
  }
  if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY) {
    return v1Error(
      503,
      "NOT_CONFIGURED",
      "Secure invitations aren't configured.",
      undefined,
      budget,
    );
  }

  try {
    const actor = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: wsCheck.workspaceId, userId: authContext.userId },
      },
      select: { role: true, user: { select: { name: true } } },
    });
    if (!actor || !["OWNER", "ADMIN"].includes(actor.role)) {
      return v1Error(
        403,
        "FORBIDDEN",
        "Only admins or owners can invite members.",
        undefined,
        budget,
      );
    }
    if (role === "ADMIN" && actor.role !== "OWNER") {
      return v1Error(403, "FORBIDDEN", "Only owners can invite admins.", undefined, budget);
    }

    const now = new Date();
    const [existingMembers, entitlements, memberCount, pendingCount] = await Promise.all([
      prisma.workspaceMember.findMany({
        where: { workspaceId: wsCheck.workspaceId },
        select: { user: { select: { email: true } } },
      }),
      getWorkspaceEntitlements(prisma, wsCheck.workspaceId),
      prisma.workspaceMember.count({ where: { workspaceId: wsCheck.workspaceId } }),
      prisma.workspaceInvitation.count({
        where: {
          workspaceId: wsCheck.workspaceId,
          status: { in: ["PENDING", "SEND_FAILED"] },
          expiresAt: { gt: now },
        },
      }),
    ]);

    if (existingMembers.some((m) => normalizeInvitationEmail(m.user?.email) === email)) {
      return v1Error(
        409,
        "ALREADY_MEMBER",
        "That person is already a workspace member.",
        undefined,
        budget,
      );
    }

    requireCapacity({
      entitlements,
      feature: "members",
      used: memberCount + pendingCount,
      message: "Upgrade your plan to invite more workspace members.",
    });

    await consumePublicBudget(prisma, {
      kind: "invitation",
      campaignId: wsCheck.workspaceId,
      actorId: authContext.userId,
      email,
    });

    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashInvitationToken(token);
    const encrypted = encryptIntegrationSecret(token);
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        id: randomUUID(),
        workspaceId: wsCheck.workspaceId,
        emailNormalized: email,
        role,
        tokenHash,
        tokenCiphertext: encrypted.secretCiphertext,
        tokenIv: encrypted.secretIv,
        tokenTag: encrypted.secretTag,
        expiresAt: invitationExpiry(now),
        createdByUserId: authContext.userId,
      },
    });

    const base = new URL(env.BETTER_AUTH_URL);
    const url = new URL(`/accept-invitation/${encodeURIComponent(token)}`, base.origin).toString();
    const roleLabel = role === "ADMIN" ? "Admin" : "Member";
    const props = {
      inviterName: actor.user?.name || "A workspace admin",
      workspaceName: wsCheck.workspaceName,
      role: roleLabel,
      url,
    };
    const html = await renderWorkspaceInvitation(props);
    await sendPlatformEmail({
      to: email,
      subject: `Join ${wsCheck.workspaceName.replace(/[\r\n]+/g, " ")} on Waitlyze`,
      html,
      text: workspaceInvitationText(props),
      idempotencyKey: `workspace-invitation-${invitation.id}-${tokenHash.slice(0, 16)}`,
    });
    await prisma.workspaceInvitation.updateMany({
      where: { id: invitation.id, status: "PENDING" },
      data: { tokenCiphertext: "", tokenIv: "", tokenTag: "" },
    });

    await recordAuditEvent(prisma, {
      workspaceId: wsCheck.workspaceId,
      userId: authContext.userId,
      action: AUDIT_ACTIONS.MEMBER_INVITED,
      resourceType: "invitation",
      resourceId: invitation.id,
      resourceName: email,
      detail: `Invited as ${role}`,
    });

    return v1Json(
      { id: invitation.id, email, role, status: "PENDING", expiresAt: invitation.expiresAt },
      { status: 201, budget },
    );
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function PATCH(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "workspace:manage");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageWorkspace");
  if (wsCheck.error) return wsCheck.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return v1Error(400, "INVALID_JSON", "Request body must be valid JSON.", undefined, budget);
  }

  try {
    const res = await createWorkspaceService(prisma).changeWorkspaceMemberRole(
      authContext.userId,
      wsCheck.workspaceId,
      body?.userId,
      body?.role,
    );
    await recordAuditEvent(prisma, {
      workspaceId: wsCheck.workspaceId,
      userId: authContext.userId,
      action: AUDIT_ACTIONS.MEMBER_ROLE_CHANGED,
      resourceType: "member",
      resourceId: body?.userId,
      detail: `Role -> ${body?.role}`,
    });
    return v1Json(res, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function DELETE(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "workspace:manage");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageWorkspace");
  if (wsCheck.error) return wsCheck.error;

  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const invitationId = url.searchParams.get("invitationId") || body?.invitationId;
  const userId = url.searchParams.get("userId") || body?.userId;

  try {
    if (invitationId) {
      const res = await revokeWorkspaceInvitation(prisma, {
        invitationId,
        workspaceId: wsCheck.workspaceId,
        actorId: authContext.userId,
      });
      if (!res.success) {
        return v1Error(404, "NOT_FOUND", "Active invitation not found.", undefined, budget);
      }
      await recordAuditEvent(prisma, {
        workspaceId: wsCheck.workspaceId,
        userId: authContext.userId,
        action: AUDIT_ACTIONS.INVITATION_REVOKED,
        resourceType: "invitation",
        resourceId: invitationId,
      });
      return v1Json({ revoked: true, invitationId }, { budget });
    }

    if (!userId) {
      return v1Error(400, "MISSING_TARGET", "Provide userId or invitationId.", undefined, budget);
    }
    const removed = await createWorkspaceService(prisma).removeWorkspaceMember(
      authContext.userId,
      wsCheck.workspaceId,
      userId,
    );
    await recordAuditEvent(prisma, {
      workspaceId: wsCheck.workspaceId,
      userId: authContext.userId,
      action: AUDIT_ACTIONS.MEMBER_REMOVED,
      resourceType: "member",
      resourceId: userId,
      resourceName: removed.email,
    });
    return v1Json({ removed: true, ...removed }, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
