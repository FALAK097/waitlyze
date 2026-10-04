import { createHash } from "node:crypto";

const ACTIVE_STATUSES = ["PENDING", "SEND_FAILED"];
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function normalizeInvitationEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function hashInvitationToken(token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  return createHash("sha256").update(token).digest("hex");
}

export function invitationExpiry(now = new Date()) {
  return new Date(now.getTime() + INVITATION_TTL_MS);
}

export async function loadWorkspaceInvitation(db, token, now = new Date()) {
  const tokenHash = hashInvitationToken(token);
  if (!tokenHash) return null;
  const invite = await db.workspaceInvitation.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      emailNormalized: true,
      role: true,
      status: true,
      expiresAt: true,
      workspace: { select: { name: true } },
    },
  });
  if (!invite || !ACTIVE_STATUSES.includes(invite.status) || invite.expiresAt <= now) return null;
  return invite;
}

export async function acceptWorkspaceInvitation(db, { token, user, now = new Date() }) {
  const tokenHash = hashInvitationToken(token);
  if (!tokenHash || !user?.id) return { success: false, code: "INVALID" };
  if (!user.emailVerified) return { success: false, code: "VERIFY_EMAIL" };
  const email = normalizeInvitationEmail(user.email);
  if (!email) return { success: false, code: "INVALID" };

  const invite = await db.workspaceInvitation.findUnique({
    where: { tokenHash },
    select: { id: true, workspaceId: true, emailNormalized: true, role: true, status: true, expiresAt: true },
  });
  if (!invite || !ACTIVE_STATUSES.includes(invite.status)) return { success: false, code: "INVALID" };
  if (invite.emailNormalized !== email) return { success: false, code: "WRONG_ACCOUNT" };
  if (invite.expiresAt <= now) {
    await db.workspaceInvitation.updateMany({
      where: { id: invite.id, status: { in: ACTIVE_STATUSES }, expiresAt: { lte: now } },
      data: { status: "EXPIRED", tokenCiphertext: "", tokenIv: "", tokenTag: "" },
    });
    return { success: false, code: "EXPIRED" };
  }

  return db.$transaction(async (tx) => {
    const claimed = await tx.workspaceInvitation.updateMany({
      where: { id: invite.id, status: { in: ACTIVE_STATUSES }, expiresAt: { gt: now } },
      data: {
        status: "ACCEPTED",
        acceptedByUserId: user.id,
        acceptedAt: now,
        tokenCiphertext: "",
        tokenIv: "",
        tokenTag: "",
      },
    });
    if (claimed.count !== 1) return { success: false, code: "INVALID" };
    await tx.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
      create: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role },
      update: {},
    });
    return { success: true, workspaceId: invite.workspaceId };
  });
}

export async function revokeWorkspaceInvitation(db, { invitationId, workspaceId, actorId, now = new Date() }) {
  if (typeof invitationId !== "string" || !invitationId || typeof workspaceId !== "string" || !workspaceId || typeof actorId !== "string" || !actorId) {
    return { success: false, code: "NOT_FOUND" };
  }
  const result = await db.workspaceInvitation.updateMany({
    where: {
      id: invitationId,
      workspaceId,
      status: { in: ACTIVE_STATUSES },
      expiresAt: { gt: now },
      workspace: { members: { some: { userId: actorId, role: { in: ["OWNER", "ADMIN"] } } } },
    },
    data: { status: "REVOKED", revokedAt: now, tokenCiphertext: "", tokenIv: "", tokenTag: "" },
  });
  return result.count === 1 ? { success: true } : { success: false, code: "NOT_FOUND" };
}

export const invitationStatuses = ACTIVE_STATUSES;
