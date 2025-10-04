"use server";

import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { marked } from 'marked';

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
  const records = await prisma.emailTemplate.findMany({
    where: { waitListId },
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
          waitListId,
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
    const updated = await prisma.emailTemplate.upsert({
      where: {
        waitListId_type: {
          waitListId,
          type: enumType,
        },
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
        waitListId,
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
  if (!env.PLUNK_SECRET_KEY) {
    return { success: false, message: "PLUNK_SECRET_KEY not configured" };
  }

  const enumType = TYPE_MAP[templateType];
  if (!enumType) return { success: false, message: "Invalid template type" };

  try {
    const waitList = await prisma.waitList.findUnique({
      where: { id: waitListId },
      select: { name: true },
    });
    if (!waitList) return { success: false, message: "Waitlist not found" };

    const tpl = await prisma.emailTemplate.findUnique({
      where: {
        waitListId_type: {
          waitListId,
          type: enumType,
        },
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
  <title>${subject}</title>
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

    const resp = await fetch("https://api.useplunk.com/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PLUNK_SECRET_KEY}`,
      },
      body: JSON.stringify({ to, subject, body: htmlBody }),
      cache: "no-store",
    });

    if (!resp.ok) {
      const text = await resp.text();
      return { success: false, message: `Plunk error: ${resp.status} ${text}` };
    }

    return { success: true, message: "Test email sent" };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Failed to send email" };
  }
}

function markdownToHtml(markdown) {
  if (!markdown) return '';
  return marked(markdown);
}

async function renderTemplate({ waitListId, enumType, varsOverride = {} }) {
  const waitList = await prisma.waitList.findUnique({
    where: { id: waitListId },
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
  <title>${subject}</title>
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
  if (!env.PLUNK_SECRET_KEY) {
    return { success: false, message: "PLUNK_SECRET_KEY not configured" };
  }

  const signUp = await prisma.signUp.findFirst({
    where: { waitListId, email: to },
    select: { rank: true, id: true, signUpEmailSent: true },
  });

  const totalSignUps = await prisma.signUp.count({ where: { waitListId } });

  const { waitList, subject, htmlBody, error } = await renderTemplate({
    waitListId,
    enumType: "SIGNUP",
    varsOverride: {
      position: signUp?.rank != null ? String(signUp.rank) : String(totalSignUps),
      total_signups: String(totalSignUps),
    },
  });

  if (error === "Waitlist not found") return { success: false, message: error };
  if (error === "Template not found") return { success: true, message: "No signup template" };
  if (!waitList.sendEmailsToSubscribers)
    return { success: true, message: "Email sending disabled" };

  if (signUp?.signUpEmailSent) {
    return { success: true, message: "Email already sent" };
  }

  try {
    const resp = await fetch("https://api.useplunk.com/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PLUNK_SECRET_KEY}`,
      },
      body: JSON.stringify({ to, subject, body: htmlBody, subscribed: true }),
      cache: "no-store",
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error("Plunk send error:", text);
      return { success: true, message: "Signup stored (email send failed)" };
    }

    if (signUp?.id) {
      await prisma.signUp.update({
        where: { id: signUp.id },
        data: { signUpEmailSent: true },
      });
    }

    return { success: true, message: "Email sent" };
  } catch (e) {
    console.error(e);
    return { success: true, message: "Signup stored (email send exception)" };
  }
}
