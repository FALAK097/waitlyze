"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";

import { getCampaignPosition } from "@/lib/campaigns/referral-position.mjs";
import {
  countEligibleRecipients,
  enqueueBroadcast,
  sampleEligibleEmails,
} from "@/lib/email/broadcast-queue.mjs";
import { subscriberEmailHtml, validateComposerContent } from "@/lib/email/composer.mjs";
import { renderLegacyTemplateEmail } from "@/lib/email/legacy-template-renderer.mjs";
import { BROADCAST_SEGMENTS, normalizeSegment } from "@/lib/email/segments.mjs";
import { seedPreviewVars } from "@/lib/email/variables.mjs";
import { notifyBroadcastSummary } from "@/lib/emails/founder-notifications.mjs";
import { emailStatusLabel } from "@/lib/emails/status-label.mjs";
import { emailTemplateType, normalizeEmailTemplate } from "@/lib/emails/templates.mjs";
import { deliverTestEmail, senderForWaitlist } from "@/lib/emails/test-delivery.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { consumePublicBudget, PublicRateLimitError } from "@/lib/security/public-rate-limit.mjs";
import { AUDIT_ACTIONS, recordWaitlistAuditEvent } from "@/lib/workspaces/audit.mjs";
import { requireCampaign } from "@/lib/workspaces/authorize";

export async function upsertEmailTemplate({ waitListId, templateType, data }) {
  const enumType = emailTemplateType(templateType);
  if (!enumType) return { success: false, message: "Invalid template type" };

  try {
    const content = validateComposerContent(data);
    if (
      typeof data.subject !== "string" ||
      !data.subject.trim() ||
      data.subject.length > 160 ||
      /[\r\n]/.test(data.subject) ||
      typeof data.previewText !== "string" ||
      data.previewText.length > 180
    )
      return {
        success: false,
        message: "Add a subject and keep the preview text under 180 characters.",
      };
    const { scope } = await requireCampaign(waitListId, "sendEmail");
    const updated = await prisma.emailTemplate.upsert({
      where: {
        waitListId_type: {
          waitListId,
          type: enumType,
        },
        waitList: scope,
      },
      update: {
        subject: data.subject.trim(),
        previewText: data.previewText,
        ...content,
      },
      create: {
        waitList: { connect: { id: waitListId, ...scope } },
        type: enumType,
        subject: data.subject.trim(),
        previewText: data.previewText,
        header: "",
        subHeader: "",
        mainBody: content.renderedText,
        subBody: "",
        ...content,
      },
    });

    return {
      success: true,
      message: "Template saved",
      template: normalizeEmailTemplate(updated),
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message:
        e.message === "Write a message before saving." ||
        e.message?.startsWith("This email is too long")
          ? e.message
          : "Failed to save template",
    };
  }
}

export async function sendTestEmail({ waitListId, templateType, to }) {
  let enumType;
  return deliverTestEmail({
    waitListId,
    to,
    waitlistSelect: { name: true, templateSnapshot: true },
    validate: () => {
      enumType = emailTemplateType(templateType);
      return enumType ? null : "Invalid template type";
    },
    prepareEmail: async ({ waitList, scope }) => {
      const tpl = await prisma.emailTemplate.findUnique({
        where: {
          waitListId_type: { waitListId, type: enumType },
          waitList: scope,
        },
      });
      if (!tpl) return { error: "Template not found" };

      const vars = {
        ...seedPreviewVars(waitList.name),
        waitlist_url: `https://waitlyze.falakgala.dev/forms/${waitListId}`,
      };
      return { email: renderLegacyTemplateEmail({ template: tpl, waitList, variables: vars }) };
    },
    successMessage: () => "Test email sent",
  });
}

// 1-click test send for a broadcast draft: renders the saved draft with seed
// preview data and delivers immediately (outside the outbox - tests never
// touch real recipients or the delivery report).
export async function sendBroadcastTestEmail({ waitListId, broadcastId, to }) {
  return deliverTestEmail({
    waitListId,
    to,
    waitlistSelect: { name: true },
    prepareEmail: async ({ waitList }) => {
      const broadcast = await prisma.marketingBroadcast.findFirst({
        where: { id: broadcastId, waitListId, status: { in: ["DRAFT", "SCHEDULED"] } },
      });
      if (!broadcast) return { error: "Draft not found" };
      const { interpolateVars, interpolateVarsHtml } = await import("@/lib/email/variables.mjs");
      const vars = seedPreviewVars(waitList.name);
      return {
        email: {
          subject: `[Test] ${interpolateVars(broadcast.subject, vars)}`,
          html: broadcast.renderedHtml
            ? subscriberEmailHtml({
                name: waitList.name || "Waitlist",
                content: interpolateVarsHtml(broadcast.renderedHtml, vars),
                previewText: interpolateVars(broadcast.previewText, vars),
              })
            : undefined,
          text: broadcast.renderedText
            ? interpolateVars(broadcast.renderedText, vars)
            : interpolateVars(broadcast.body, vars),
        },
      };
    },
    successMessage: (recipient) => `Test sent to ${recipient}.`,
  });
}

// 1-click test send for an automation recipe: same seed-data rendering.
export async function sendAutomationTestEmail({ waitListId, recipeId, to }) {
  return deliverTestEmail({
    waitListId,
    to,
    waitlistSelect: { name: true },
    prepareEmail: async ({ waitList }) => {
      const recipe = await prisma.automationRecipe.findFirst({
        where: { id: recipeId, waitListId },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });
      if (!recipe?.versions[0]) return { error: "Recipe not found" };
      const config = recipe.versions[0].config;
      const [{ AUTOMATION_DEFAULTS }, { interpolateVars, interpolateVarsHtml }] = await Promise.all(
        [import("@/lib/email/automations.mjs"), import("@/lib/email/variables.mjs")],
      );
      const vars = seedPreviewVars(waitList.name);
      const title = AUTOMATION_DEFAULTS[recipe.type]?.title || recipe.type;
      return {
        email: {
          subject: `[Test: ${title}] ${interpolateVars(config.subject, vars)}`,
          html: config.renderedHtml
            ? subscriberEmailHtml({
                name: waitList.name || "Waitlist",
                content: interpolateVarsHtml(config.renderedHtml, vars),
              })
            : undefined,
          text: interpolateVars(config.renderedText || config.body, vars),
        },
      };
    },
    successMessage: (recipient) => `Test sent to ${recipient}.`,
  });
}

async function renderTemplate({ waitListId, enumType, varsOverride = {} }) {
  const waitList = await prisma.waitList.findUnique({
    where: { id: waitListId, status: "PUBLISHED" },
    select: { id: true, name: true, sendEmailsToSubscribers: true, templateSnapshot: true },
  });
  if (!waitList) return { error: "Waitlist not found" };

  const tpl = await prisma.emailTemplate.findUnique({
    where: {
      waitListId_type: {
        waitListId,
        type: enumType,
      },
    },
  });
  if (!tpl) return { error: "Template not found" };

  const baseVars = {
    waitlist: waitList.name || "Your Project",
    waitlist_url: `https://waitlyze.falakgala.dev/forms/${waitListId}`,
    position: "",
    referral_link: "",
    referral_count: "",
    rewards: "",
    expiry_time: "",
    reason: "",
    feedback_link: "",
    total_signups: "",
  };
  const vars = { ...baseVars, ...varsOverride };
  const email = renderLegacyTemplateEmail({ template: tpl, waitList, variables: vars });
  return {
    waitList,
    subject: email.subject,
    htmlBody: email.html,
    textBody: email.text,
  };
}

export async function sendSignupEmail({ waitListId, to }) {
  if (
    typeof waitListId !== "string" ||
    !waitListId ||
    waitListId.length > 128 ||
    typeof to !== "string" ||
    to.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)
  ) {
    return { success: false, message: "Enter a valid email and waitlist." };
  }
  if (!env.RESEND_API_KEY) {
    return { success: false, message: "RESEND_API_KEY not configured" };
  }

  try {
    await consumePublicBudget(prisma, {
      kind: "welcome",
      campaignId: waitListId,
      headers: await headers(),
      email: to,
    });
  } catch (error) {
    if (error instanceof PublicRateLimitError) return { success: false, message: error.message };
    return { success: false, message: "Email delivery is temporarily unavailable." };
  }

  // Public action: never reveal whether this address is on the waitlist.
  const generic = {
    success: true,
    message: "If this address is on the waitlist, its confirmation email is on the way.",
  };

  const signUp = await prisma.signUp.findFirst({
    where: { waitListId, email: to, verifiedAt: { not: null }, waitList: { status: "PUBLISHED" } },
    select: { id: true, signUpEmailSent: true },
  });

  if (!signUp) return generic;

  const position = await getCampaignPosition(prisma, waitListId, signUp.id);
  const totalSignUps = await prisma.signUp.count({
    where: { waitListId, waitList: { status: "PUBLISHED" } },
  });

  const { waitList, subject, htmlBody, textBody, error } = await renderTemplate({
    waitListId,
    enumType: "SIGNUP",
    varsOverride: {
      position: position != null ? String(position) : String(totalSignUps),
      total_signups: String(totalSignUps),
    },
  });

  if (error === "Waitlist not found") return { success: false, message: error };
  if (error === "Template not found") return generic;
  if (!waitList.sendEmailsToSubscribers) return generic;

  if (signUp?.signUpEmailSent) {
    return generic;
  }

  try {
    const provider = await senderForWaitlist(waitListId);
    const { error: sendError } = await new Resend(provider.apiKey).emails.send(
      {
        from: provider.fromEmail,
        to,
        subject,
        replyTo: provider.replyTo,
        html: htmlBody,
        text: textBody,
      },
      { idempotencyKey: `signup-welcome:${signUp.id}` },
    );
    if (sendError) {
      console.error("Resend send error:", sendError);
      return generic;
    }

    if (signUp?.id) {
      await prisma.signUp.update({
        where: { id: signUp.id },
        data: { signUpEmailSent: true },
      });
    }

    return generic;
  } catch (e) {
    console.error(e);
    return generic;
  }
}

const broadcastPath = (waitListId) => `/waitlists/${waitListId}/emails/broadcasts`;
const broadcastInput = (input) => {
  if (!input || typeof input !== "object") return null;
  let content;
  try {
    content = validateComposerContent(input);
  } catch (error) {
    return {
      error:
        typeof error?.message === "string" && error.message
          ? error.message
          : "Write a message before saving.",
    };
  }
  const value = {
    name: String(input.name || "").trim(),
    subject: String(input.subject || "").trim(),
    previewText: String(input.previewText || "").trim(),
    body: content.renderedText,
    ...content,
  };
  if (
    value.name.length > 120 ||
    value.subject.length > 160 ||
    /[\r\n]/.test(value.subject) ||
    value.previewText.length > 180
  )
    return null;
  return value;
};

export async function listBroadcasts(waitListId) {
  const { campaign } = await requireCampaign(waitListId, "sendEmail");
  const [broadcasts, counts, reasons] = await Promise.all([
    prisma.marketingBroadcast.findMany({
      where: { waitListId: campaign.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        subject: true,
        previewText: true,
        body: true,
        editorDocument: true,
        renderedHtml: true,
        status: true,
        segment: true,
        scheduledAt: true,
        recipientCount: true,
        createdAt: true,
        updatedAt: true,
        sentAt: true,
      },
    }),
    prisma.$queryRaw`
      SELECT r."broadcastId", r."status"::text AS status, COUNT(*)::int AS count
      FROM "broadcast_recipients" r JOIN "marketing_broadcasts" b ON b."id" = r."broadcastId"
      WHERE b."waitListId" = ${campaign.id}
      GROUP BY r."broadcastId", r."status"`,
    prisma.$queryRaw`
      SELECT r."broadcastId", r."lastErrorCode" AS code, COUNT(*)::int AS count
      FROM "broadcast_recipients" r JOIN "marketing_broadcasts" b ON b."id" = r."broadcastId"
      WHERE b."waitListId" = ${campaign.id}
        AND r."status" IN ('SKIPPED', 'FAILED')
      GROUP BY r."broadcastId", r."lastErrorCode"`,
  ]);
  const metrics = new Map();
  for (const row of counts) metrics.set(`${row.broadcastId}:${row.status}`, row.count);
  // Delivery-report breakdown: bounced (provider failures), unsubscribed,
  // spam/suppression-list hits, and other skips - reconciled from the same
  // recipient rows the dispatcher wrote, so the report always adds up.
  const skippedByCode = new Map();
  for (const row of reasons)
    skippedByCode.set(`${row.broadcastId}:${row.code || "OTHER"}`, row.count);
  const sumCodes = (id, codes) =>
    codes.reduce((n, code) => n + (skippedByCode.get(`${id}:${code}`) || 0), 0);
  return broadcasts.map((broadcast) => ({
    ...broadcast,
    deliveredCount: metrics.get(`${broadcast.id}:DELIVERED`) || 0,
    failedCount: metrics.get(`${broadcast.id}:FAILED`) || 0,
    skippedCount: metrics.get(`${broadcast.id}:SKIPPED`) || 0,
    canceledCount: metrics.get(`${broadcast.id}:CANCELED`) || 0,
    unsubscribedCount: sumCodes(broadcast.id, ["RECIPIENT_UNSUBSCRIBED"]),
    suppressedCount: sumCodes(broadcast.id, ["RECIPIENT_SUPPRESSED"]),
    skippedOtherCount:
      (metrics.get(`${broadcast.id}:SKIPPED`) || 0) -
      sumCodes(broadcast.id, ["RECIPIENT_UNSUBSCRIBED", "RECIPIENT_SUPPRESSED"]),
  }));
}

export async function createBroadcastDraft(waitListId) {
  const { campaign } = await requireCampaign(waitListId, "sendEmail");
  const draft = await prisma.marketingBroadcast.create({
    data: {
      waitListId: campaign.id,
      name: "New broadcast",
      subject: "",
      previewText: "",
      body: "",
    },
    select: {
      id: true,
      name: true,
      subject: true,
      previewText: true,
      body: true,
      editorDocument: true,
      renderedHtml: true,
      renderedText: true,
      status: true,
      recipientCount: true,
      updatedAt: true,
    },
  });
  revalidatePath(broadcastPath(waitListId));
  return draft;
}

export async function saveBroadcastDraft({ waitListId, broadcastId, data }) {
  const value = broadcastInput(data);
  if (!value || value.error)
    return {
      success: false,
      message:
        value?.error || "Keep the subject, preview, and message within their character limits.",
    };
  await requireCampaign(waitListId, "sendEmail");
  const updated = await prisma.marketingBroadcast.updateMany({
    where: { id: broadcastId, waitListId, status: "DRAFT" },
    data: value,
  });
  if (!updated.count) return { success: false, message: "This draft can no longer be edited." };
  revalidatePath(broadcastPath(waitListId));
  return { success: true, message: "Draft saved." };
}

export async function getBroadcastRecipients(waitListId, segment = "ALL") {
  const { campaign } = await requireCampaign(waitListId, "sendEmail");
  const seg = normalizeSegment(segment);
  const [count, rows] = await Promise.all([
    countEligibleRecipients(prisma, campaign.id, seg),
    sampleEligibleEmails(prisma, campaign.id, seg, 5),
  ]);
  return {
    count,
    segment: seg,
    samples: rows.map(({ email }) => {
      const [local, domain] = String(email).split("@");
      return `${(local || "").slice(0, 1)}•••@${domain || ""}`;
    }),
  };
}

export async function listBroadcastSegments() {
  return Object.entries(BROADCAST_SEGMENTS).map(([key, meta]) => ({ key, ...meta }));
}

export async function queueBroadcast({ waitListId, broadcastId, expectedRecipientCount, segment }) {
  const { campaign, user } = await requireCampaign(waitListId, "sendEmail");
  if (!Number.isInteger(expectedRecipientCount) || expectedRecipientCount < 0)
    return { success: false, message: "Refresh the recipient preview before sending." };
  if (!env.OUTBOX_DISPATCH_SECRET || !env.RESEND_API_KEY)
    return { success: false, message: "Email delivery is not configured yet." };
  const seg = normalizeSegment(segment);
  try {
    // The recipient fan-out (bulk insert, variable snapshot, per-recipient
    // updates) shares one connection inside this interactive transaction, so
    // for large segments it legitimately takes longer than Prisma's default
    // 5 s; allow 60 s before rolling back.
    const count = await prisma.$transaction(
      async (tx) =>
        enqueueBroadcast(tx, {
          waitListId: campaign.id,
          broadcastId,
          segment: seg,
          expectedRecipientCount,
          exact: true,
        }),
      { timeout: 60_000, maxWait: 10_000 },
    );
    revalidatePath(broadcastPath(waitListId));
    await recordWaitlistAuditEvent(prisma, {
      userId: user.id,
      waitListId: campaign.id,
      action: AUDIT_ACTIONS.BROADCAST_SENT,
      resourceType: "broadcast",
      resourceId: broadcastId,
      detail: `Queued for ${count} opted-in subscriber${count === 1 ? "" : "s"} (${seg})`,
    });
    return {
      success: true,
      message: `Queued for ${count} opted-in subscriber${count === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    return { success: false, message: error.message || "Could not queue this broadcast." };
  }
}

export async function scheduleBroadcast({
  waitListId,
  broadcastId,
  segment,
  scheduledAt,
  expectedRecipientCount,
}) {
  // Authenticate before checking delivery configuration so this early return
  // cannot reveal server setup to an unauthenticated caller.
  const { campaign, user } = await requireCampaign(waitListId, "sendEmail");
  if (!env.OUTBOX_DISPATCH_SECRET || !env.RESEND_API_KEY)
    return { success: false, message: "Email delivery is not configured yet." };
  const seg = normalizeSegment(segment);
  // Contract with the client: scheduledAt arrives as an explicit UTC ISO
  // string (the picker wall clock is converted in the founder's browser
  // zone), so parsing here is zone-unambiguous by construction.
  const when = new Date(scheduledAt);
  if (!Number.isFinite(when.getTime()) || when.getTime() <= Date.now())
    return { success: false, message: "Pick a future date and time to schedule." };
  if (when.getTime() - Date.now() > 90 * 24 * 60 * 60 * 1000)
    return { success: false, message: "Schedule up to 90 days ahead." };
  if (!Number.isInteger(expectedRecipientCount) || expectedRecipientCount <= 0)
    return { success: false, message: "Refresh the recipient preview before scheduling." };
  try {
    const count = await prisma.$transaction(async (tx) => {
      const [broadcast] = await tx.$queryRaw`
        SELECT "id", "status"::text AS status, "subject", "body"
        FROM "marketing_broadcasts"
        WHERE "id" = ${broadcastId} AND "waitListId" = ${campaign.id}
        FOR UPDATE`;
      if (!broadcast || broadcast.status !== "DRAFT")
        throw new Error("Only drafts can be scheduled.");
      if (!String(broadcast.subject || "").trim() || !String(broadcast.body || "").trim())
        throw new Error("Add a subject and message before scheduling.");
      const fresh = await countEligibleRecipients(tx, campaign.id, seg);
      if (fresh !== expectedRecipientCount)
        throw new Error("The recipient list changed. Refresh the preview and confirm again.");
      if (!fresh) throw new Error("There are no eligible subscribers in this segment right now.");
      await tx.marketingBroadcast.update({
        where: { id: broadcastId },
        data: { status: "SCHEDULED", segment: seg, scheduledAt: when },
      });
      return fresh;
    });
    revalidatePath(broadcastPath(waitListId));
    await recordWaitlistAuditEvent(prisma, {
      userId: user.id,
      waitListId: campaign.id,
      action: AUDIT_ACTIONS.BROADCAST_SENT,
      resourceType: "broadcast",
      resourceId: broadcastId,
      detail: `Scheduled for ${count} subscriber${count === 1 ? "" : "s"} (${seg})`,
    });
    return {
      success: true,
      message: `Scheduled for ${count} subscriber${count === 1 ? "" : "s"}. Eligibility is re-checked at send time.`,
    };
  } catch (error) {
    return { success: false, message: error.message || "Could not schedule this broadcast." };
  }
}

export async function cancelBroadcast({ waitListId, broadcastId }) {
  const { campaign } = await requireCampaign(waitListId, "sendEmail");
  const canceled = await prisma.$transaction(async (tx) => {
    const [broadcast] = await tx.$queryRaw`
      SELECT "id", "status"::text AS status FROM "marketing_broadcasts"
      WHERE "id" = ${broadcastId} AND "waitListId" = ${campaign.id} FOR UPDATE`;
    if (!broadcast || (broadcast.status !== "SENDING" && broadcast.status !== "SCHEDULED"))
      return null;
    if (broadcast.status === "SCHEDULED") {
      // Nothing fanned out yet - just unschedule back to a canceled draft.
      await tx.marketingBroadcast.update({
        where: { id: broadcastId },
        data: { status: "CANCELED", scheduledAt: null },
      });
      return "SCHEDULED";
    }
    await tx.$executeRaw`
      UPDATE "outbox_events" SET "status" = 'FAILED', "processedAt" = NOW(), "lockedAt" = NULL, "lastErrorCode" = 'BROADCAST_CANCELED'
      WHERE "type" = 'BROADCAST_EMAIL_REQUESTED' AND "payload"->>'broadcastId' = ${broadcastId} AND "status" = 'PENDING'`;
    await tx.broadcastRecipient.updateMany({
      where: { broadcastId, status: { in: ["PENDING", "PROCESSING"] } },
      data: { status: "CANCELED", lastErrorCode: "BROADCAST_CANCELED" },
    });
    await tx.marketingBroadcast.update({
      where: { id: broadcastId },
      data: { status: "CANCELED" },
    });
    return "SENDING";
  });
  // Only SENDING fans out (unschedule does not send anything), so only that
  // path deserves a delivery summary notification.
  if (canceled === "SENDING") await notifyBroadcastSummary(prisma, broadcastId);
  revalidatePath(broadcastPath(waitListId));
  return {
    success: Boolean(canceled),
    message:
      canceled === "SCHEDULED"
        ? "Broadcast unscheduled."
        : canceled
          ? "Remaining queued emails were canceled."
          : "This broadcast is no longer sending.",
  };
}

export async function listEmailRuns(waitListId) {
  const { campaign } = await requireCampaign(waitListId, "sendEmail");
  const [runs, broadcasts] = await Promise.all([
    prisma.automationRun.findMany({
      where: { waitListId: campaign.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        recipe: { select: { type: true } },
        signUp: { select: { email: true } },
        steps: { select: { status: true, lastErrorCode: true } },
      },
    }),
    prisma.marketingBroadcast.findMany({
      where: { waitListId: campaign.id, status: { not: "DRAFT" } },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        recipientCount: true,
        sentAt: true,
        updatedAt: true,
      },
    }),
  ]);
  const maskEmail = (email) => email.replace(/^([^@])[^@]*(@.+)$/, "$1•••$2");
  const automationTitle = (type) =>
    ({
      WELCOME: "Welcome after confirmation",
      WELCOME_FOLLOWUP: "Welcome follow-up",
      REFERRAL_REMINDER: "Referral reminder",
      REFERRAL_MILESTONE: "Referral milestone",
      LAUNCH_COUNTDOWN: "Launch countdown",
    })[type] || type;
  const items = [
    ...runs.map((run) => ({
      id: `run-${run.id}`,
      kind: "Automation",
      title: automationTitle(run.recipe.type),
      recipient: maskEmail(run.signUp.email),
      status: emailStatusLabel(run.status),
      statusCode: run.status,
      reason: (run.skipReason || run.steps.find((step) => step.lastErrorCode)?.lastErrorCode || "")
        .toLowerCase()
        .replaceAll("_", " "),
      at: (run.finishedAt || run.scheduledAt || run.createdAt).toISOString(),
    })),
    ...broadcasts.map((broadcast) => ({
      id: `bc-${broadcast.id}`,
      kind: "Broadcast",
      title: broadcast.name || broadcast.subject || "Untitled broadcast",
      recipient: `${broadcast.recipientCount} recipient${broadcast.recipientCount === 1 ? "" : "s"}`,
      status: emailStatusLabel(broadcast.status),
      statusCode: broadcast.status,
      reason: "",
      at: (broadcast.sentAt || broadcast.updatedAt).toISOString(),
    })),
  ];
  items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return items.slice(0, 100);
}
