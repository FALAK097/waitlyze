import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { draftInputSchema } from "../../src/lib/campaigns/create-draft.mjs";

const valid = () => ({ name: " My launch ", publicSlug: "my-launch", templateId: "saas", creationKey: randomUUID() });
test("draft inputs normalize copy and reject injected authority or configuration", () => {
  assert.equal(draftInputSchema.parse(valid()).name, "My launch");
  assert.equal(draftInputSchema.parse(valid()).description, "");
  for (const extra of [{ userId: "owner" }, { workspaceId: "other" }, { status: "PUBLISHED" }, { templateSnapshot: {} }]) {
    assert.equal(draftInputSchema.safeParse({ ...valid(), ...extra }).success, false);
  }
});
test("draft addresses and retries require bounded valid values", () => {
  for (const publicSlug of ["ab", "-start", "end-", "two--hyphens", "CAPITAL", "a/b", "a".repeat(65)]) {
    assert.equal(draftInputSchema.safeParse({ ...valid(), publicSlug }).success, false);
  }
  assert.equal(draftInputSchema.safeParse({ ...valid(), creationKey: "not-a-uuid" }).success, false);
  assert.equal(draftInputSchema.safeParse({ ...valid(), name: " " }).success, false);
});
