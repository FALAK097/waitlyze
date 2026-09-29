import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { getCampaignPosition, getEligibleReferralCounts } from "../../src/lib/campaigns/referral-position.mjs";
import { createCampaignSignup, verifyCampaignSignup } from "../../src/lib/campaigns/signups.mjs";

const target = workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target }) });

async function createSignupWithVerification(waitListId, email, uniqueUserId = randomUUID(), referralId) {
  const signUp = await createCampaignSignup(db, { waitListId, email, uniqueUserId }, referralId);
  const event = await db.outboxEvent.findFirst({
    where: { type: "SIGNUP_VERIFICATION_REQUESTED", payload: { path: ["signUpId"], equals: signUp.id } },
  });
  return { signUp, token: event.payload.token };
}

async function createFixture(t, showReferrals = true) {
  const ownerId = `fixture-${randomUUID()}`;
  await db.user.create({ data: { id: ownerId, email: `${ownerId}@example.invalid` } });
  const waitList = await db.waitList.create({
    data: { userId: ownerId, name: "Referral position fixture", status: "PUBLISHED", showReferrals },
  });
  t.after(async () => {
    await db.waitList.deleteMany({ where: { userId: ownerId } });
    await db.user.deleteMany({ where: { id: ownerId } });
    await db.$disconnect();
  });
  return waitList;
}

test("only verified referrals affect position, with no stored-rank fanout", async (t) => {
  const waitList = await createFixture(t);
  const { signUp: earlier, token: earlierToken } = await createSignupWithVerification(waitList.id, "earlier@example.invalid");
  const { signUp: later, token: laterToken } = await createSignupWithVerification(waitList.id, "later@example.invalid");
  assert.equal(await verifyCampaignSignup(db, earlierToken), true);
  assert.equal(await verifyCampaignSignup(db, laterToken), true);

  const { signUp: referred, token: referredToken } = await createSignupWithVerification(
    waitList.id,
    "referred@example.invalid",
    randomUUID(),
    later.uniqueUserId,
  );
  assert.ok(await db.referral.findUnique({ where: { signUpId: referred.id } }));
  assert.equal((await getEligibleReferralCounts(db, waitList.id, [later.id])).get(later.id) ?? 0, 0);
  assert.equal(await getCampaignPosition(db, waitList.id, later.id), 2);
  assert.equal(await getCampaignPosition(db, waitList.id, earlier.id), 1);

  assert.equal(await verifyCampaignSignup(db, referredToken), true);
  assert.equal((await getEligibleReferralCounts(db, waitList.id, [later.id])).get(later.id), 1);
  assert.equal(await getCampaignPosition(db, waitList.id, later.id), 1);
  assert.equal(await getCampaignPosition(db, waitList.id, earlier.id), 2);
  assert.equal(await getCampaignPosition(db, waitList.id, referred.id), 3);
  assert.equal(await getCampaignPosition(db, waitList.id, "missing-signup"), null);
  assert.deepEqual(
    await db.signUp.findMany({ where: { waitListId: waitList.id }, select: { rank: true } }),
    [{ rank: null }, { rank: null }, { rank: null }],
  );
});

test("referrals are ignored when disabled or when the referrer belongs to another waitlist", async (t) => {
  const waitList = await createFixture(t, false);
  const { signUp: referrer } = await createSignupWithVerification(waitList.id, "hidden-referrer@example.invalid");
  const { signUp: disabledSignup } = await createSignupWithVerification(
    waitList.id,
    "disabled-referral@example.invalid",
    randomUUID(),
    referrer.uniqueUserId,
  );
  assert.equal(await db.referral.findUnique({ where: { signUpId: disabledSignup.id } }), null);

  const otherWaitList = await db.waitList.create({
    data: { userId: waitList.userId, name: "Other referral fixture", status: "PUBLISHED", showReferrals: true },
  });
  try {
    const { signUp: crossCampaignSignup } = await createSignupWithVerification(
      otherWaitList.id,
      "cross-campaign@example.invalid",
      randomUUID(),
      referrer.uniqueUserId,
    );
    assert.equal(await db.referral.findUnique({ where: { signUpId: crossCampaignSignup.id } }), null);
  } finally {
    await db.waitList.delete({ where: { id: otherWaitList.id } });
  }
});

test("equal-score signups use created time and stable ID tie-breakers", async (t) => {
  const waitList = await createFixture(t);
  const { signUp: first } = await createSignupWithVerification(waitList.id, "tie-first@example.invalid");
  const { signUp: second } = await createSignupWithVerification(waitList.id, "tie-second@example.invalid");
  await db.signUp.update({ where: { id: first.id }, data: { createdAt: new Date("2026-01-02T00:00:00.000Z") } });
  await db.signUp.update({ where: { id: second.id }, data: { createdAt: new Date("2026-01-01T00:00:00.000Z") } });
  assert.equal(await getCampaignPosition(db, waitList.id, second.id), 1);
  assert.equal(await getCampaignPosition(db, waitList.id, first.id), 2);

  const sameJoinTime = new Date("2026-01-01T00:00:00.000Z");
  await db.signUp.updateMany({
    where: { id: { in: [first.id, second.id] } },
    data: { createdAt: sameJoinTime },
  });

  const [expectedFirst, expectedSecond] = [first.id, second.id].sort();
  assert.equal(await getCampaignPosition(db, waitList.id, expectedFirst), 1);
  assert.equal(await getCampaignPosition(db, waitList.id, expectedSecond), 2);
});
