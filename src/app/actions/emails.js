"use server";

import prisma from "@/lib/prisma";

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
    mainBody: "Thanks for joining {{waitlist}}.\nPlease verify your email to secure your spot.",
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
  if (!process.env.PLUNK_SECRET_KEY) {
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
    const header = replaceVars(tpl.header);
    const subHeader = replaceVars(tpl.subHeader);
    const mainBody = replaceVars(tpl.mainBody);
    const subBody = replaceVars(tpl.subBody);

    const htmlBody = `<!DOCTYPE html><html><head><meta charSet="utf-8"/><title>${subject}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f7f7f7;padding:24px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
<tr><td style="text-align:center;font-size:24px;font-weight:700;color:#6d28d9;">Waitlyze</td></tr>
<tr><td style="height:16px;"></td></tr>
<tr><td style="font-size:14px;color:#6b7280;">${previewText}</td></tr>
<tr><td style="height:24px;"></td></tr>
<tr><td><h1 style="margin:0;font-size:22px;">${header}</h1></td></tr>
<tr><td><h2 style="margin:8px 0 0;font-size:16px;font-weight:500;color:#6b7280;">${subHeader}</h2></td></tr>
<tr><td style="height:16px;"></td></tr>
<tr><td style="white-space:pre-wrap;font-size:14px;line-height:1.5;">${mainBody}</td></tr>
<tr><td style="height:16px;"></td></tr>
<tr><td style="font-size:12px;color:#6b7280;">${subBody}</td></tr>
<tr><td style="height:32px;"></td></tr>
<tr><td style="font-size:12px;color:#9ca3af;text-align:center;">Need help? Reply to this email • © ${new Date().getFullYear()} Waitlyze</td></tr>
</table>
</body></html>`;

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
  const header = replaceVars(tpl.header);
  const subHeader = replaceVars(tpl.subHeader);
  const mainBody = replaceVars(tpl.mainBody);
  const subBody = replaceVars(tpl.subBody);

  const htmlBody = `<!DOCTYPE html><html><head><meta charSet="utf-8"/><title>${subject}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f7f7f7;padding:24px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
<tr><td style="text-align:center;font-size:24px;font-weight:700;color:#6d28d9;">Waitlyze</td></tr>
<tr><td style="height:16px;"></td></tr>
<tr><td style="font-size:14px;color:#6b7280;">${previewText}</td></tr>
<tr><td style="height:24px;"></td></tr>
<tr><td><h1 style="margin:0;font-size:22px;">${header}</h1></td></tr>
<tr><td><h2 style="margin:8px 0 0;font-size:16px;font-weight:500;color:#6b7280;">${subHeader}</h2></td></tr>
<tr><td style="height:16px;"></td></tr>
<tr><td style="white-space:pre-wrap;font-size:14px;line-height:1.5;">${mainBody}</td></tr>
<tr><td style="height:16px;"></td></tr>
<tr><td style="font-size:12px;color:#6b7280;">${subBody}</td></tr>
<tr><td style="height:32px;"></td></tr>
<tr><td style="font-size:12px;color:#9ca3af;text-align:center;">Need help? Reply to this email • © ${new Date().getFullYear()} Waitlyze</td></tr>
</table>
</body></html>`;

  return { waitList, subject, htmlBody };
}

export async function sendSignupEmail({ waitListId, to }) {
  if (!process.env.PLUNK_SECRET_KEY) {
    return { success: false, message: "PLUNK_SECRET_KEY not configured" };
  }

  const signUp = await prisma.signUp.findFirst({
    where: { waitListId, email: to },
    select: { rank: true, id: true },
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

    return { success: true, message: "Email sent" };
  } catch (e) {
    console.error(e);
    return { success: true, message: "Signup stored (email send exception)" };
  }
}
