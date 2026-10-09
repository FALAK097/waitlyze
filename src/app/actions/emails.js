"use server";

import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCampaignPosition } from "@/lib/campaigns/referral-position.mjs";
import { escapeHtmlText, renderEmailMarkdown } from "@/lib/email-markdown.mjs";
import { Resend } from 'resend';
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const resend = new Resend(env.RESEND_API_KEY);

const TYPE_MAP = {
  signup: "SIGNUP",
  offboarding: "OFFBOARDING",
};

const DEFAULTS = {
  signup: {
    subject: "Welcome to {{waitlist}}!",
    previewText: "Join our exclusive waitlist",
    header: "Welcome Aboard!",
    subHeader: "We're excited to have you",
    mainBody: "Thanks for joining {{waitlist}}.\n\nPlease verify your email to secure your spot.",
    subBody: "You're currently #{{position}} in line",
  },
  offboarding: {
    subject: "You're off the {{waitlist}} Waitlist!",
    previewText: "Congratulations! Time for the next step.",
    header: "Next Steps",
    subHeader: "{{waitlist}} is now open!",
    mainBody:
      "We're excited to announce that {{waitlist}} is now open for everyone. We've got some exciting news to share with you.",
    subBody: "We'll see you on the other side!",
  },
};

export async function getOrCreateTemplates(waitListId) {
  const { scope } = await requireCampaign(waitListId, "sendEmail");
  const records = await prisma.emailTemplate.findMany({
    where: { waitListId, waitList: scope },
  });

  const byType = {};
  records.forEach(r => {
    byType[r.type] = r;
  });

  const result = {};

  for (const key of Object.keys(TYPE_MAP)) {
    const enumType = TYPE_MAP[key];
    if (!byType[enumType]) {
      const created = await prisma.emailTemplate.create({
        data: {
          waitList: { connect: { id: waitListId, ...scope } },
          type: enumType,
          ...DEFAULTS[key],
        },
      });
      result[key] = created;
    } else {
      result[key] = byType[enumType];
    }
  }

  return {
    signup: normalize(result.signup),
    offboarding: normalize(result.offboarding),
  };
}

function normalize(record) {
  return {
    id: record.id,
    type: record.type === "SIGNUP" ? "signup" : "offboarding",
    subject: record.subject,
    previewText: record.previewText,
    header: record.header,
    subHeader: record.subHeader,
    mainBody: record.mainBody,
    subBody: record.subBody,
  };
}

export async function upsertEmailTemplate({ waitListId, templateType, data }) {
  const enumType = TYPE_MAP[templateType];
  if (!enumType) return { success: false, message: "Invalid template type" };

  try {
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
        subject: data.subject,
        previewText: data.previewText,
        header: data.header,
        subHeader: data.subHeader,
        mainBody: data.mainBody,
        subBody: data.subBody,
      },
      create: {
        waitList: { connect: { id: waitListId, ...scope } },
        type: enumType,
        subject: data.subject,
        previewText: data.previewText,
        header: data.header,
        subHeader: data.subHeader,
        mainBody: data.mainBody,
        subBody: data.subBody,
      },
    });

    return { success: true, message: "Template saved", template: normalize(updated) };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Failed to save template" };
  }
}

export async function sendTestEmail({ waitListId, templateType, to }) {
  if (!env.RESEND_API_KEY) {
    return { success: false, message: "RESEND_API_KEY not configured" };
  }

  const enumType = TYPE_MAP[templateType];
  if (!enumType) return { success: false, message: "Invalid template type" };

  try {
    const { scope } = await requireCampaign(waitListId, "sendEmail");
    const waitList = await prisma.waitList.findFirst({
      where: { id: waitListId, ...scope },
      select: { name: true },
    });
    if (!waitList) return { success: false, message: "Waitlist not found" };

    const tpl = await prisma.emailTemplate.findUnique({
      where: {
        waitListId_type: {
          waitListId,
          type: enumType,
        },
        waitList: scope,
      },
    });
    if (!tpl) return { success: false, message: "Template not found" };

    const vars = {
      waitlist: waitList.name || "Your Project",
      waitlist_url: `https://waitlyze.falakgala.dev/forms/${waitListId}`,
      position: "42",
      referral_link: "https://example.com/ref/demo",
      referral_count: "5",
      rewards: "Early Access",
      expiry_time: "24 hours",
      reason: "No longer interested",
      feedback_link: "https://example.com/feedback",
      total_signups: "100",
    };

    const replaceVars = (text) =>
      text.replace(/\{\{([^}]+)\}\}/g, (_, k) => vars[k.trim()] ?? `{{${k}}}`);

    const subject = replaceVars(tpl.subject);
    const previewText = replaceVars(tpl.previewText);
    const header = markdownToHtml(replaceVars(tpl.header));
    const subHeader = markdownToHtml(replaceVars(tpl.subHeader));
    const mainBody = markdownToHtml(replaceVars(tpl.mainBody));
    const subBody = markdownToHtml(replaceVars(tpl.subBody));

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtmlText(subject)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 0;
      margin: 0;
      background-color: #f7f7f7;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 30px 20px;
    }
    .email-body {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #111827;
    }
    .subheader {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 24px;
    }
    .content {
      font-size: 14px;
      margin-bottom: 24px;
    }
    .footer {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 24px;
    }
    .divider {
      border-top: 1px solid #e5e7eb;
      margin: 24px 0;
    }
    .email-footer {
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
      margin-top: 24px;
    }
    /* Markdown styles */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 0;
      color: #111827;
    }
    h1 { font-size: 22px; }
    h2 { font-size: 20px; }
    h3 { font-size: 18px; }
    h4 { font-size: 16px; }
    a {
      color: #2563eb;
      text-decoration: underline;
    }
    p {
      margin-top: 0;
    }
    code {
      font-family: monospace;
      background-color: #f3f4f6;
      padding: 2px 4px;
      border-radius: 3px;
    }
    pre {
      background-color: #f3f4f6;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
    }
    blockquote {
      border-left: 4px solid #e5e7eb;
      margin-left: 0;
      padding-left: 12px;
      color: #6b7280;
    }
    ul, ol {
      padding-left: 24px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-body">
      <div class="header">${header}</div>
      <div class="subheader">${subHeader}</div>
      <div class="content">${mainBody}</div>
      <div class="footer">${subBody}</div>
      <div class="divider"></div>
      <div class="email-footer">
        Need help? Reply to this email • © ${new Date().getFullYear()} Waitlyze
      </div>
    </div>
  </div>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject,
      replyTo: env.RESEND_REPLY_TO,
      html: htmlBody,
    });

    if (error) {
      return { success: false, message: `Resend error: ${error.name} ${error.message}` };
    }

    return { success: true, message: "Test email sent" };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Failed to send email" };
  }
}

function markdownToHtml(markdown) {
  return renderEmailMarkdown(markdown);
}

async function renderTemplate({ waitListId, enumType, varsOverride = {} }) {
  const waitList = await prisma.waitList.findUnique({
    where: { id: waitListId, status: "PUBLISHED" },
    select: { id: true, name: true, sendEmailsToSubscribers: true },
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

  const replaceVars = (text) =>
    text.replace(/\{\{([^}]+)\}\}/g, (_, k) => vars[k.trim()] ?? `{{${k}}}`);

  const subject = replaceVars(tpl.subject);
  const previewText = replaceVars(tpl.previewText);
  const header = markdownToHtml(replaceVars(tpl.header));
  const subHeader = markdownToHtml(replaceVars(tpl.subHeader));
  const mainBody = markdownToHtml(replaceVars(tpl.mainBody));
  const subBody = markdownToHtml(replaceVars(tpl.subBody));

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtmlText(subject)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 0;
      margin: 0;
      background-color: #f7f7f7;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 30px 20px;
    }
    .email-body {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #111827;
    }
    .subheader {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 24px;
    }
    .content {
      font-size: 14px;
      margin-bottom: 24px;
    }
    .footer {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 24px;
    }
    .divider {
      border-top: 1px solid #e5e7eb;
      margin: 24px 0;
    }
    .email-footer {
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
      margin-top: 24px;
    }
    /* Markdown styles */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 0;
      color: #111827;
    }
    h1 { font-size: 22px; }
    h2 { font-size: 20px; }
    h3 { font-size: 18px; }
    h4 { font-size: 16px; }
    a {
      color: #2563eb;
      text-decoration: underline;
    }
    p {
      margin-top: 0;
    }
    code {
      font-family: monospace;
      background-color: #f3f4f6;
      padding: 2px 4px;
      border-radius: 3px;
    }
    pre {
      background-color: #f3f4f6;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
    }
    blockquote {
      border-left: 4px solid #e5e7eb;
      margin-left: 0;
      padding-left: 12px;
      color: #6b7280;
    }
    ul, ol {
      padding-left: 24px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-body">
      <div class="header">${header}</div>
      <div class="subheader">${subHeader}</div>
      <div class="content">${mainBody}</div>
      <div class="footer">${subBody}</div>
      <div class="divider"></div>
      <div class="email-footer">
        Need help? Reply to this email • © ${new Date().getFullYear()} Waitlyze
      </div>
    </div>
  </div>
</body>
</html>`;

  return { waitList, subject, htmlBody };
}

export async function sendSignupEmail({ waitListId, to }) {
  if (!env.RESEND_API_KEY) {
    return { success: false, message: "RESEND_API_KEY not configured" };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`signup-resend:${waitListId}:${ip}`, 10, 60 * 60 * 1000)) {
    return { success: false, message: "Too many requests. Try again later." };
  }

  // Public action: never reveal whether this address is on the waitlist.
  const generic = { success: true, message: "If this address is on the waitlist, its confirmation email is on the way." };

  const signUp = await prisma.signUp.findFirst({
    where: { waitListId, email: to, waitList: { status: "PUBLISHED" } },
    select: { id: true, signUpEmailSent: true },
  });

  if (!signUp) return generic;

  const position = await getCampaignPosition(prisma, waitListId, signUp.id);
  const totalSignUps = await prisma.signUp.count({ where: { waitListId, waitList: { status: "PUBLISHED" } } });

  const { waitList, subject, htmlBody, error } = await renderTemplate({
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
    const { error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject,
      replyTo: env.RESEND_REPLY_TO,
      html: htmlBody,
    });
    if (error) {
      console.error("Resend send error:", error);
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

const broadcastPath = (waitListId) => `/wait-lists/${waitListId}/emails/broadcasts`;
const broadcastInput = (input) => {
  if (!input || typeof input !== "object") return null;
  const value = {
    name: String(input.name || "").trim(),
    subject: String(input.subject || "").trim(),
    previewText: String(input.previewText || "").trim(),
    body: String(input.body || "").trim(),
  };
  if (value.name.length > 120 || value.subject.length > 160 || /[\r\n]/.test(value.subject) || value.previewText.length > 180 || value.body.length > 5000) return null;
  return value;
};

export async function listBroadcasts(waitListId) {
  const { campaign } = await requireCampaign(waitListId, "sendEmail");
  const [broadcasts, counts] = await Promise.all([
    prisma.marketingBroadcast.findMany({
      where: { waitListId: campaign.id }, orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, subject: true, previewText: true, body: true, status: true, recipientCount: true, createdAt: true, updatedAt: true, sentAt: true },
    }),
    prisma.$queryRaw`
      SELECT r."broadcastId", r."status"::text AS status, COUNT(*)::int AS count
      FROM "broadcast_recipients" r JOIN "marketing_broadcasts" b ON b."id" = r."broadcastId"
      WHERE b."waitListId" = ${campaign.id}
      GROUP BY r."broadcastId", r."status"`,
  ]);
  const metrics = new Map();
  for (const row of counts) metrics.set(`${row.broadcastId}:${row.status}`, row.count);
  return broadcasts.map((broadcast) => ({
    ...broadcast,
    deliveredCount: metrics.get(`${broadcast.id}:DELIVERED`) || 0,
    failedCount: metrics.get(`${broadcast.id}:FAILED`) || 0,
    skippedCount: metrics.get(`${broadcast.id}:SKIPPED`) || 0,
    canceledCount: metrics.get(`${broadcast.id}:CANCELED`) || 0,
  }));
}

export async function createBroadcastDraft(waitListId) {
  const { campaign } = await requireCampaign(waitListId, "sendEmail");
  const draft = await prisma.marketingBroadcast.create({
    data: { waitListId: campaign.id, name: "New broadcast", subject: "", previewText: "", body: "" },
    select: { id: true, name: true, subject: true, previewText: true, body: true, status: true, recipientCount: true, updatedAt: true },
  });
  revalidatePath(broadcastPath(waitListId));
  return draft;
}

export async function saveBroadcastDraft({ waitListId, broadcastId, data }) {
  const value = broadcastInput(data);
  if (!value) return { success: false, message: "Keep the subject, preview, and message within their character limits." };
  await requireCampaign(waitListId, "sendEmail");
  const updated = await prisma.marketingBroadcast.updateMany({
    where: { id: broadcastId, waitListId, status: "DRAFT" }, data: value,
  });
  if (!updated.count) return { success: false, message: "This draft can no longer be edited." };
  revalidatePath(broadcastPath(waitListId));
  return { success: true, message: "Draft saved." };
}

export async function getBroadcastRecipients(waitListId) {
  const { campaign } = await requireCampaign(waitListId, "sendEmail");
  const [countRows, samples] = await Promise.all([
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "sign_ups" s
      JOIN "wait_lists" w ON w."id" = s."waitListId"
      WHERE s."waitListId" = ${campaign.id}
        AND w."status"::text = 'PUBLISHED'
        AND s."verifiedAt" IS NOT NULL
        AND s."marketingConsentAt" IS NOT NULL
        AND s."marketingUnsubscribedAt" IS NULL
        AND COALESCE(s."emailNormalized", lower(btrim(s."email"))) <> ''
        AND NOT EXISTS (
          SELECT 1 FROM "email_suppressions" suppression
          WHERE suppression."workspaceId" = w."workspaceId"
            AND suppression."emailNormalized" = COALESCE(s."emailNormalized", lower(btrim(s."email")))
        )`,
    prisma.$queryRaw`
      SELECT s."email"
      FROM "sign_ups" s
      JOIN "wait_lists" w ON w."id" = s."waitListId"
      WHERE s."waitListId" = ${campaign.id}
        AND w."status"::text = 'PUBLISHED'
        AND s."verifiedAt" IS NOT NULL
        AND s."marketingConsentAt" IS NOT NULL
        AND s."marketingUnsubscribedAt" IS NULL
        AND COALESCE(s."emailNormalized", lower(btrim(s."email"))) <> ''
        AND NOT EXISTS (
          SELECT 1 FROM "email_suppressions" suppression
          WHERE suppression."workspaceId" = w."workspaceId"
            AND suppression."emailNormalized" = COALESCE(s."emailNormalized", lower(btrim(s."email")))
        )
      ORDER BY s."createdAt" ASC, s."id" ASC
      LIMIT 5`,
  ]);
  return {
    count: countRows[0]?.count ?? 0,
    samples: samples.map(({ email }) => {
      const [local, domain] = email.split("@");
      return `${local.slice(0, 1)}•••@${domain || ""}`;
    }),
  };
}

export async function queueBroadcast({ waitListId, broadcastId, expectedRecipientCount }) {
  const { campaign } = await requireCampaign(waitListId, "sendEmail");
  if (!Number.isInteger(expectedRecipientCount) || expectedRecipientCount < 0) return { success: false, message: "Refresh the recipient preview before sending." };
  if (!env.OUTBOX_DISPATCH_SECRET || !env.RESEND_API_KEY) return { success: false, message: "Email delivery is not configured yet." };
  try {
    const count = await prisma.$transaction(async (tx) => {
      const [broadcast] = await tx.$queryRaw`
        SELECT "id", "status"::text AS status, "subject", "body"
        FROM "marketing_broadcasts"
        WHERE "id" = ${broadcastId} AND "waitListId" = ${campaign.id}
        FOR UPDATE`;
      if (!broadcast || broadcast.status !== "DRAFT") throw new Error("This broadcast is no longer a draft.");
      if (!broadcast.subject.trim() || !broadcast.body.trim()) throw new Error("Add a subject and message before sending.");

      const [preview] = await tx.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM "sign_ups" s JOIN "wait_lists" w ON w."id" = s."waitListId"
        WHERE s."waitListId" = ${campaign.id} AND w."status"::text = 'PUBLISHED'
          AND s."verifiedAt" IS NOT NULL AND s."marketingConsentAt" IS NOT NULL
          AND s."marketingUnsubscribedAt" IS NULL
          AND COALESCE(s."emailNormalized", lower(btrim(s."email"))) <> ''
          AND NOT EXISTS (SELECT 1 FROM "email_suppressions" suppression
            WHERE suppression."workspaceId" = w."workspaceId"
              AND suppression."emailNormalized" = COALESCE(s."emailNormalized", lower(btrim(s."email"))))`;
      if (preview.count !== expectedRecipientCount) throw new Error("The recipient list changed. Refresh the preview and confirm again.");
      if (!preview.count) throw new Error("There are no verified subscribers who opted in to updates.");

      const [queued] = await tx.$queryRaw`
        WITH recipients AS (
          INSERT INTO "broadcast_recipients" ("id", "broadcastId", "signUpId", "email", "emailNormalized", "status", "createdAt")
          SELECT gen_random_uuid()::text, ${broadcastId}, s."id", s."email",
            COALESCE(s."emailNormalized", lower(btrim(s."email"))), 'PENDING', NOW()
          FROM "sign_ups" s JOIN "wait_lists" w ON w."id" = s."waitListId"
          WHERE s."waitListId" = ${campaign.id} AND w."status"::text = 'PUBLISHED'
            AND s."verifiedAt" IS NOT NULL AND s."marketingConsentAt" IS NOT NULL
            AND s."marketingUnsubscribedAt" IS NULL
            AND COALESCE(s."emailNormalized", lower(btrim(s."email"))) <> ''
            AND NOT EXISTS (SELECT 1 FROM "email_suppressions" suppression
              WHERE suppression."workspaceId" = w."workspaceId"
                AND suppression."emailNormalized" = COALESCE(s."emailNormalized", lower(btrim(s."email"))))
          RETURNING "id", "broadcastId"
        ), events AS (
          INSERT INTO "outbox_events" ("id", "eventKey", "type", "payload", "status", "attempts", "availableAt", "createdAt", "waitListId")
          SELECT gen_random_uuid()::text, 'broadcast:' || recipients."broadcastId" || ':' || recipients."id",
            'BROADCAST_EMAIL_REQUESTED', jsonb_build_object('broadcastId', recipients."broadcastId", 'recipientId', recipients."id"),
            'PENDING', 0, NOW(), NOW(), ${campaign.id}
          FROM recipients
          RETURNING "id"
        ) SELECT COUNT(*)::int AS count FROM recipients`;
      if (queued.count !== expectedRecipientCount) throw new Error("The recipient list changed while queueing. Nothing was sent; refresh the preview.");
      await tx.marketingBroadcast.update({
        where: { id: broadcastId },
        data: { status: "SENDING", recipientCount: queued.count },
      });
      return queued.count;
    });
    revalidatePath(broadcastPath(waitListId));
    return { success: true, message: `Queued for ${count} opted-in subscriber${count === 1 ? "" : "s"}.` };
  } catch (error) {
    return { success: false, message: error.message || "Could not queue this broadcast." };
  }
}

export async function cancelBroadcast({ waitListId, broadcastId }) {
  const { campaign } = await requireCampaign(waitListId, "sendEmail");
  const canceled = await prisma.$transaction(async (tx) => {
    const [broadcast] = await tx.$queryRaw`
      SELECT "id", "status"::text AS status FROM "marketing_broadcasts"
      WHERE "id" = ${broadcastId} AND "waitListId" = ${campaign.id} FOR UPDATE`;
    if (!broadcast || broadcast.status !== "SENDING") return false;
    await tx.$executeRaw`
      UPDATE "outbox_events" SET "status" = 'FAILED', "processedAt" = NOW(), "lockedAt" = NULL, "lastErrorCode" = 'BROADCAST_CANCELED'
      WHERE "type" = 'BROADCAST_EMAIL_REQUESTED' AND "payload"->>'broadcastId' = ${broadcastId} AND "status" = 'PENDING'`;
    await tx.broadcastRecipient.updateMany({ where: { broadcastId, status: { in: ["PENDING", "PROCESSING"] } }, data: { status: "CANCELED", lastErrorCode: "BROADCAST_CANCELED" } });
    await tx.marketingBroadcast.update({ where: { id: broadcastId }, data: { status: "CANCELED" } });
    return true;
  });
  revalidatePath(broadcastPath(waitListId));
  return { success: canceled, message: canceled ? "Remaining queued emails were canceled." : "This broadcast is no longer sending." };
}
