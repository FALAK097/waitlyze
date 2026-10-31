import { createHash } from "node:crypto";

import { renderSubscriberVerification } from "../../emails/render.jsx";
import { notifyBroadcastSummary } from "../emails/founder-notifications.mjs";
import { dispatchAutomationStep, processAutomationTrigger } from "./automations.mjs";
import { emailBrandFromSnapshot } from "./brand.mjs";
import { queueDueBroadcasts } from "./broadcast-queue.mjs";
import { interpolateEmail, legacyEmailContent, subscriberEmailHtml } from "./composer.mjs";
import { applyKnownProviderEvents } from "./suppression.mjs";
import { createUnsubscribeToken } from "./unsubscribe.mjs";
import { interpolateVars, interpolateVarsHtml, resolveSubscriberVars } from "./variables.mjs";

const MAX_ATTEMPTS = 6;
const STALE_LOCK_MS = 5 * 60 * 1000;
const RETRY_BASE_MS = 30 * 1000;
// Signup verification: one inline send, then three retries spaced out. The
// scheduler calls the dispatcher every 5 minutes, so the delays are multiples of that.
const VERIFICATION_MAX_ATTEMPTS = 4;
const VERIFICATION_RETRY_DELAYS_MS = [5, 15, 30].map((minutes) => minutes * 60 * 1000);
const transient = (error) =>
  error?.statusCode === 429 ||
  error?.statusCode >= 500 ||
  (error?.statusCode === 409 && error?.code === "concurrent_idempotent_requests") ||
  (error?.name === "application_error" && error?.statusCode === null) ||
  error?.name === "TypeError";
const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
}

function broadcastHtml({ campaignName, previewText, body, unsubscribeUrl }) {
  const paragraphs = escapeHtml(body)
    .split(/\n{2,}/)
    .map((text) => `<p>${text.replaceAll("\n", "<br>")}</p>`)
    .join("");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(campaignName)}</title><body style="margin:0;background:#f5f5f1;color:#191919;font:16px/1.6 Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(previewText)}</div><main style="max-width:600px;margin:32px auto;padding:32px;background:#fff;border:1px solid #e8e8e2;border-radius:16px"><p style="margin:0 0 24px;color:#70706a;font-size:13px">${escapeHtml(campaignName)}</p>${paragraphs}<hr style="border:0;border-top:1px solid #e8e8e2;margin:32px 0"><p style="color:#70706a;font-size:13px">You’re receiving this because you opted in to updates about this waitlist.</p><p style="font-size:13px"><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe from updates</a></p></main></body></html>`;
}

async function finishBroadcastIfReady(db, broadcastId, now) {
  const active = await db.broadcastRecipient.count({
    where: { broadcastId, status: { in: ["PENDING", "PROCESSING"] } },
  });
  if (active) return;
  const [delivered, failed, skipped, canceled] = await Promise.all([
    db.broadcastRecipient.count({ where: { broadcastId, status: "DELIVERED" } }),
    db.broadcastRecipient.count({ where: { broadcastId, status: "FAILED" } }),
    db.broadcastRecipient.count({ where: { broadcastId, status: "SKIPPED" } }),
    db.broadcastRecipient.count({ where: { broadcastId, status: "CANCELED" } }),
  ]);
  const status =
    canceled && !delivered && !failed && !skipped
      ? "CANCELED"
      : delivered
        ? "SENT"
        : canceled
          ? "CANCELED"
          : "FAILED";
  const transitioned = await db.marketingBroadcast.updateMany({
    where: { id: broadcastId, status: "SENDING" },
    data: { status, sentAt: now },
  });
  // Only the caller that flips the broadcast out of SENDING reports the result,
  // so one send produces exactly one delivery summary to the workspace owners.
  if (transitioned.count === 1) {
    try {
      await notifyBroadcastSummary(db, broadcastId);
    } catch (error) {
      console.error("Broadcast summary notice failed", error?.message || "unknown error");
    }
  }
}

async function dispatchBroadcast(db, event, payload, send, now, attempt, result) {
  if (typeof payload?.broadcastId !== "string" || typeof payload?.recipientId !== "string") {
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: "FAILED",
        processedAt: now,
        lockedAt: null,
        payload: {},
        lastErrorCode: "INVALID_BROADCAST_EVENT",
      },
    });
    result.failed++;
    return;
  }

  const recipient = await db.$transaction(async (tx) => {
    const claimed = await tx.broadcastRecipient.updateMany({
      where: {
        id: payload.recipientId,
        broadcastId: payload.broadcastId,
        status: { in: ["PENDING", "PROCESSING"] },
        broadcast: { status: "SENDING" },
      },
      data: { status: "PROCESSING", lastErrorCode: null },
    });
    if (claimed.count !== 1) return null;
    return tx.broadcastRecipient.findUnique({
      where: { id: payload.recipientId },
      include: {
        signUp: true,
        broadcast: {
          include: {
            waitList: {
              select: {
                id: true,
                name: true,
                status: true,
                workspaceId: true,
                templateSnapshot: true,
              },
            },
          },
        },
      },
    });
  });
  if (!recipient) {
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: "FAILED",
        processedAt: now,
        lockedAt: null,
        payload: { broadcastId: payload.broadcastId, recipientId: payload.recipientId },
        lastErrorCode: "BROADCAST_CANCELED",
      },
    });
    result.skipped++;
    return;
  }

  const { broadcast, signUp } = recipient;
  const waitList = broadcast.waitList;
  const emailNormalized = normalizeEmail(signUp.emailNormalized || signUp.email);
  const suppressed =
    waitList.workspaceId &&
    (await db.emailSuppression.findUnique({
      where: {
        workspaceId_emailNormalized: { workspaceId: waitList.workspaceId, emailNormalized },
      },
    }));
  if (
    waitList.status !== "PUBLISHED" ||
    !signUp.verifiedAt ||
    !signUp.marketingConsentAt ||
    signUp.marketingUnsubscribedAt ||
    suppressed ||
    emailNormalized !== recipient.emailNormalized
  ) {
    const errorCode = suppressed
      ? "RECIPIENT_SUPPRESSED"
      : signUp.marketingUnsubscribedAt
        ? "RECIPIENT_UNSUBSCRIBED"
        : "RECIPIENT_NOT_ELIGIBLE";
    await db.$transaction([
      db.broadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: "SKIPPED", lastErrorCode: errorCode },
      }),
      db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          processedAt: now,
          lockedAt: null,
          payload: { broadcastId: broadcast.id, recipientId: recipient.id },
          lastErrorCode: errorCode,
        },
      }),
    ]);
    result.skipped++;
    await finishBroadcastIfReady(db, broadcast.id, now);
    return;
  }

  const token = createUnsubscribeToken(signUp.id, waitList.id);
  const unsubscribeUrl = `${String(process.env.BETTER_AUTH_URL || "").replace(/\/$/, "")}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
  // Per-recipient variables were snapshotted server-side at queue time
  // (position, referral link, points). Older rows without a snapshot fall
  // back to name + waitlist derived live from the signup.
  const snapshot = recipient.vars && typeof recipient.vars === "object" ? recipient.vars : null;
  const vars = snapshot
    ? { ...snapshot, waitlist: waitList.name || snapshot.waitlist || "the waitlist" }
    : resolveSubscriberVars({ waitlist: waitList, signup: signUp });
  const subject = interpolateVars(broadcast.subject, vars);
  const previewText = interpolateVars(broadcast.previewText, vars);
  try {
    const response = await send({
      to: recipient.email,
      subject,
      html: broadcast.renderedHtml
        ? subscriberEmailHtml({
            name: waitList.name || "Waitlist",
            content: interpolateVarsHtml(broadcast.renderedHtml, vars),
            previewText,
            unsubscribeUrl,
            brand: emailBrandFromSnapshot(waitList.templateSnapshot),
          })
        : broadcastHtml({
            campaignName: waitList.name || "Waitlist",
            previewText,
            body: interpolateVars(broadcast.body, vars),
            unsubscribeUrl,
          }),
      text: broadcast.renderedText
        ? `${interpolateVars(broadcast.renderedText, vars).trim()}\n\nUnsubscribe: ${unsubscribeUrl}`
        : undefined,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      idempotencyKey: event.eventKey,
      workspaceId: waitList.workspaceId,
    });
    if (response?.error) throw response.error;
    const providerMessageId = response?.data?.id || response?.id;
    if (!providerMessageId)
      throw Object.assign(new Error("Provider accepted no message id"), {
        code: "MISSING_PROVIDER_ID",
      });
    await db.$transaction([
      db.broadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: "DELIVERED", providerMessageId, deliveredAt: now, lastErrorCode: null },
      }),
      db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "DELIVERED",
          providerMessageId,
          processedAt: now,
          lockedAt: null,
          payload: { broadcastId: broadcast.id, recipientId: recipient.id },
          lastErrorCode: null,
        },
      }),
    ]);
    result.accepted++;
    try {
      await applyKnownProviderEvents(db, providerMessageId, waitList.workspaceId, recipient.email);
    } catch (error) {
      console.error(
        "Could not apply provider suppression event:",
        error?.message || "unknown error",
      );
    }
  } catch (error) {
    const code =
      String(error?.code || error?.name || "PROVIDER_ERROR")
        .replace(/[^A-Za-z0-9_.-]/g, "")
        .slice(0, 80) || "PROVIDER_ERROR";
    const currentBroadcast = await db.marketingBroadcast.findUnique({
      where: { id: broadcast.id },
      select: { status: true },
    });
    const canRetry =
      currentBroadcast?.status === "SENDING" && transient(error) && attempt < MAX_ATTEMPTS;
    const delay = Math.min(RETRY_BASE_MS * 2 ** Math.min(attempt - 1, 6), 60 * 60 * 1000);
    await db.$transaction([
      db.broadcastRecipient.update({
        where: { id: recipient.id },
        data: {
          status: canRetry
            ? "PENDING"
            : currentBroadcast?.status === "CANCELED"
              ? "CANCELED"
              : "FAILED",
          lastErrorCode: code,
        },
      }),
      db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: canRetry ? "PENDING" : "FAILED",
          availableAt: canRetry ? new Date(now.getTime() + delay) : now,
          processedAt: canRetry ? null : now,
          lockedAt: null,
          payload: { broadcastId: broadcast.id, recipientId: recipient.id },
          lastErrorCode: code,
        },
      }),
    ]);
    if (canRetry) result.retried++;
    else result.failed++;
  }
  await finishBroadcastIfReady(db, broadcast.id, now);
}

function offboardVars({ waitList, signup }) {
  const base = String(process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");
  const pageUrl = waitList.publicSlug ? `${base}/w/${waitList.publicSlug}` : "";
  return {
    waitlist: waitList.name || "Your Project",
    waitlist_url: pageUrl,
    email: signup.email,
    reason: "You were removed from marketing updates for this waitlist.",
    // Position is deliberately blank: per-recipient rank lookups each scan the
    // whole list and do not scale inside bulk sends. The row (and its real
    // position) is untouched by the offboard itself.
    position: "",
    referral_link:
      pageUrl && waitList.showReferrals && signup.referralCode
        ? `${pageUrl}?r=${signup.referralCode}`
        : "",
    referral_count: "",
    rewards: "",
    expiry_time: "",
    feedback_link: "",
    total_signups: "",
  };
}

function replaceOffboardVars(text, vars) {
  return String(text || "").replace(
    /\{\{([^}]+)\}\}/g,
    (_, key) => vars[String(key).trim().toLowerCase()] ?? "",
  );
}

// Goodbye email for bulk offboard. Unlike broadcasts this send must go through
// even though the recipient just unsubscribed — the unsubscribe is the reason
// for the email. Suppression-list hits and missing rows/templates still skip.
async function dispatchOffboard(db, event, send, now, attempt, result) {
  const raw = event.payload && typeof event.payload === "object" ? event.payload : null;
  const signUpId = raw?.signUpId;
  const waitListId = event.waitListId || raw?.waitListId;
  async function fail(code, counted) {
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: "FAILED",
        processedAt: now,
        lockedAt: null,
        payload: { signUpId, waitListId },
        lastErrorCode: code,
      },
    });
    result[counted]++;
  }
  if (typeof signUpId !== "string" || !signUpId) {
    await fail("INVALID_OFFBOARD_EVENT", "failed");
    return;
  }
  const [signup, waitList] = await Promise.all([
    db.signUp.findUnique({
      where: { id: signUpId },
      select: { id: true, email: true, emailNormalized: true, referralCode: true },
    }),
    typeof waitListId === "string" && waitListId
      ? db.waitList.findUnique({
          where: { id: waitListId },
          select: {
            id: true,
            name: true,
            publicSlug: true,
            showReferrals: true,
            workspaceId: true,
          },
        })
      : null,
  ]);
  if (!signup || !waitList) {
    await fail("SIGNUP_NOT_SENDABLE", "skipped");
    return;
  }
  const template = await db.emailTemplate.findUnique({
    where: { waitListId_type: { waitListId: waitList.id, type: "OFFBOARDING" } },
  });
  if (!template) {
    await fail("OFFBOARD_TEMPLATE_MISSING", "skipped");
    return;
  }
  const suppressed =
    waitList.workspaceId &&
    (await db.emailSuppression.findUnique({
      where: {
        workspaceId_emailNormalized: {
          workspaceId: waitList.workspaceId,
          emailNormalized: normalizeEmail(signup.emailNormalized || signup.email),
        },
      },
    }));
  if (suppressed) {
    await fail("RECIPIENT_SUPPRESSED", "skipped");
    return;
  }
  const vars = offboardVars({ waitList, signup });
  const subject = replaceOffboardVars(template.subject, vars);
  const previewText = replaceOffboardVars(template.previewText, vars);
  const html = template.renderedHtml
    ? subscriberEmailHtml({
        name: waitList.name || "Waitlist",
        content: interpolateEmail(template.renderedHtml, vars),
        previewText,
      })
    : subscriberEmailHtml({
        name: waitList.name || "Waitlist",
        content: legacyEmailContent({
          header: replaceOffboardVars(template.header, vars),
          subHeader: replaceOffboardVars(template.subHeader, vars),
          mainBody: replaceOffboardVars(template.mainBody, vars),
          subBody: replaceOffboardVars(template.subBody, vars),
        }),
        previewText,
      });
  const text = template.renderedText
    ? replaceOffboardVars(template.renderedText, vars)
    : replaceOffboardVars(template.mainBody, vars) || undefined;
  try {
    const response = await send({
      to: signup.email,
      subject,
      html,
      text,
      idempotencyKey: event.eventKey,
      workspaceId: waitList.workspaceId,
    });
    if (response?.error) throw response.error;
    const providerMessageId = response?.data?.id || response?.id;
    if (!providerMessageId)
      throw Object.assign(new Error("Provider accepted no message id"), {
        code: "MISSING_PROVIDER_ID",
      });
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: "DELIVERED",
        providerMessageId,
        processedAt: now,
        lockedAt: null,
        payload: { signUpId, waitListId: waitList.id },
        lastErrorCode: null,
      },
    });
    result.accepted++;
    try {
      await applyKnownProviderEvents(
        db,
        providerMessageId,
        waitList.workspaceId,
        signup.emailNormalized || signup.email,
      );
    } catch (error) {
      console.error(
        "Could not apply provider suppression event:",
        error?.message || "unknown error",
      );
    }
  } catch (error) {
    const code =
      String(error?.code || error?.name || "PROVIDER_ERROR")
        .replace(/[^A-Za-z0-9_.-]/g, "")
        .slice(0, 80) || "PROVIDER_ERROR";
    const canRetry = transient(error) && attempt < MAX_ATTEMPTS;
    const delay = Math.min(RETRY_BASE_MS * 2 ** Math.min(attempt - 1, 6), 60 * 60 * 1000);
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: canRetry ? "PENDING" : "FAILED",
        availableAt: canRetry ? new Date(now.getTime() + delay) : now,
        processedAt: canRetry ? null : now,
        lockedAt: null,
        payload: canRetry ? event.payload : { signUpId, waitListId: waitList.id },
        lastErrorCode: code,
      },
    });
    if (canRetry) result.retried++;
    else result.failed++;
  }
}

function safePayload(payload) {
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.signUpId !== "string" ||
    typeof payload.token !== "string"
  )
    return null;
  return payload;
}

// Founder notice (us → our users) via the platform sender. No suppression or
// eligibility checks: these recipients are workspace owners, not subscribers.
// Retries mirror the subscriber paths; a missing platform sender requeues so
// a misconfigured inline caller cannot strand a notice.
async function dispatchFounderNotice(db, event, sendPlatform, now, attempt, result) {
  const raw = event.payload && typeof event.payload === "object" ? event.payload : null;
  const to = typeof raw?.to === "string" ? raw.to : "";
  const subject = typeof raw?.subject === "string" ? raw.subject : "";
  const html = typeof raw?.html === "string" ? raw.html : "";
  const text = typeof raw?.text === "string" && raw.text ? raw.text : undefined;
  const idempotencyKey = typeof raw?.idempotencyKey === "string" ? raw.idempotencyKey : undefined;
  async function fail(code, counted) {
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: "FAILED",
        processedAt: now,
        lockedAt: null,
        lastErrorCode: code,
      },
    });
    result[counted]++;
  }
  if (!to || !subject || !html) {
    await fail("INVALID_FOUNDER_NOTICE", "failed");
    return;
  }
  if (typeof sendPlatform !== "function") {
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: "PENDING",
        availableAt: new Date(now.getTime() + 60 * 1000),
        lockedAt: null,
        lastErrorCode: "PLATFORM_SENDER_UNAVAILABLE",
      },
    });
    result.retried++;
    return;
  }
  try {
    const response = await sendPlatform({ to, subject, html, text, idempotencyKey });
    if (response?.error) throw response.error;
    const providerMessageId = response?.data?.id || response?.id;
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: "DELIVERED",
        ...(providerMessageId ? { providerMessageId } : {}),
        processedAt: now,
        lockedAt: null,
        lastErrorCode: null,
      },
    });
    result.accepted++;
  } catch (error) {
    const code =
      String(error?.code || error?.name || "PROVIDER_ERROR")
        .replace(/[^A-Za-z0-9_.-]/g, "")
        .slice(0, 80) || "PROVIDER_ERROR";
    const canRetry = transient(error) && attempt < MAX_ATTEMPTS;
    const delay = Math.min(RETRY_BASE_MS * 2 ** Math.min(attempt - 1, 6), 60 * 60 * 1000);
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: canRetry ? "PENDING" : "FAILED",
        availableAt: canRetry ? new Date(now.getTime() + delay) : now,
        processedAt: canRetry ? null : now,
        lockedAt: null,
        lastErrorCode: code,
      },
    });
    if (canRetry) result.retried++;
    else result.failed++;
  }
}

export async function dispatchPendingOutboxEvents(
  db,
  { send, sendPlatform, now = new Date(), batchSize = 20, waitListId, eventKeys } = {},
) {
  if (typeof send !== "function") throw new TypeError("A provider send function is required.");
  // Fan out due scheduled broadcasts before claiming send events, so a
  // scheduled send starts within one dispatcher tick of its scheduled time.
  // Skipped for targeted dispatches (eventKeys): those run inline in
  // user-facing requests (signup verification, offboard goodbyes) and must
  // never absorb a broadcast fan-out in their latency path.
  if (!eventKeys) {
    try {
      await queueDueBroadcasts(db, now);
    } catch (error) {
      console.error("Scheduled broadcast sweep failed:", error?.message || "unknown error");
    }
  }
  const staleBefore = new Date(now.getTime() - STALE_LOCK_MS);
  const events = await db.outboxEvent.findMany({
    where: {
      ...(waitListId ? { waitListId } : {}),
      ...(eventKeys ? { eventKey: { in: eventKeys } } : {}),
      availableAt: { lte: now },
      OR: [{ status: "PENDING" }, { status: "PROCESSING", lockedAt: { lt: staleBefore } }],
    },
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
    take: batchSize,
  });
  const result = { accepted: 0, retried: 0, failed: 0, skipped: 0 };
  for (const event of events) {
    const claimed = await db.outboxEvent.updateMany({
      where: {
        id: event.id,
        OR: [{ status: "PENDING" }, { status: "PROCESSING", lockedAt: { lt: staleBefore } }],
      },
      data: { status: "PROCESSING", lockedAt: now, attempts: { increment: 1 } },
    });
    if (claimed.count !== 1) continue;
    const payload = safePayload(event.payload);
    const attempt = event.attempts + 1;
    if (event.type === "FOUNDER_NOTICE_REQUESTED") {
      await dispatchFounderNotice(db, event, sendPlatform, now, attempt, result);
      continue;
    }
    if (event.type === "BROADCAST_EMAIL_REQUESTED") {
      const broadcastPayload =
        event.payload && typeof event.payload === "object" ? event.payload : null;
      await dispatchBroadcast(db, event, broadcastPayload, send, now, attempt, result);
      continue;
    }
    if (event.type === "MARKETING_AUTOMATION_TRIGGER_REQUESTED") {
      try {
        await processAutomationTrigger(db, event, now);
      } catch (error) {
        const code =
          String(error?.code || error?.name || "AUTOMATION_TRIGGER_ERROR")
            .replace(/[^A-Za-z0-9_.-]/g, "")
            .slice(0, 80) || "AUTOMATION_TRIGGER_ERROR";
        const canRetry = attempt < MAX_ATTEMPTS;
        const delay = Math.min(RETRY_BASE_MS * 2 ** Math.min(attempt - 1, 6), 60 * 60 * 1000);
        await db.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: canRetry ? "PENDING" : "FAILED",
            availableAt: canRetry ? new Date(now.getTime() + delay) : now,
            processedAt: canRetry ? null : now,
            lockedAt: null,
            payload: { signUpId: event.payload?.signUpId },
            lastErrorCode: code,
          },
        });
        if (canRetry) result.retried++;
        else result.failed++;
      }
      continue;
    }
    if (event.type === "MARKETING_AUTOMATION_STEP_REQUESTED") {
      await dispatchAutomationStep(db, event, event.payload, send, now, attempt, result);
      continue;
    }
    if (event.type === "OFFBOARD_EMAIL_REQUESTED") {
      await dispatchOffboard(db, event, send, now, attempt, result);
      continue;
    }
    if (event.type !== "SIGNUP_VERIFICATION_REQUESTED" || !payload) {
      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          processedAt: now,
          lockedAt: null,
          lastErrorCode: "UNSUPPORTED_EVENT",
        },
      });
      result.failed++;
      continue;
    }
    const [signup, verification, waitList] = await Promise.all([
      db.signUp.findUnique({
        where: { id: payload.signUpId },
        select: { id: true, email: true, emailNormalized: true, verifiedAt: true },
      }),
      db.signUpVerification.findFirst({
        where: {
          signUpId: payload.signUpId,
          tokenHash: createHash("sha256").update(payload.token).digest("hex"),
          usedAt: null,
          expiresAt: { gt: now },
        },
        select: { id: true },
      }),
      db.waitList.findUnique({
        where: { id: event.waitListId || payload.waitListId },
        select: { id: true, name: true, publicSlug: true, status: true, workspaceId: true },
      }),
    ]);
    if (
      !signup ||
      (signup.verifiedAt && !payload.manualRetry) ||
      !verification ||
      !waitList ||
      waitList.status !== "PUBLISHED"
    ) {
      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          processedAt: now,
          lockedAt: null,
          payload: { signUpId: payload.signUpId, waitListId: waitList?.id || event.waitListId },
          lastErrorCode: "SIGNUP_NOT_SENDABLE",
        },
      });
      result.skipped++;
      continue;
    }
    const suppressed =
      waitList.workspaceId &&
      (await db.emailSuppression.findUnique({
        where: {
          workspaceId_emailNormalized: {
            workspaceId: waitList.workspaceId,
            emailNormalized: normalizeEmail(signup.emailNormalized || signup.email),
          },
        },
      }));
    if (suppressed) {
      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          processedAt: now,
          lockedAt: null,
          payload: { signUpId: payload.signUpId, waitListId: waitList.id },
          lastErrorCode: "RECIPIENT_SUPPRESSED",
        },
      });
      result.skipped++;
      continue;
    }
    try {
      const response = await send({
        to: signup.email,
        subject: `Confirm your spot on ${waitList.name || "the waitlist"}`,
        html: await renderSubscriberVerification({
          waitlistName: waitList.name || "the waitlist",
          url: `${String(process.env.BETTER_AUTH_URL || "").replace(/\/$/, "")}/verify/${encodeURIComponent(payload.token)}${waitList.publicSlug ? `?returnTo=${encodeURIComponent(`/w/${waitList.publicSlug}`)}` : ""}`,
        }),
        text: `Confirm your email to secure your place on ${waitList.name || "the waitlist"}. Open this link within 24 hours: ${String(process.env.BETTER_AUTH_URL || "").replace(/\/$/, "")}/verify/${encodeURIComponent(payload.token)}`,
        idempotencyKey: event.eventKey,
        workspaceId: waitList.workspaceId,
      });
      if (response?.error) throw response.error;
      const providerMessageId = response?.data?.id || response?.id;
      if (!providerMessageId)
        throw Object.assign(new Error("Provider accepted no message id"), {
          code: "MISSING_PROVIDER_ID",
        });
      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "DELIVERED",
          providerMessageId,
          processedAt: now,
          lockedAt: null,
          payload: { signUpId: payload.signUpId, waitListId: waitList.id },
          lastErrorCode: null,
        },
      });
      result.accepted++;
      try {
        await applyKnownProviderEvents(
          db,
          providerMessageId,
          waitList.workspaceId,
          signup.emailNormalized || signup.email,
        );
      } catch (error) {
        console.error(
          "Could not apply provider suppression event:",
          error?.message || "unknown error",
        );
      }
    } catch (error) {
      const code =
        String(error?.code || error?.name || "PROVIDER_ERROR")
          .replace(/[^A-Za-z0-9_.-]/g, "")
          .slice(0, 80) || "PROVIDER_ERROR";
      const isVerificationEvent = event.type === "SIGNUP_VERIFICATION_REQUESTED";
      const maxAttempts = isVerificationEvent ? VERIFICATION_MAX_ATTEMPTS : MAX_ATTEMPTS;
      const canRetry = transient(error) && attempt < maxAttempts;
      const delay = isVerificationEvent
        ? VERIFICATION_RETRY_DELAYS_MS[attempt - 1]
        : Math.min(RETRY_BASE_MS * 2 ** Math.min(attempt - 1, 6), 60 * 60 * 1000);
      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: canRetry ? "PENDING" : "FAILED",
          availableAt: canRetry ? new Date(now.getTime() + delay) : now,
          processedAt: canRetry ? null : now,
          lockedAt: null,
          payload: canRetry ? payload : { signUpId: payload.signUpId, waitListId: waitList.id },
          lastErrorCode: code,
        },
      });
      if (canRetry) result.retried++;
      else result.failed++;
    }
  }
  return result;
}
