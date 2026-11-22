import { TEMPLATE_IDS } from "@/lib/templates/gallery.mjs";

export const COPY_BUILDER_OPTIONS = Object.freeze({
  launchMotions: [
    { value: "early_access", label: "Early access waitlist" },
    { value: "referral_queue", label: "Verified referral queue" },
    { value: "beta_application", label: "Private beta application" },
    { value: "preorder", label: "Pre-order / First batch drop" },
    { value: "event", label: "Live cohort / Workshop" },
  ],
  proofTypes: [
    { value: "none_honest", label: "None yet — keep honest (no fake proof)" },
    { value: "demo_screenshot", label: "Product demo or screenshot" },
    { value: "founder_credentials", label: "Founder / team background" },
    { value: "beta_quote", label: "Early tester feedback" },
    { value: "real_metric", label: "Real measured benchmark or number" },
  ],
  tones: [
    { value: "technical_direct", label: "Technical & direct" },
    { value: "clean_saas", label: "Clean SaaS" },
    { value: "bold_consumer", label: "Bold consumer" },
    { value: "editorial", label: "Calm editorial" },
  ],
  templates: TEMPLATE_IDS.filter((id) => id !== "blank").map((id) => ({
    value: id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
  })),
});

export const COPY_BUILDER_DEFAULTS = Object.freeze({
  productName: "RelayNote",
  oneLiner: "Async engineering standups captured directly from pull requests and commits.",
  audience: "10–60 person engineering teams",
  painPoint: "daily status meetings interrupt deep work and go stale in Slack",
  uniqueMechanism: "drafting clean daily updates automatically from merged PRs and Linear tickets",
  launchMotion: "early_access",
  proofType: "none_honest",
  proofDetail: "",
  tone: "clean_saas",
  templateId: "saas",
});

function cleanText(value, fallback, maxLen) {
  const trimmed = String(value ?? "").trim();
  return (trimmed || fallback).slice(0, maxLen);
}

function ctaForMotion(motion) {
  switch (motion) {
    case "referral_queue":
      return "Claim your spot";
    case "beta_application":
      return "Apply for private beta";
    case "preorder":
      return "Reserve batch one";
    case "event":
      return "Save your seat";
    default:
      return "Request early access";
  }
}

function eyebrowForMotion(motion, productName) {
  switch (motion) {
    case "referral_queue":
      return `${productName} · Priority waitlist`;
    case "beta_application":
      return `${productName} · Private beta`;
    case "preorder":
      return `${productName} · First batch`;
    case "event":
      return `${productName} · Live cohort`;
    default:
      return `${productName} · Early access`;
  }
}

export function generateWaitlistCopy(rawInputs = {}) {
  const productName = cleanText(rawInputs.productName, COPY_BUILDER_DEFAULTS.productName, 60);
  const oneLiner = cleanText(rawInputs.oneLiner, COPY_BUILDER_DEFAULTS.oneLiner, 160);
  const audience = cleanText(rawInputs.audience, COPY_BUILDER_DEFAULTS.audience, 80);
  const painPoint = cleanText(rawInputs.painPoint, COPY_BUILDER_DEFAULTS.painPoint, 140);
  const uniqueMechanism = cleanText(
    rawInputs.uniqueMechanism,
    COPY_BUILDER_DEFAULTS.uniqueMechanism,
    140,
  );
  const launchMotion = rawInputs.launchMotion || COPY_BUILDER_DEFAULTS.launchMotion;
  const proofType = rawInputs.proofType || COPY_BUILDER_DEFAULTS.proofType;
  const proofDetail = String(rawInputs.proofDetail ?? "")
    .trim()
    .slice(0, 180);
  const tone = rawInputs.tone || COPY_BUILDER_DEFAULTS.tone;
  const templateId = TEMPLATE_IDS.includes(rawInputs.templateId) ? rawInputs.templateId : "saas";

  const buttonText = ctaForMotion(launchMotion);
  const eyebrow = eyebrowForMotion(launchMotion, productName);
  const privacyNote =
    "One email when your invite opens. Confirm your address to lock in your spot—unsubscribe anytime.";

  const toneSuffix =
    tone === "technical_direct"
      ? "No fluff, no noisy setup."
      : tone === "bold_consumer"
        ? "Built to feel effortless from day one."
        : tone === "editorial"
          ? "Thoughtfully built for calm, repeatable work."
          : "Built for teams that want signal without extra busywork.";

  const heroDirections = [
    {
      id: "value",
      label: "Value-led",
      eyebrow,
      heading: `${oneLiner.replace(/\.$/, "")}.`,
      subheadline: `${productName} is built for ${audience} who want results by ${uniqueMechanism}. ${toneSuffix}`,
      buttonText,
      privacyNote,
    },
    {
      id: "problem",
      label: "Problem-first",
      eyebrow,
      heading: `Stop letting ${painPoint}.`,
      subheadline: `${productName} gives ${audience} a calmer alternative—${uniqueMechanism}. Join early to help shape v1.`,
      buttonText,
      privacyNote,
    },
    {
      id: "mechanism",
      label: "Mechanism-led",
      eyebrow,
      heading: `${productName}: built for ${audience} by ${uniqueMechanism}.`,
      subheadline: `Skip the friction when ${painPoint}. Reserve early access and get invited in our next onboarding wave.`,
      buttonText,
      privacyNote,
    },
  ];

  const benefits = [
    {
      title: `Built specifically for ${audience}`,
      body: `Every default in ${productName} is tuned for how ${audience} actually work—so you do not waste a week configuring templates.`,
    },
    {
      title: "Fix the root bottleneck",
      body: `Instead of patching around the fact that ${painPoint}, ${productName} removes the manual loop altogether.`,
    },
    {
      title: "Clear workflow from day one",
      body: `Works by ${uniqueMechanism}, giving your team visibility without adding another meeting or spreadsheet.`,
    },
  ];

  let proofSection;
  if (proofType === "none_honest") {
    proofSection = {
      honestPlaceholder: true,
      heading: "Built in the open with our first wave",
      body: `${productName} is in active pre-launch development. Early waitlist members get direct access to our roadmap, onboarding calls, and founding pricing—no invented testimonials or inflated counters.`,
    };
  } else if (proofType === "demo_screenshot") {
    proofSection = {
      honestPlaceholder: false,
      heading: "See how it works before you sign up",
      body:
        proofDetail ||
        `[Attach a 30-second product walkthrough or crisp UI screenshot of ${productName} in action here.]`,
    };
  } else if (proofType === "founder_credentials") {
    proofSection = {
      honestPlaceholder: false,
      heading: "Why we are building this",
      body:
        proofDetail ||
        `[Add 2 sentences on your team's real experience solving this problem for ${audience}.]`,
    };
  } else if (proofType === "beta_quote") {
    proofSection = {
      honestPlaceholder: false,
      heading: "Early tester notes",
      body:
        proofDetail ||
        `[Paste one real, attributed quote from a beta tester who tried ${productName}—include their first name and role.]`,
    };
  } else {
    proofSection = {
      honestPlaceholder: false,
      heading: "Measured early signal",
      body:
        proofDetail ||
        `[Share one verifiable metric you have measured—for example, setup time or workflow latency—with date and context.]`,
    };
  }

  const faqs = [
    {
      question: `When will ${productName} open access?`,
      answer:
        "We onboard verified waitlist members in weekly batches so every new team gets direct support. Confirm your email after joining to stay eligible for the next wave.",
    },
    {
      question: `Who is ${productName} designed for?`,
      answer: `${productName} is built for ${audience} looking to solve the problem where ${painPoint}.`,
    },
    {
      question: "How does priority access work?",
      answer:
        launchMotion === "referral_queue"
          ? "After you verify your email, you receive a personal referral link. Each teammate or peer who joins and confirms moves you higher in the onboarding queue."
          : "Invites go out in signup order, with priority given to verified early members who share feedback or invite a colleague.",
    },
    {
      question: "Will you spam my inbox or share my email?",
      answer:
        "No. We send one verification link now, occasional milestone updates if you opt in, and your launch invite when your batch opens. Unsubscribe in one click anytime.",
    },
  ];

  const postSignup = {
    confirmationHeading: `Check your inbox to confirm your ${productName} spot.`,
    confirmationBody:
      "Click the confirmation link we just sent so your address is verified. Once verified, share your personal link below to move up the early-access queue.",
    referralPrompt: `Know someone else among ${audience}? Share your personal link—verified referrals earn priority queue points.`,
    sharePostText: `Just joined the early-access list for ${productName} — ${oneLiner}`,
  };

  const primaryHero = heroDirections[0];
  const markdownExport = [
    `# ${productName} — Waitlist Landing Page Copy`,
    "",
    `## Hero (Value-Led)`,
    `- **Eyebrow:** ${primaryHero.eyebrow}`,
    `- **Headline:** ${primaryHero.heading}`,
    `- **Subheadline:** ${primaryHero.subheadline}`,
    `- **CTA:** ${primaryHero.buttonText}`,
    `- **Privacy microcopy:** ${primaryHero.privacyNote}`,
    "",
    `## Alternate Headlines`,
    `- **Problem-first:** ${heroDirections[1].heading}`,
    `- **Mechanism-led:** ${heroDirections[2].heading}`,
    "",
    `## Benefits`,
    ...benefits.map((b) => `- **${b.title}:** ${b.body}`),
    "",
    `## Proof (${proofSection.heading})`,
    proofSection.body,
    "",
    `## FAQs`,
    ...faqs.map((f) => `### ${f.question}\n${f.answer}`),
    "",
    `## Post-Signup & Referral Copy`,
    `- **Confirmation:** ${postSignup.confirmationHeading}`,
    `- **Share prompt:** ${postSignup.referralPrompt}`,
    `- **Pre-filled social post:** "${postSignup.sharePostText}"`,
  ].join("\n");

  return {
    inputs: {
      productName,
      oneLiner,
      audience,
      painPoint,
      uniqueMechanism,
      launchMotion,
      proofType,
      proofDetail,
      tone,
      templateId,
    },
    heroDirections,
    benefits,
    proofSection,
    faqs,
    postSignup,
    markdownExport,
  };
}
