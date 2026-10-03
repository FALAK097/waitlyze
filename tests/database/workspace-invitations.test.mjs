import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { acceptWorkspaceInvitation, hashInvitationToken, revokeWorkspaceInvitation } from "../../src/lib/workspaces/invitations.mjs";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL) }) });

test("workspace invitations enforce verified identity, expiry, revocation, and one-time acceptance", async (t) => {
  const ownerId = `invite-owner-${randomUUID()}`;
  const memberId = `invite-member-${randomUUID()}`;
  const wrongId = `invite-wrong-${randomUUID()}`;
  let workspace;
  t.after(async () => {
    if (workspace) await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.deleteMany({ where: { id: { in: [ownerId, memberId, wrongId] } } });
    await db.$disconnect();
  });
  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid`, emailVerified: true } });
  workspace = await db.workspace.create({ data: { name: "Launch team" } });
  await db.workspaceMember.create({ data: { workspaceId: workspace.id, userId: ownerId, role: "OWNER" } });
  await db.user.create({ data: { id: memberId, email: "teammate@example.invalid", emailVerified: true } });
  await db.user.create({ data: { id: wrongId, email: "someone-else@example.invalid", emailVerified: true } });

  const token = randomBytes(32).toString("base64url");
  const invitation = await db.workspaceInvitation.create({ data: {
    workspaceId: workspace.id,
    emailNormalized: "teammate@example.invalid",
    role: "MEMBER",
    tokenHash: hashInvitationToken(token),
    tokenCiphertext: "encrypted-token",
    tokenIv: "iv",
    tokenTag: "tag",
    expiresAt: new Date(Date.now() + 60_000),
    createdByUserId: ownerId,
  } });

  await t.test("only a verified matching account can accept, once", async () => {
    assert.deepEqual(await acceptWorkspaceInvitation(db, { token, user: { id: wrongId, email: "someone-else@example.invalid", emailVerified: true } }), { success: false, code: "WRONG_ACCOUNT" });
    assert.deepEqual(await acceptWorkspaceInvitation(db, { token, user: { id: memberId, email: "teammate@example.invalid", emailVerified: false } }), { success: false, code: "VERIFY_EMAIL" });
    assert.deepEqual(await acceptWorkspaceInvitation(db, { token, user: { id: memberId, email: "teammate@example.invalid", emailVerified: true } }), { success: true, workspaceId: workspace.id });
    const membership = await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: memberId } } });
    assert.equal(membership.role, "MEMBER");
    const stored = await db.workspaceInvitation.findUnique({ where: { id: invitation.id } });
    assert.equal(stored.status, "ACCEPTED");
    assert.equal(stored.tokenCiphertext, "");
    assert.equal(stored.tokenHash, hashInvitationToken(token));
    assert.deepEqual(await acceptWorkspaceInvitation(db, { token, user: { id: memberId, email: "teammate@example.invalid", emailVerified: true } }), { success: false, code: "INVALID" });
  });

  await t.test("members cannot revoke; owner can revoke and clears recoverable token", async () => {
    const revokeToken = randomBytes(32).toString("base64url");
    const revoke = await db.workspaceInvitation.create({ data: {
      workspaceId: workspace.id, emailNormalized: "next@example.invalid", role: "MEMBER",
      tokenHash: hashInvitationToken(revokeToken), tokenCiphertext: "encrypted", tokenIv: "iv", tokenTag: "tag",
      expiresAt: new Date(Date.now() + 60_000), createdByUserId: ownerId,
    } });
    assert.deepEqual(await revokeWorkspaceInvitation(db, { invitationId: revoke.id, workspaceId: workspace.id, actorId: memberId }), { success: false, code: "NOT_FOUND" });
    assert.deepEqual(await revokeWorkspaceInvitation(db, { invitationId: revoke.id, workspaceId: workspace.id, actorId: ownerId }), { success: true });
    const stored = await db.workspaceInvitation.findUnique({ where: { id: revoke.id } });
    assert.equal(stored.status, "REVOKED");
    assert.equal(stored.tokenCiphertext, "");
  });

  await t.test("expired invitation is unusable and its recoverable token is cleared", async () => {
    const expiredToken = randomBytes(32).toString("base64url");
    const expired = await db.workspaceInvitation.create({ data: {
      workspaceId: workspace.id, emailNormalized: "expired@example.invalid", role: "MEMBER",
      tokenHash: hashInvitationToken(expiredToken), tokenCiphertext: "encrypted", tokenIv: "iv", tokenTag: "tag",
      expiresAt: new Date(Date.now() - 1), createdByUserId: ownerId,
    } });
    assert.deepEqual(await acceptWorkspaceInvitation(db, { token: expiredToken, user: { id: memberId, email: "expired@example.invalid", emailVerified: true } }), { success: false, code: "EXPIRED" });
    const stored = await db.workspaceInvitation.findUnique({ where: { id: expired.id } });
    assert.equal(stored.status, "EXPIRED");
    assert.equal(stored.tokenCiphertext, "");
  });
});
