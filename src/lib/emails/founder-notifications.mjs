import { renderBroadcastSummary, renderSignupMilestone } from "@/emails/render.jsx";
import { env } from "@/lib/env.mjs";
import { enqueueWebhookEvent } from "@/lib/webhooks/delivery.mjs";

import { sendPlatformEmail } from "./platform.mjs";

// Product notices from Waitlyze to the people who own a workspace. These are
// always best-effort: a failed notice must never block a signup or a send, and
// the recipient set is capped so one workspace cannot trigger a fan-out.
const MILESTONE_COUNTS = new Set([1, 10, 100, 1000]);
const MAX_NOTICE_RECIPIENTS = 5;

const clean = (value) =>
  String(value || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function workspaceOwners(db, workspaceId) {
  if (!workspaceId) return [];
  const owners = await db.workspaceMember.findMany({
    where: { workspaceId, role: "OWNER" },
    take: MAX_NOTICE_RECIPIENTS,
    select: { user: { select: { email: true } } },
  });
  return owners.map((owner) => owner.user?.email).filter(Boolean);
}

async function notifyOwners(db, workspaceId, { subject, html, idempotencyKey }) {
  const recipients = await workspaceOwners(db, workspaceId);
  if (!recipients.length) return 0;
  let sent = 0;
  for (const to of recipients) {
    try {
      await sendPlatformEmail({
        to,
        subject: clean(subject),
        html,
        idempotencyKey: `${idempotencyKey}:${to.toLowerCase()}`,
      });
      sent++;
    } catch (error) {
      console.error("Owner notification rejected", error?.message || "unknown error");
    }
  }
  return sent;
}

// Fires only on exact milestone counts. Races (two signups landing together)
// resolve to the same idempotency key, so the provider collapses duplicates.
// Also enqueues a milestone.reached customer webhook so founders can drive
// their own celebrations; webhook delivery is retried/replayable independently
// of this best-effort owner email.
export async function maybeNotifySignupMilestone(db, waitListId, { signupId } = {}) {
  try {
    const count = await db.signUp.count({ where: { waitListId } });
    if (!MILESTONE_COUNTS.has(count)) return false;
    const waitList = await db.waitList.findUnique({
      where: { id: waitListId },
      select: { name: true, status: true, workspaceId: true, showReferrals: true },
    });
    if (!waitList || waitList.status !== "PUBLISHED") return false;
    // Deterministic event id: concurrent trips of the same milestone count
    // collapse to one delivery via skipDuplicates (first writer wins on
    // triggeringSignupId), and receivers can dedupe on the event id too.
    await enqueueWebhookEvent(db, {
      waitListId,
      eventType: "milestone.reached",
      eventId: `milestone:${waitListId}:${count}`,
      signupId: undefined,
      extra: {
        count,
        ...(typeof signupId === "string" ? { triggeringSignupId: signupId } : {}),
      },
    });
    const waitlistName = waitList.name || "Your waitlist";
    const url = `${String(env.BETTER_AUTH_URL || "").replace(/\/$/, "")}/waitlists/${encodeURIComponent(waitListId)}/subscribers`;
    const html = await renderSignupMilestone({
      waitlistName,
      count,
      url,
      showReferrals: waitList.showReferrals,
    });
    const subject =
      count === 1 ? `Your first signup on ${waitlistName}` : `${count} signups on ${waitlistName}`;
    return (
      (await notifyOwners(db, waitList.workspaceId, {
        subject,
        html,
        idempotencyKey: `signup-milestone:${waitListId}:${count}`,
      })) > 0
    );
  } catch (error) {
    console.error("Signup milestone notice failed", error?.message || "unknown error");
    return false;
  }
}

export async function notifyBroadcastSummary(db, broadcastId) {
  try {
    const broadcast = await db.marketingBroadcast.findUnique({
      where: { id: broadcastId },
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        waitList: { select: { id: true, name: true, workspaceId: true } },
      },
    });
    if (!broadcast || broadcast.status === "SENDING" || broadcast.status === "DRAFT") return false;
    const counts = await db.broadcastRecipient.groupBy({
      by: ["status"],
      where: { broadcastId },
      _count: { _all: true },
    });
    const tally = Object.fromEntries(counts.map((row) => [row.status, row._count._all]));
    const waitlistName = broadcast.waitList?.name || "Your waitlist";
    const url = `${String(env.BETTER_AUTH_URL || "").replace(/\/$/, "")}/waitlists/${encodeURIComponent(broadcast.waitList?.id || "")}/emails/broadcasts`;
    const html = await renderBroadcastSummary({
      waitlistName,
      subject: broadcast.subject || broadcast.name || "Your broadcast",
      status: broadcast.status,
      delivered: tally.DELIVERED || 0,
      failed: tally.FAILED || 0,
      skipped: tally.SKIPPED || 0,
      canceled: tally.CANCELED || 0,
      url,
    });
    const subject =
      broadcast.status === "SENT"
        ? `Broadcast finished — ${waitlistName}`
        : broadcast.status === "CANCELED"
          ? `Broadcast canceled — ${waitlistName}`
          : `Broadcast needs attention — ${waitlistName}`;
    return (
      (await notifyOwners(db, broadcast.waitList?.workspaceId, {
        subject,
        html,
        idempotencyKey: `broadcast-summary:${broadcastId}`,
      })) > 0
    );
  } catch (error) {
    console.error("Broadcast summary notice failed", error?.message || "unknown error");
    return false;
  }
}
