import {
  renderBroadcastSummary,
  renderSignupMilestone,
  renderWaitlistPublished,
} from "@/emails/render.jsx";
import {
  broadcastSummaryText,
  signupMilestoneText,
  waitlistPublishedText,
} from "@/emails/text.mjs";
import { env } from "@/lib/env.mjs";
import { notifyChatChannels } from "@/lib/integrations/chat-notifiers.mjs";
import { enqueueWebhookEvent } from "@/lib/webhooks/delivery.mjs";

// Product notices from Waitlyze to the people who own a workspace.
//
// Delivery: every notice is enqueued as a FOUNDER_NOTICE_REQUESTED outbox
// event and sent by the dispatcher through the platform sender (own verified
// From + RESEND_REPLY_TO default, HTML + plain-text fallback, idempotency
// keys, retries). Nothing here calls Resend directly, so a provider blip
// delays a notice instead of dropping it — and enqueueing never blocks a
// signup, a publish, or a broadcast.
//
// Occasion matrix (Phase 7a audit):
//   exists via outbox — account welcome, first signup, milestones
//     (10/100/1000), waitlist published, broadcast summaries,
//     workspace invitations (sent directly: the invite flow needs a
//     synchronous delivery verdict for its SEND_FAILED retry state).
//   exists elsewhere — subscriber verification (founder→list path, 7b),
//     feedback-to-inbox (internal, user-visible errors, not retried).
//   deferred — founder email verification (no password auth; social only),
//     invitation-accepted notice, billing + plan limits (no billing yet,
//     Phase 9), re-engagement + changelog digests (need product decisions).
const MILESTONE_COUNTS = new Set([1, 10, 100, 1000]);
const MAX_NOTICE_RECIPIENTS = 5;

const clean = (value) =>
  String(value || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Deterministic queue key: concurrent trips of the same occasion collapse to
// one row via upsert, and the provider collapses duplicate sends on the
// matching idempotency key.
export async function enqueueFounderNotice(
  db,
  { kind, waitListId, to, subject, html, text, idempotencyKey },
) {
  const recipient = String(to || "")
    .trim()
    .toLowerCase();
  if (!recipient || !subject || !html || !idempotencyKey) return null;
  const eventKey = `founder-notice:${idempotencyKey}:${recipient}`;
  const row = await db.outboxEvent.upsert({
    where: { eventKey },
    update: {},
    create: {
      eventKey,
      type: "FOUNDER_NOTICE_REQUESTED",
      ...(waitListId ? { waitListId } : {}),
      payload: {
        kind,
        to: recipient,
        subject: clean(subject),
        html,
        ...(text ? { text } : {}),
        idempotencyKey: `${idempotencyKey}:${recipient}`,
      },
    },
  });
  return row.eventKey;
}

async function workspaceOwners(db, workspaceId) {
  if (!workspaceId) return [];
  const owners = await db.workspaceMember.findMany({
    where: { workspaceId, role: "OWNER" },
    take: MAX_NOTICE_RECIPIENTS,
    select: { user: { select: { email: true } } },
  });
  return owners.map((owner) => owner.user?.email).filter(Boolean);
}

async function notifyOwners(
  db,
  workspaceId,
  { kind, waitListId, subject, html, text, idempotencyKey },
) {
  const recipients = await workspaceOwners(db, workspaceId);
  if (!recipients.length) return { queued: 0, eventKeys: [] };
  // workspaceOwners caps this independent, idempotent fan-out at five owners.
  const queuedKeys = await Promise.all(
    recipients.map(async (to) => {
      try {
        return await enqueueFounderNotice(db, {
          kind,
          waitListId,
          to,
          subject,
          html,
          text,
          idempotencyKey,
        });
      } catch (error) {
        console.error("Owner notice enqueue failed", error?.message || "unknown error");
        return null;
      }
    }),
  );
  const eventKeys = queuedKeys.filter(Boolean);
  return { queued: eventKeys.length, eventKeys };
}

// Fires only on exact milestone counts. Races (two signups landing together)
// resolve to the same event key, so the dispatcher sends exactly one notice.
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
    // Phase 7c: courtesy copy to connected Slack/Discord channels. Best
    // effort — chat failures never block the owner email or the webhook.
    try {
      await notifyChatChannels(
        db,
        waitListId,
        `${waitlistName} just hit ${count} signup${count === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      console.error("Chat milestone notice failed", error?.message || "unknown error");
    }
    const url = `${String(env.BETTER_AUTH_URL || "").replace(/\/$/, "")}/waitlists/${encodeURIComponent(waitListId)}/subscribers`;
    const props = { waitlistName, count, url, showReferrals: waitList.showReferrals };
    const html = await renderSignupMilestone(props);
    const subject =
      count === 1 ? `Your first signup on ${waitlistName}` : `${count} signups on ${waitlistName}`;
    const { queued } = await notifyOwners(db, waitList.workspaceId, {
      kind: "signup-milestone",
      waitListId,
      subject,
      html,
      text: signupMilestoneText(props),
      idempotencyKey: `signup-milestone:${waitListId}:${count}`,
    });
    return queued > 0;
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
    const props = {
      waitlistName,
      subject: broadcast.subject || broadcast.name || "Your broadcast",
      status: broadcast.status,
      delivered: tally.DELIVERED || 0,
      failed: tally.FAILED || 0,
      skipped: tally.SKIPPED || 0,
      canceled: tally.CANCELED || 0,
      url,
    };
    const html = await renderBroadcastSummary(props);
    const subject =
      broadcast.status === "SENT"
        ? `Broadcast finished — ${waitlistName}`
        : broadcast.status === "CANCELED"
          ? `Broadcast canceled — ${waitlistName}`
          : `Broadcast needs attention — ${waitlistName}`;
    const { queued } = await notifyOwners(db, broadcast.waitList?.workspaceId, {
      kind: "broadcast-summary",
      waitListId: broadcast.waitList?.id,
      subject,
      html,
      text: broadcastSummaryText(props),
      idempotencyKey: `broadcast-summary:${broadcastId}`,
    });
    return queued > 0;
  } catch (error) {
    console.error("Broadcast summary notice failed", error?.message || "unknown error");
    return false;
  }
}

// First-publish notice. Called once per waitlist (the publish action only
// invokes it when the list was not already PUBLISHED); re-publishes after an
// edit stay quiet on purpose.
export async function notifyWaitlistPublished(db, waitListId) {
  try {
    const waitList = await db.waitList.findUnique({
      where: { id: waitListId },
      select: { id: true, name: true, publicSlug: true, status: true, workspaceId: true },
    });
    if (!waitList || waitList.status !== "PUBLISHED" || !waitList.publicSlug) return false;
    const base = String(env.BETTER_AUTH_URL || "").replace(/\/$/, "");
    const props = {
      waitlistName: waitList.name || "Your waitlist",
      pageUrl: `${base}/w/${encodeURIComponent(waitList.publicSlug)}`,
      dashboardUrl: `${base}/waitlists/${encodeURIComponent(waitList.id)}`,
    };
    const html = await renderWaitlistPublished(props);
    const { queued } = await notifyOwners(db, waitList.workspaceId, {
      kind: "waitlist-published",
      waitListId,
      subject: `${props.waitlistName} is live — share your page`,
      html,
      text: waitlistPublishedText(props),
      idempotencyKey: `waitlist-published:${waitListId}`,
    });
    return queued > 0;
  } catch (error) {
    console.error("Published notice failed", error?.message || "unknown error");
    return false;
  }
}
