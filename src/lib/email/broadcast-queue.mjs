// Shared broadcast audience + enqueue logic (Phase 7b).
//
// Both the manual send-now path (server action) and the scheduled-send
// sweeper (outbox dispatcher) enqueue through here so segment targeting is
// always computed server-side from live signup data, and every recipient
// gets a snapshot of their personal variables at queue time.

import { randomUUID } from "node:crypto";

import { Prisma } from "../../generated/prisma/client.ts";
import {
  getCampaignPositions,
  getEligibleReferralCounts,
} from "../campaigns/referral-position.mjs";
import { normalizeSegment, segmentExtraPredicate, segmentVerifiedPredicate } from "./segments.mjs";
import { resolveSubscriberVars } from "./variables.mjs";

// Audience FROM/WHERE over the s (sign_ups) / w (wait_lists) aliases.
// Fragments are static allow-listed SQL; only ids flow as bound params.
export function audienceScope(waitListId, segment, now = null) {
  const seg = normalizeSegment(segment);
  return Prisma.sql`FROM "sign_ups" s JOIN "wait_lists" w ON w."id" = s."waitListId"
    WHERE s."waitListId" = ${waitListId}
      AND w."status" = 'PUBLISHED'
      AND ${Prisma.raw(segmentVerifiedPredicate())}
      AND s."marketingConsentAt" IS NOT NULL
      AND s."marketingUnsubscribedAt" IS NULL
      AND COALESCE(s."emailNormalized", LOWER(TRIM(s."email"))) <> ''
      AND NOT EXISTS (
        SELECT 1 FROM "email_suppressions" suppression
        WHERE suppression."workspaceId" = w."workspaceId"
          AND suppression."emailNormalized" = COALESCE(s."emailNormalized", LOWER(TRIM(s."email")))
      )
      ${Prisma.raw(segmentExtraPredicate(seg, now))}`;
}

export async function countEligibleRecipients(db, waitListId, segment) {
  const rows = await db.$queryRaw`SELECT COUNT(*) AS count ${audienceScope(waitListId, segment)}`;
  return Number(rows[0]?.count ?? 0);
}

export async function sampleEligibleEmails(db, waitListId, segment, limit = 5) {
  return db.$queryRaw`SELECT s."email" ${audienceScope(waitListId, segment)}
    ORDER BY REPLACE(s."createdAt", ' ', 'T') ASC, s."id" ASC LIMIT ${limit}`;
}

// Enqueue a broadcast's recipients + outbox events atomically using an optimistic
// status guard on the broadcast row so concurrent sends/cancels linearize.
export async function enqueueBroadcast(
  db,
  { waitListId, broadcastId, segment, expectedRecipientCount, exact = true, now = new Date() },
) {
  const seg = normalizeSegment(segment);
  const broadcast = await db.marketingBroadcast.findFirst({
    where: { id: broadcastId, waitListId },
    select: { id: true, status: true, subject: true, body: true },
  });
  if (!broadcast || (broadcast.status !== "DRAFT" && broadcast.status !== "SCHEDULED"))
    throw new Error("This broadcast is no longer sendable.");
  if (!String(broadcast.subject || "").trim() || !String(broadcast.body || "").trim())
    throw new Error("Add a subject and message before sending.");

  const eligible = await db.$queryRaw`
    SELECT s."id", s."email", s."emailNormalized", s."points", s."referralCode"
    ${audienceScope(waitListId, seg, now)}
  `;
  if (!eligible.length)
    throw new Error("There are no eligible subscribers in this segment right now.");
  if (exact && eligible.length !== expectedRecipientCount)
    throw new Error("The recipient list changed. Refresh the preview and confirm again.");

  const claimed = await db.marketingBroadcast.updateMany({
    where: { id: broadcastId, waitListId, status: { in: ["DRAFT", "SCHEDULED"] } },
    data: {
      status: "SENDING",
      recipientCount: eligible.length,
      segment: seg,
      scheduledAt: null,
    },
  });
  if (claimed.count !== 1) throw new Error("This broadcast is no longer sendable.");

  const signUpIds = eligible.map((row) => row.id);
  const [waitlist, positions, referralCounts, totalSignups] = await Promise.all([
    db.waitList.findUnique({
      where: { id: waitListId },
      select: { name: true, publicSlug: true, showReferrals: true },
    }),
    getCampaignPositions(db, waitListId),
    getEligibleReferralCounts(db, waitListId, signUpIds),
    db.signUp.count({ where: { waitListId } }),
  ]);

  const recipientRows = eligible.map((signup) => {
    const id = randomUUID();
    const emailNormalized =
      signup.emailNormalized ||
      String(signup.email || "")
        .trim()
        .toLowerCase();
    return {
      id,
      broadcastId,
      signUpId: signup.id,
      email: signup.email,
      emailNormalized,
      status: "PENDING",
      vars: resolveSubscriberVars({
        waitlist: waitlist || {},
        signup,
        position: positions.get(signup.id),
        referralCount: referralCounts.get(signup.id) ?? 0,
        totalSignups,
      }),
      createdAt: now,
    };
  });

  const outboxRows = recipientRows.map((recipient) => ({
    id: randomUUID(),
    eventKey: `broadcast:${broadcastId}:${recipient.id}`,
    type: "BROADCAST_EMAIL_REQUESTED",
    payload: { broadcastId, recipientId: recipient.id },
    status: "PENDING",
    attempts: 0,
    availableAt: now,
    createdAt: now,
    waitListId,
  }));

  const CHUNK_SIZE = 100;
  for (let i = 0; i < recipientRows.length; i += CHUNK_SIZE) {
    await db.broadcastRecipient.createMany({ data: recipientRows.slice(i, i + CHUNK_SIZE) });
    await db.outboxEvent.createMany({ data: outboxRows.slice(i, i + CHUNK_SIZE) });
  }

  return recipientRows.length;
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
      await enqueueBroadcast(db, {
        waitListId: broadcast.waitListId,
        broadcastId: broadcast.id,
        segment: broadcast.segment,
        exact: false,
        // Stamp the dispatcher's instant so events the sweep creates are
        // claimable in the same tick - a fresh timestamp here would land
        // milliseconds after the claim snapshot and slip a full tick.
        now,
      });
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
