import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { workspaceTestTarget } from "../../scripts/workspace-test-target.mjs";
import { getWaitlistAnalytics } from "../../src/lib/analytics/waitlist-analytics.mjs";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: workspaceTestTarget(process.env.WORKSPACE_TEST_DATABASE_URL) }) });
const instant = (value) => new Date(value);

test("analytics deduplicates visitors, uses timezone calendar days and explicit signup denominators", async (t) => {
  const userId = `analytics-${randomUUID()}`;
  let waitlist;
  let otherWaitlist;
  t.after(async () => {
    if (waitlist || otherWaitlist) await db.waitList.deleteMany({ where: { id: { in: [waitlist?.id, otherWaitlist?.id].filter(Boolean) } } });
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });
  await db.user.create({ data: { id: userId, email: `${userId}@example.invalid` } });
  waitlist = await db.waitList.create({ data: { userId, name: "Analytics fixture", status: "PUBLISHED", showReferrals: true } });
  otherWaitlist = await db.waitList.create({ data: { userId, name: "Other analytics fixture", status: "PUBLISHED", showReferrals: true } });
  const now = instant("2026-03-10T03:00:00.000Z");

  const impression = (uniqueUserId, createdAt, list = waitlist) => db.impression.create({
    data: { uniqueUserId, waitListId: list.id, createdAt: instant(createdAt) },
  });
  const visitorA = randomUUID();
  const visitorB = randomUUID();
  const visitorC = randomUUID();
  const [visitorAFirst, visitorADuplicate] = await Promise.all([
    impression(visitorA, "2026-03-08T04:30:00.000Z"), // Mar 7 at 11:30 PM before spring DST jump
    impression(visitorA, "2026-03-08T04:31:00.000Z"),
  ]);
  await impression(visitorA, "2026-03-08T07:30:00.000Z"); // Mar 8 at 3:30 AM after the jump
  await impression(visitorB, "2026-03-08T08:00:00.000Z");
  await impression(visitorC, "2026-03-10T03:30:00.000Z"); // Mar 9 at 11:30 PM local
  await impression(randomUUID(), "2026-03-07T04:59:00.000Z"); // Before the local range boundary
  await impression(randomUUID(), "2026-03-08T04:40:00.000Z", otherWaitlist);

  const signup = (email, createdAt, options = {}) => db.signUp.create({
    data: {
      uniqueUserId: options.uniqueUserId || randomUUID(),
      email,
      emailNormalized: email.toLowerCase(),
      waitListId: options.waitListId || waitlist.id,
      ...(options.impressionId ? { impressionId: options.impressionId } : {}),
      ...(options.verifiedAt ? { verifiedAt: instant(options.verifiedAt) } : {}),
      createdAt: instant(createdAt),
    },
  });
  const converted = await signup("converted@example.invalid", "2026-03-08T07:45:00.000Z", { uniqueUserId: visitorA, impressionId: visitorAFirst.id, verifiedAt: "2026-03-10T02:00:00.000Z" });
  await signup("same-visitor@example.invalid", "2026-03-08T07:50:00.000Z", { uniqueUserId: visitorA, impressionId: visitorADuplicate.id });
  await signup("direct@example.invalid", "2026-03-09T22:00:00.000Z");
  const referrer = await signup("referrer@example.invalid", "2026-03-08T05:30:00.000Z", { verifiedAt: "2026-03-08T06:00:00.000Z" });
  const referred = await signup("approved-referral@example.invalid", "2026-03-08T09:00:00.000Z", { verifiedAt: "2026-03-08T10:00:00.000Z" });
  const heldReferred = await signup("held-referral@example.invalid", "2026-03-09T20:00:00.000Z", { verifiedAt: "2026-03-09T21:00:00.000Z" });
  await db.referral.create({ data: { signUpId: referred.id, referredById: referrer.id, reviewStatus: "APPROVED" } });
  await db.referral.create({ data: { signUpId: heldReferred.id, referredById: referrer.id, reviewStatus: "NEEDS_REVIEW", reviewReason: "same_browser" } });
  await signup("another-campaign@example.invalid", "2026-03-08T09:00:00.000Z", { waitListId: otherWaitlist.id });

  const result = await getWaitlistAnalytics(db, { waitListId: waitlist.id, days: 3, timeZone: "America/New_York", now });
  assert.deepEqual(result.range, { days: 3, timeZone: "America/New_York", startDate: "2026-03-07", endDate: "2026-03-09" });
  assert.deepEqual(result.series.map(({ date, visitors, signups, verifiedSignups, convertedVisitors, eligibleReferrals }) => ({ date, visitors, signups, verifiedSignups, convertedVisitors, eligibleReferrals })), [
    { date: "2026-03-07", visitors: 1, signups: 0, verifiedSignups: 0, convertedVisitors: 0, eligibleReferrals: 0 },
    { date: "2026-03-08", visitors: 2, signups: 4, verifiedSignups: 3, convertedVisitors: 1, eligibleReferrals: 1 },
    { date: "2026-03-09", visitors: 1, signups: 2, verifiedSignups: 1, convertedVisitors: 0, eligibleReferrals: 0 },
  ]);
  assert.deepEqual(result.summary, {
    visitors: 3,
    signups: 6,
    verifiedSignups: 4,
    pendingVerification: 2,
    convertedVisitors: 1,
    eligibleReferrals: 1,
    conversionRate: 33.33,
    verificationRate: 66.67,
  });
  assert.ok(result.definitions.convertedVisitors.includes("linked to an impression"));
  assert.ok(result.definitions.dailyVisitors.includes("daily counts do not sum"));
});

test("empty ranges return null rates and invalid ranges or time zones fail closed", async (t) => {
  const userId = `analytics-empty-${randomUUID()}`;
  let waitlist;
  t.after(async () => {
    if (waitlist) await db.waitList.delete({ where: { id: waitlist.id } });
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });
  await db.user.create({ data: { id: userId, email: `${userId}@example.invalid` } });
  waitlist = await db.waitList.create({ data: { userId, name: "Empty analytics fixture", status: "PUBLISHED" } });
  const result = await getWaitlistAnalytics(db, { waitListId: waitlist.id, days: 7, timeZone: "UTC", now: instant("2026-03-10T12:00:00.000Z") });
  assert.equal(result.summary.visitors, 0);
  assert.equal(result.summary.signups, 0);
  assert.equal(result.summary.conversionRate, null);
  assert.equal(result.summary.verificationRate, null);
  assert.equal(result.series.length, 7);
  assert.ok(result.series.every((day) => day.visitors === 0 && day.signups === 0));
  await assert.rejects(getWaitlistAnalytics(db, { waitListId: waitlist.id, days: 91, timeZone: "UTC" }), /date range/i);
  await assert.rejects(getWaitlistAnalytics(db, { waitListId: waitlist.id, days: 7, timeZone: "Mars/Olympus" }), /time zone/i);
});
