export const EMAIL_VOICE_OPTIONS = Object.freeze([
  { value: "founder_plain", label: "Founder personal plain-text" },
  { value: "product_editorial", label: "Polished product update" },
]);

export const LAUNCH_HORIZON_OPTIONS = Object.freeze([
  { value: "2_weeks", label: "Launching in ~2 weeks" },
  { value: "1_month", label: "Launching in ~30 days" },
  { value: "2_months", label: "Launching in 60+ days" },
]);

export const EMAIL_SEQUENCE_DEFAULTS = Object.freeze({
  productName: "RelayNote",
  valueProp: "automated async engineering standups drafted from pull requests",
  audience: "engineering leads",
  launchHorizon: "1_month",
  referralIncentive: "priority Wave 1 access at 3 verified referrals",
  senderName: "Alex",
  voice: "founder_plain",
});

const SPAM_PHRASES = [
  "free money",
  "act now",
  "100% free",
  "limited time offer",
  "click here now",
  "guaranteed",
  "urgent",
  "no obligation",
  "winner",
  "buy now",
  "cash bonus",
  "risk-free",
];

export function checkSpamTriggers(subject = "", body = "") {
  const combined = `${subject} ${body}`;
  const lower = combined.toLowerCase();
  const flags = [];

  for (const phrase of SPAM_PHRASES) {
    if (lower.includes(phrase)) {
      flags.push(`Contains spam-prone phrase "${phrase}"`);
    }
  }
  const exclCount = (combined.match(/!/g) || []).length;
  if (exclCount >= 4) {
    flags.push(`High exclamation count (${exclCount} "!" marks)`);
  }
  const allCapsWords = (subject.match(/\b[A-Z]{4,}\b/g) || []).filter(
    (w) => !["HTML", "SMTP", "DKIM", "DMARC", "BETA"].includes(w),
  );
  if (allCapsWords.length > 0) {
    flags.push(`ALL-CAPS word in subject (${allCapsWords.join(", ")})`);
  }

  return {
    clean: flags.length === 0,
    count: flags.length,
    flags,
  };
}

function toSimpleHtml(markdown) {
  return markdown
    .split(/\n\n+/)
    .map((para) => `<p>${para.replaceAll("\n", "<br />")}</p>`)
    .join("\n");
}

export function generateEmailSequence(rawInputs = {}) {
  const productName = String(rawInputs.productName || EMAIL_SEQUENCE_DEFAULTS.productName)
    .trim()
    .slice(0, 60);
  const valueProp = String(rawInputs.valueProp || EMAIL_SEQUENCE_DEFAULTS.valueProp)
    .trim()
    .slice(0, 160);
  const audience = String(rawInputs.audience || EMAIL_SEQUENCE_DEFAULTS.audience)
    .trim()
    .slice(0, 80);
  const launchHorizon = rawInputs.launchHorizon || EMAIL_SEQUENCE_DEFAULTS.launchHorizon;
  const referralIncentive = String(
    rawInputs.referralIncentive || EMAIL_SEQUENCE_DEFAULTS.referralIncentive,
  )
    .trim()
    .slice(0, 140);
  const senderName = String(rawInputs.senderName || EMAIL_SEQUENCE_DEFAULTS.senderName)
    .trim()
    .slice(0, 50);
  const voice = rawInputs.voice || EMAIL_SEQUENCE_DEFAULTS.voice;

  const isPlain = voice === "founder_plain";
  const horizonText =
    launchHorizon === "2_weeks"
      ? "in the next two weeks"
      : launchHorizon === "2_months"
        ? "over the next two months"
        : "in about 30 days";

  const signOff = isPlain
    ? `— ${senderName}, founder of ${productName}`
    : `The ${productName} team`;

  const emails = [
    {
      id: "verification",
      stage: "1. Verification",
      stageLabel: "Double Opt-In Verification",
      timing: "Immediate (transactional on signup)",
      planNote: "Included on Free & Pro with a connected, verified Resend sender",
      subjectOptions: [
        `Confirm your email for ${productName}`,
        `One click to lock in your ${productName} spot`,
      ],
      previewText: `Confirm your address so we can hold your spot on the ${productName} waitlist.`,
      markdownBody: `Hi there,

Click below to verify your email and lock in your spot for ${productName}:

[Confirm my email address]

Once confirmed, we will send your queue position and personal referral link. If you didn't request access, you can ignore this email.

${signOff}`,
    },
    {
      id: "welcome",
      stage: "2. Welcome + Share",
      stageLabel: "Welcome & Referral Status",
      timing: "Immediately after email verification",
      planNote: "Automated trigger requires Waitlyze Pro (draft saved free)",
      subjectOptions: [
        `You're #{{position}} on the ${productName} waitlist`,
        `Spot confirmed — how to unlock ${productName} early`,
      ],
      previewText: `You're currently #{{position}}. Share your link to move up the queue.`,
      markdownBody: isPlain
        ? `Hey — ${senderName} here. Thanks for confirming your spot for ${productName}.

You are currently **#{{position}}** in line. We're building ${productName} for ${audience} who want ${valueProp}, and we plan to open early waves ${horizonText}.

Want to move up faster? Share your personal link with a peer:
{{referral_link}}

Verified referrals unlock **${referralIncentive}**.

Quick question — hit reply and tell me the #1 bottleneck you're hoping ${productName} fixes first. I read every reply.

${signOff}`
        : `Welcome to the ${productName} early-access waitlist.

Your address is verified and your current queue position is **#{{position}}**. We are onboarding ${audience} in weekly waves starting ${horizonText}.

**Unlock priority access**
Share your personal link below to earn verified referral points toward ${referralIncentive}:

{{referral_link}}

Current verified referrals: **{{referrals_count}}**

${signOff}`,
    },
    {
      id: "milestone",
      stage: "3. Milestone",
      stageLabel: "Milestone Unlocked / Queue Jump",
      timing: "Triggered when a verified referral unlocks a tier",
      planNote: "Automated milestone trigger requires Waitlyze Pro",
      subjectOptions: [
        `You jumped ahead to #{{position}} on ${productName}`,
        `Unlocked: ${referralIncentive} ({{referrals_count}} referrals)`,
      ],
      previewText: `Your friend verified — you're now #{{position}} in line.`,
      markdownBody: `Nice work — another referral just verified their email.

- **New queue position:** #{{position}}
- **Verified referrals:** {{referrals_count}}
- **Status:** Progress toward ${referralIncentive}

Want to keep climbing before Wave 1 opens? Share your personal link again:
{{referral_link}}

Thanks for helping us introduce ${productName} to more ${audience}.

${signOff}`,
    },
    {
      id: "warmup",
      stage: "4. Warm-Up",
      stageLabel: "Pre-Launch Behind-the-Scenes Update",
      timing: "7–14 days before launch day (to verified opt-ins)",
      planNote: "One-time broadcast requires Waitlyze Pro",
      subjectOptions: [
        `Quick ${productName} progress update (+ early wave dates)`,
        `What we finished this week before ${productName} opens`,
      ],
      previewText: `Wave 1 invites are almost ready — here's a quick look at what's shipping.`,
      markdownBody: `Quick update as we get close to opening ${productName} ${horizonText}.

Over the past two weeks we finished polishing ${valueProp} with a handful of early testers. Here is what happens next:

1. Wave 1 invites go out to top-ranked verified subscribers first.
2. You are currently sitting at **#{{position}}** with **{{referrals_count}}** verified referrals.
3. If you want to jump into Wave 1, your referral link is still active: {{referral_link}}

More soon — thanks for sticking with us from the early days.

${signOff}`,
    },
    {
      id: "launch_day",
      stage: "5. Launch Day",
      stageLabel: "Launch Day / Beta Invite Access",
      timing: "Launch day (staged by queue cohort)",
      planNote: "Broadcast / invite send requires Waitlyze Pro",
      subjectOptions: [
        `Your ${productName} invite is ready`,
        `Doors are open: start using ${productName} today`,
      ],
      previewText: `Your early-access wave is live — claim your workspace now.`,
      markdownBody: `It's time — your early-access spot (#{{position}}) for ${productName} is now open.

Start here: [Claim your ${productName} workspace]

You're part of our founding wave of ${audience}, which means direct support and priority on anything you need as you set up ${valueProp}.

If anything feels rough in your first 5 minutes, reply directly to this email and let me know.

${signOff}`,
    },
  ];

  const enriched = emails.map((email) => ({
    ...email,
    htmlBody: toSimpleHtml(email.markdownBody),
    spamCheck: checkSpamTriggers(email.subjectOptions[0], email.markdownBody),
  }));

  const fullMarkdown = enriched
    .map(
      (email) =>
        `## ${email.stageLabel}\n- **Timing:** ${email.timing}\n- **Subject:** ${email.subjectOptions[0]}\n- **Preview text:** ${email.previewText}\n\n${email.markdownBody}`,
    )
    .join("\n\n---\n\n");

  return {
    inputs: {
      productName,
      valueProp,
      audience,
      launchHorizon,
      referralIncentive,
      senderName,
      voice,
    },
    emails: enriched,
    fullMarkdown,
  };
}
