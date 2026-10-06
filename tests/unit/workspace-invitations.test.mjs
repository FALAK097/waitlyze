import test from "node:test";
import assert from "node:assert/strict";
import { invitationExpiry, hashInvitationToken, normalizeInvitationEmail } from "../../src/lib/workspaces/invitations.mjs";

test("invitation addresses normalize before they become identity keys", () => {
  assert.equal(normalizeInvitationEmail("  Teammate@Example.COM  "), "teammate@example.com");
  assert.equal(normalizeInvitationEmail("no-at-symbol"), null);
  assert.equal(normalizeInvitationEmail("a@b"), null);
  assert.equal(normalizeInvitationEmail("x".repeat(250) + "@example.com"), null);
  assert.equal(normalizeInvitationEmail(null), null);
});

test("only high-entropy URL-safe invitation tokens are hashed", () => {
  const token = "A".repeat(43);
  assert.match(hashInvitationToken(token), /^[a-f0-9]{64}$/);
  assert.equal(hashInvitationToken(token), hashInvitationToken(token));
  for (const invalid of ["", "short", "A".repeat(39), "A".repeat(43) + "=", "A".repeat(43) + "/"]) {
    assert.equal(hashInvitationToken(invalid), null);
  }
});

test("workspace invitations expire seven days after creation", () => {
  const createdAt = new Date("2026-10-03T12:00:00.000Z");
  assert.equal(invitationExpiry(createdAt).toISOString(), "2026-10-10T12:00:00.000Z");
});
