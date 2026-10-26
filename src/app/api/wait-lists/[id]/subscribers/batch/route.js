import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { dispatchOffboardNow } from "@/lib/email/dispatch-now.mjs";
import { env } from "@/lib/env.mjs";
import { resolveWorkspaceEmailSender } from "@/lib/integrations/email-sender.mjs";
import prisma from "@/lib/prisma";
import { AUDIT_ACTIONS, recordWaitlistAuditEvent } from "@/lib/workspaces/audit.mjs";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";

const MAX_BATCH = 1000;
const OFFBOARD_EVENT = "OFFBOARD_EMAIL_REQUESTED";

// Bulk offboard keeps every row (position, points, and referral history are
// untouched) and only stops marketing email. Bulk delete is a hard delete:
// the rows - and, via schema cascades, their referral edges, verification
// records, broadcast recipients, and automation runs - are removed for good.
// Referrers keep points they already earned (the points ledger is append-only
// and holds no identity, so its rows are retained without PII).
async function getAccess(request, id) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id)
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { workspace, user } = await currentWorkspace();
  if (!workspace) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  // manageAudience is OWNER/ADMIN only - viewers and members cannot offboard
  // or delete, and a failed check reads as 404 so list existence never leaks.
  const waitlist = await prisma.waitList.findFirst({
    where: { id, ...campaignScope(session.user.id, "manageAudience", workspace.id) },
    select: { id: true, name: true, workspaceId: true },
  });
  if (!waitlist) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { waitlist, workspace, user: user || session.user };
}

function parseBody(body) {
  if (!body || typeof body !== "object") return { error: "Choose offboard or delete." };
  const { action, ids } = body;
  if (!["offboard", "resubscribe", "delete"].includes(action))
    return { error: "Choose offboard or delete." };
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_BATCH)
    return { error: `Select between 1 and ${MAX_BATCH.toLocaleString()} signups.` };
  if (ids.some((id) => typeof id !== "string" || !id || id.length > 64))
    return { error: "Select between 1 and 1000 signups." };
  return { action, ids: [...new Set(ids)] };
}

async function deliveryConfigured(workspaceId) {
  try {
    if (env.RESEND_API_KEY) return true;
    return Boolean(await resolveWorkspaceEmailSender(prisma, workspaceId, null));
  } catch {
    return false;
  }
}

function actorLabel(user) {
  return user?.email || user?.name || user?.id || "dashboard";
}

// Offboard payloads are plain { signUpId } objects, so pending-event matching
// filters in JS - Prisma JSON path filters only support single-value equals.
function pendingOffboardKeys(events, signUpIds) {
  const wanted = new Set(signUpIds);
  return events
    .filter((event) => wanted.has(event.payload?.signUpId))
    .map((event) => event.eventKey);
}

async function bulkOffboard({ waitlist, user, ids, resubscribe, canEmail }) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const targets = await tx.signUp.findMany({
      where: { id: { in: ids }, waitListId: waitlist.id },
      select: { id: true, marketingUnsubscribedAt: true },
    });
    const eligible = resubscribe
      ? targets.filter((row) => row.marketingUnsubscribedAt)
      : targets.filter((row) => !row.marketingUnsubscribedAt);
    const eligibleIds = eligible.map((row) => row.id);
    let eventKeys = [];
    let templateMissing = false;
    let duplicateSkipped = 0;
    let flippedIds = [];
    if (eligibleIds.length) {
      // State guard survives concurrent double-submit: racing writers
      // serialize on row locks, the loser matches nothing and flips zero rows.
      const updated = await tx.signUp.updateMany({
        where: {
          id: { in: eligibleIds },
          waitListId: waitlist.id,
          ...(resubscribe
            ? { marketingUnsubscribedAt: { not: null } }
            : { marketingUnsubscribedAt: null }),
        },
        data: { marketingUnsubscribedAt: resubscribe ? null : now },
      });
      if (updated.count) {
        // Re-read to learn exactly which rows this statement flipped - the
        // count alone doesn't say which, and consent rows must describe only
        // our own flips. Offboard matches on our write timestamp (a racing
        // offboard carries a different one); resubscribe matches cleared rows.
        const reread = await tx.signUp.findMany({
          where: { id: { in: eligibleIds }, waitListId: waitlist.id },
          select: { id: true, marketingUnsubscribedAt: true },
        });
        flippedIds = resubscribe
          ? reread.filter((row) => !row.marketingUnsubscribedAt).map((row) => row.id)
          : reread
              .filter((row) => row.marketingUnsubscribedAt?.getTime() === now.getTime())
              .map((row) => row.id);
        await tx.marketingConsentEvent.createMany({
          data: flippedIds.map((signUpId) => ({
            waitListId: waitlist.id,
            signUpId,
            action: resubscribe ? "OPTED_IN" : "OPTED_OUT",
            source: "DASHBOARD_BULK",
            consentText: resubscribe
              ? `Bulk offboard undone by ${actorLabel(user)}`
              : `Bulk offboard by ${actorLabel(user)}`,
            createdAt: now,
          })),
        });
      }
      // resubscribe is the dashboard undo path: callers must pass only ids
      // flipped by the matching offboard (the UI reuses offboardedIds).
      // Arbitrary ids would override explicit user opt-outs - someone who
      // unsubscribed via their own link - so never expose this as a general
      // "subscribe" action.
      if (resubscribe) {
        if (!flippedIds.length) {
          return {
            matched: targets.length,
            processedIds: flippedIds,
            eventKeys,
            templateMissing,
            duplicateSkipped,
          };
        }
        // Undo cancels goodbye emails that never left the outbox. Rows the
        // dispatcher already claimed keep their terminal state.
        await tx.$executeRaw`
          UPDATE "outbox_events" SET "status" = 'FAILED', "processedAt" = ${now},
            "lockedAt" = NULL, "lastErrorCode" = 'OFFBOARD_UNDONE'
          WHERE "waitListId" = ${waitlist.id} AND "type" = ${OFFBOARD_EVENT}
            AND "status" = 'PENDING' AND "payload"->>'signUpId' = ANY(${flippedIds}::text[])`;
      } else if (canEmail) {
        const template = await tx.emailTemplate.findUnique({
          where: { waitListId_type: { waitListId: waitlist.id, type: "OFFBOARDING" } },
          select: { id: true },
        });
        if (!template) {
          templateMissing = true;
        } else {
          // Deterministic keys make a retried request idempotent: an already
          // queued (or sending) goodbye is reused, never duplicated. After an
          // undo the old event is terminally FAILED, so a later re-offboard
          // skips the email rather than sending a second goodbye.
          const pending = await tx.outboxEvent.findMany({
            where: {
              waitListId: waitlist.id,
              type: OFFBOARD_EVENT,
              status: { in: ["PENDING", "PROCESSING"] },
            },
            select: { payload: true, eventKey: true },
          });
          const alreadyQueued = new Set(
            pending.map((event) => event.payload?.signUpId).filter(Boolean),
          );
          const freshIds = flippedIds.filter((id) => !alreadyQueued.has(id));
          if (freshIds.length) {
            // skipDuplicates also swallows terminal rows (a goodbye already
            // sent or cancelled under this key, e.g. undo → re-offboard): the
            // count below tells those apart from real inserts.
            const created = await tx.outboxEvent.createMany({
              data: freshIds.map((signUpId) => ({
                eventKey: `offboard:${waitlist.id}:${signUpId}`,
                type: OFFBOARD_EVENT,
                waitListId: waitlist.id,
                payload: { signUpId, waitListId: waitlist.id },
              })),
              skipDuplicates: true,
            });
            duplicateSkipped = freshIds.length - created.count;
          }
          const queued = await tx.outboxEvent.findMany({
            where: {
              waitListId: waitlist.id,
              type: OFFBOARD_EVENT,
              status: { in: ["PENDING", "PROCESSING"] },
            },
            select: { payload: true, eventKey: true },
          });
          eventKeys = pendingOffboardKeys(queued, flippedIds);
        }
      }
    }
    return {
      matched: targets.length,
      processedIds: flippedIds,
      eventKeys,
      templateMissing,
      duplicateSkipped,
    };
  });
}

async function bulkDelete({ waitlist, ids }) {
  return prisma.$transaction(async (tx) => {
    const targets = await tx.signUp.findMany({
      where: { id: { in: ids }, waitListId: waitlist.id },
      select: { id: true, email: true },
    });
    if (!targets.length) return { deleted: 0, referralsSevered: 0, sample: [] };
    const targetIds = targets.map((row) => row.id);
    // Referral edges vanish with the rows (both sides cascade), so count them
    // up front - the response and audit log must say exactly what was severed.
    const referralsSevered = await tx.referral.count({
      where: {
        OR: [{ signUpId: { in: targetIds } }, { referredById: { in: targetIds } }],
        signUp: { waitListId: waitlist.id },
      },
    });
    const deleted = await tx.signUp.deleteMany({
      where: { id: { in: targetIds }, waitListId: waitlist.id },
    });
    return {
      deleted: deleted.count,
      referralsSevered,
      sample: targets.slice(0, 3).map((row) => row.email),
    };
  });
}

export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const access = await getAccess(request, id);
    if (access.response) return access.response;
    const { waitlist, workspace, user } = access;
    let body = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }
    const parsed = parseBody(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { action, ids } = parsed;

    if (action === "delete") {
      const { deleted, referralsSevered, sample } = await bulkDelete({ waitlist, ids });
      await recordWaitlistAuditEvent(prisma, {
        userId: user.id,
        waitListId: waitlist.id,
        action: AUDIT_ACTIONS.AUDIENCE_BULK_DELETED,
        resourceType: "audience",
        detail:
          `${actorLabel(user)} deleted ${deleted} signup${deleted === 1 ? "" : "s"}` +
          ` (${referralsSevered} referral edge${referralsSevered === 1 ? "" : "s"} severed)` +
          (sample.length ? `, e.g. ${sample.join(", ")}` : ""),
      });
      return NextResponse.json({ ok: true, action, deleted, referralsSevered });
    }

    const resubscribe = action === "resubscribe";
    const canEmail = resubscribe
      ? false
      : await deliveryConfigured(workspace.id ?? waitlist.workspaceId);
    const outcome = await bulkOffboard({ waitlist, user, ids, resubscribe, canEmail });
    if (outcome.eventKeys.length) {
      // Best-effort: the scheduler delivers whatever is still pending.
      await dispatchOffboardNow(outcome.eventKeys);
    }
    const offboardCount = outcome.processedIds.length;
    const queuedCount = outcome.eventKeys.length;
    const dupCount = outcome.duplicateSkipped;
    let emailNote;
    if (outcome.templateMissing || !canEmail) {
      emailNote = " (no goodbye email: template or delivery missing)";
    } else if (queuedCount) {
      emailNote =
        ` (${queuedCount} goodbye email${queuedCount === 1 ? "" : "s"} queued` +
        (dupCount ? `, ${dupCount} skipped as duplicate${dupCount === 1 ? "" : "s"}` : "") +
        ")";
    } else if (dupCount) {
      emailNote = ` (no new goodbye emails: ${dupCount} already sent or cancelled for this selection)`;
    } else {
      emailNote = " (no goodbye emails queued)";
    }
    await recordWaitlistAuditEvent(prisma, {
      userId: user.id,
      waitListId: waitlist.id,
      action: resubscribe
        ? AUDIT_ACTIONS.AUDIENCE_BULK_RESUBSCRIBED
        : AUDIT_ACTIONS.AUDIENCE_BULK_OFFBOARDED,
      resourceType: "audience",
      detail: resubscribe
        ? `${actorLabel(user)} undid a bulk offboard for ${offboardCount} signup${offboardCount === 1 ? "" : "s"}`
        : `${actorLabel(user)} offboarded ${offboardCount} signup${offboardCount === 1 ? "" : "s"}` +
          emailNote,
    });
    return NextResponse.json({
      ok: true,
      action,
      matched: outcome.matched,
      processed: offboardCount,
      alreadyInState: outcome.matched - offboardCount,
      offboardedIds: resubscribe ? [] : outcome.processedIds,
      emailsQueued: queuedCount,
      duplicateSkipped: resubscribe ? 0 : dupCount,
      emailTemplateMissing: resubscribe ? false : outcome.templateMissing,
      deliveryConfigured: resubscribe ? undefined : canEmail,
    });
  } catch (error) {
    console.error("Error in bulk audience update:", error);
    return NextResponse.json({ error: "Unable to update signups." }, { status: 500 });
  }
}
