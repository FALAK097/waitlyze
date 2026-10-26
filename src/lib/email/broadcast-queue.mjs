// Shared broadcast audience + enqueue logic (Phase 7b).
//
// Both the manual send-now path (server action) and the scheduled-send
// sweeper (outbox dispatcher) enqueue through here so segment targeting is
// always computed server-side from live signup data, and every recipient
// gets a snapshot of their personal variables at queue time.

import { Prisma } from "../../generated/prisma/client.ts";
import {
  getCampaignPositions,
  getEligibleReferralCounts,
} from "../campaigns/referral-position.mjs";
import { normalizeSegment, segmentExtraPredicate, segmentVerifiedPredicate } from "./segments.mjs";
import { resolveSubscriberVars } from "./variables.mjs";

// Audience FROM/WHERE over the s (sign_ups) / w (wait_lists) aliases.
// Fragments are static allow-listed SQL; only ids flow as bound params.
export function audienceScope(waitListId, segment) {
  const seg = normalizeSegment(segment);
  return Prisma.sql`FROM "sign_ups" s JOIN "wait_lists" w ON w."id" = s."waitListId"
    WHERE s."waitListId" = ${waitListId}
      AND w."status"::text = 'PUBLISHED'
      AND ${Prisma.raw(segmentVerifiedPredicate())}
      AND s."marketingConsentAt" IS NOT NULL
      AND s."marketingUnsubscribedAt" IS NULL
      AND COALESCE(s."emailNormalized", lower(btrim(s."email"))) <> ''
      AND NOT EXISTS (
        SELECT 1 FROM "email_suppressions" suppression
        WHERE suppression."workspaceId" = w."workspaceId"
          AND suppression."emailNormalized" = COALESCE(s."emailNormalized", lower(btrim(s."email")))
      )
      ${Prisma.raw(segmentExtraPredicate(seg))}`;
}

export async function countEligibleRecipients(db, waitListId, segment) {
  const rows =
    await db.$queryRaw`SELECT COUNT(*)::int AS count ${audienceScope(waitListId, segment)}`;
  return rows[0]?.count ?? 0;
}

export async function sampleEligibleEmails(db, waitListId, segment, limit = 5) {
  return db.$queryRaw`SELECT s."email" ${audienceScope(waitListId, segment)}
    ORDER BY s."createdAt" ASC, s."id" ASC LIMIT ${limit}`;
}

// Enqueue a broadcast's recipients + outbox events inside the caller's
// transaction. Locks the broadcast, so a concurrent send, schedule, or
// cancel linearizes here. Throws with a user-facing message on mismatch.
export async function enqueueBroadcast(
  tx,
  { waitListId, broadcastId, segment, expectedRecipientCount, exact = true, now = new Date() },
) {
  const seg = normalizeSegment(segment);
  const [broadcast] = await tx.$queryRaw`
    SELECT "id", "status"::text AS status, "subject", "body"
    FROM "marketing_broadcasts"
    WHERE "id" = ${broadcastId} AND "waitListId" = ${waitListId}
    FOR UPDATE`;
  if (!broadcast || (broadcast.status !== "DRAFT" && broadcast.status !== "SCHEDULED"))
    throw new Error("This broadcast is no longer sendable.");
  if (!String(broadcast.subject || "").trim() || !String(broadcast.body || "").trim())
    throw new Error("Add a subject and message before sending.");

  const [preview] =
    await tx.$queryRaw`SELECT COUNT(*)::int AS count ${audienceScope(waitListId, seg)}`;
  if (!preview.count)
    throw new Error("There are no eligible subscribers in this segment right now.");
  if (exact && preview.count !== expectedRecipientCount)
    throw new Error("The recipient list changed. Refresh the preview and confirm again.");

  const [queued] = await tx.$queryRaw`
    WITH recipients AS (
      INSERT INTO "broadcast_recipients" ("id", "broadcastId", "signUpId", "email", "emailNormalized", "status", "createdAt")
      SELECT gen_random_uuid()::text, ${broadcastId}, s."id", s."email",
        COALESCE(s."emailNormalized", lower(btrim(s."email"))), 'PENDING', ${now}
      ${audienceScope(waitListId, seg)}
      RETURNING "id", "broadcastId", "signUpId"
    ), events AS (
      INSERT INTO "outbox_events" ("id", "eventKey", "type", "payload", "status", "attempts", "availableAt", "createdAt", "waitListId")
      SELECT gen_random_uuid()::text, 'broadcast:' || recipients."broadcastId" || ':' || recipients."id",
        'BROADCAST_EMAIL_REQUESTED', jsonb_build_object('broadcastId', recipients."broadcastId", 'recipientId', recipients."id"),
        'PENDING', 0, ${now}, ${now}, ${waitListId}
      FROM recipients
      RETURNING "id"
    ) SELECT COUNT(*)::int AS count FROM recipients`;
  if (exact && queued.count !== expectedRecipientCount)
    throw new Error(
      "The recipient list changed while queueing. Nothing was sent; refresh the preview.",
    );
  if (!queued.count) throw new Error("Nothing was queued — the audience changed. Try again.");

  // Snapshot personal variables once, server-side, so every recipient's
  // {{name}} {{position}} {{referral_link}} {{points}} resolve at send time
  // without per-send rank scans.
  // These reads share the interactive transaction's single connection, so
  // Promise.all would still serialize the queries without reducing latency.
  const waitlist = await tx.waitList.findUnique({
    where: { id: waitListId },
    select: { name: true, publicSlug: true, showReferrals: true },
  });
  const rows = await tx.broadcastRecipient.findMany({
    where: { broadcastId },
    select: {
      id: true,
      signUp: {
        select: { id: true, email: true, points: true, referralCode: true },
      },
    },
  });
  const signUpIds = rows.map((row) => row.signUp.id);
  const [positions, referralCounts] = await Promise.all([
    getCampaignPositions(tx, waitListId),
    getEligibleReferralCounts(tx, waitListId, signUpIds),
  ]);
  await Promise.all(
    rows.map((row) =>
      tx.broadcastRecipient.update({
        where: { id: row.id },
        data: {
          vars: resolveSubscriberVars({
            waitlist: waitlist || {},
            signup: row.signUp,
            position: positions.get(row.signUp.id),
            referralCount: referralCounts.get(row.signUp.id) ?? 0,
          }),
        },
      }),
    ),
  );

  await tx.marketingBroadcast.update({
    where: { id: broadcastId },
    data: { status: "SENDING", recipientCount: queued.count, segment: seg, scheduledAt: null },
  });
  return queued.count;
}

// Sweep due scheduled broadcasts. Runs at the head of the outbox dispatcher
// so a scheduled send fans out without any founder action.
export async function queueDueBroadcasts(db, now = new Date()) {
  const due = await db.marketingBroadcast.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: now } },
    select: { id: true, waitListId: true, segment: true },
    take: 10,
  });
  let queued = 0;
  for (const broadcast of due) {
    try {
      // Same reason as the manual send path: the fan-out runs on one
      // transaction connection and can exceed the 5 s default for large
      // segments; allow 60 s so the scheduled send does not pathologically
      // re-scan every tick.
      await db.$transaction(
        async (tx) => {
          await enqueueBroadcast(tx, {
            waitListId: broadcast.waitListId,
            broadcastId: broadcast.id,
            segment: broadcast.segment,
            exact: false,
            // Stamp the dispatcher's instant so events the sweep creates are
            // claimable in the same tick — a fresh timestamp here would land
            // milliseconds after the claim snapshot and slip a full tick.
            now,
          });
        },
        { timeout: 60_000, maxWait: 10_000 },
      );
      queued++;
    } catch (error) {
      // Audience drift retries on the next tick; an empty segment fails the
      // broadcast so it doesn't sit scheduled forever.
      if (String(error?.message || "").includes("no eligible subscribers")) {
        await db.marketingBroadcast.updateMany({
          where: { id: broadcast.id, status: "SCHEDULED" },
          data: { status: "FAILED", sentAt: now },
        });
      }
    }
  }
  return { queued, checked: due.length };
}
