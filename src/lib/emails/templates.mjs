import "server-only";
import { legacyEmailContent } from "@/lib/email/composer.mjs";
import prisma from "@/lib/prisma";

const TYPE_MAP = {
  signup: "SIGNUP",
  offboarding: "OFFBOARDING",
  "referral-congrats": "REFERRAL_CONGRATS",
  "launch-invite": "LAUNCH_INVITE",
};

const TYPE_KEY = {
  SIGNUP: "signup",
  OFFBOARDING: "offboarding",
  REFERRAL_CONGRATS: "referral-congrats",
  LAUNCH_INVITE: "launch-invite",
};

const DEFAULTS = {
  signup: {
    subject: "You're on the {{waitlist}} list",
    previewText: "Your place is confirmed. Here's your personal link.",
    header: "You're on the list.",
    subHeader: "Welcome to {{waitlist}}",
    mainBody:
      "Thanks for joining {{waitlist}}. You're currently #{{position}} in line.\n\nInvite a friend with your personal link: {{referral_link}}",
    subBody: "We'll be in touch when there's news.",
  },
  offboarding: {
    subject: "A note from {{waitlist}}",
    previewText: "An update about your place on the waitlist.",
    header: "A note about your place",
    subHeader: "{{waitlist}}",
    mainBody:
      "We're writing with an update about your place on {{waitlist}}. Add the next step and any dates here before sending.",
    subBody: "Questions? Reply to this email.",
  },
  "referral-congrats": {
    subject: "You did it, {{name}} - {{referral_count}} friends joined {{waitlist}}",
    previewText: "Your referrals are moving you up the list.",
    header: "You're climbing the list.",
    subHeader: "{{referral_count}} friends joined through you",
    mainBody:
      "Hi {{name}},\n\n{{referral_count}} people have joined {{waitlist}} through your link - you're now #{{position}} with {{points}} points.\n\nKeep sharing your personal link: {{referral_link}}",
    subBody: "Every referral moves you closer to launch-day rewards.",
  },
  "launch-invite": {
    subject: "You're in, {{name}} - {{waitlist}} is live",
    previewText: "Claim your spot: your personal invite is inside.",
    header: "We're live.",
    subHeader: "Your invite to {{waitlist}}",
    mainBody:
      "Hi {{name}},\n\n{{waitlist}} is officially live and you're #{{position}} in line with {{points}} points.\n\nGet started here: {{waitlist_url}}\n\nYour personal link still works for late friends: {{referral_link}}",
    subBody: "Questions? Reply to this email.",
  },
};

export function emailTemplateType(templateType) {
  return TYPE_MAP[templateType];
}

export function normalizeEmailTemplate(record) {
  return {
    id: record.id,
    type: TYPE_KEY[record.type] || "signup",
    subject: record.subject,
    previewText: record.previewText,
    header: record.header,
    subHeader: record.subHeader,
    mainBody: record.mainBody,
    subBody: record.subBody,
    editorDocument: record.editorDocument,
    renderedHtml: record.renderedHtml,
    renderedText: record.renderedText,
    starterHtml: record.editorDocument ? null : legacyEmailContent(record),
  };
}

export async function getOrCreateTemplatesForCampaign(waitListId, scope) {
  const records = await prisma.emailTemplate.findMany({
    where: { waitListId, waitList: scope },
  });

  const byType = {};
  records.forEach((record) => {
    byType[record.type] = record;
  });

  const result = {};
  for (const key of Object.keys(TYPE_MAP)) {
    const enumType = TYPE_MAP[key];
    if (!byType[enumType]) {
      result[key] = await prisma.emailTemplate.create({
        data: {
          waitList: { connect: { id: waitListId, ...scope } },
          type: enumType,
          ...DEFAULTS[key],
        },
      });
    } else {
      result[key] = byType[enumType];
    }
  }

  return {
    signup: normalizeEmailTemplate(result.signup),
    offboarding: normalizeEmailTemplate(result.offboarding),
    "referral-congrats": normalizeEmailTemplate(result["referral-congrats"]),
    "launch-invite": normalizeEmailTemplate(result["launch-invite"]),
  };
}
