import { z } from "zod";

const text = (max) => z.string().max(max);
const hex = z.string().regex(/^#[0-9a-f]{6}$/i, "Choose a six-digit hex color.");
// Public pages render these URLs in <img> tags. Allow only TLS, site-relative,
// or inline data URLs so a stored value can never downgrade the page to http
// or smuggle an active-content scheme.
const imageUrl = z
  .string()
  .max(500)
  .trim()
  .refine((value) => value === "" || /^(https:\/\/|data:image\/|\/)/i.test(value), {
    message: "Use an https://, site-relative, or data:image URL.",
  });
const blockId = z
  .string()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9-]+$/i);
// Builder links render as public <a href> values. Reject active-content schemes
// (javascript:, data:, vbscript:) at the trust boundary; rendering also
// sanitizes stored values that predate this check.
const href = z
  .string()
  .max(240)
  .refine(
    (value) => !/^\s*(javascript|data|vbscript|file|blob):/i.test(value),
    "Links must start with #, /, or http(s).",
  );
const base = { id: blockId, visible: z.boolean(), variant: z.string().min(1).max(40) };
const item = z.strictObject({ title: text(80), body: text(280) });

const navigation = z.strictObject({
  ...base,
  type: z.literal("navigation"),
  brand: text(80),
  links: z.array(z.strictObject({ label: text(40), href })).max(5),
  buttonText: text(40),
});
const heroSchema = z.strictObject({
  ...base,
  type: z.literal("hero"),
  eyebrow: text(80),
  heading: text(140),
  body: text(700),
  showForm: z.boolean(),
});
const features = z.strictObject({
  ...base,
  type: z.literal("features"),
  heading: text(120),
  items: z.array(item).min(1).max(8),
});
const steps = z.strictObject({
  ...base,
  type: z.literal("steps"),
  heading: text(120),
  items: z.array(item).min(1).max(6),
});
const logoItem = z.union([
  text(50),
  z.strictObject({ label: text(50), imageUrl: imageUrl.default("") }),
]);
const logos = z.strictObject({
  ...base,
  type: z.literal("logos"),
  heading: text(120),
  items: z.array(logoItem).min(2).max(8),
});
const stats = z.strictObject({
  ...base,
  type: z.literal("stats"),
  items: z
    .array(z.strictObject({ value: text(30), label: text(80) }))
    .min(1)
    .max(6),
});
const testimonials = z.strictObject({
  ...base,
  type: z.literal("testimonials"),
  heading: text(120),
  items: z
    .array(z.strictObject({ quote: text(360), name: text(80), role: text(100) }))
    .min(1)
    .max(6),
});
const faq = z.strictObject({
  ...base,
  type: z.literal("faq"),
  heading: text(120),
  items: z
    .array(z.strictObject({ question: text(140), answer: text(500) }))
    .min(1)
    .max(10),
});
const media = z.strictObject({
  ...base,
  type: z.literal("media"),
  heading: text(120),
  body: text(360),
  imageUrl,
  imageAlt: text(160),
});
const formBlock = z.strictObject({
  ...base,
  type: z.literal("form"),
  heading: text(120),
  body: text(360),
});
const signupCount = z.strictObject({
  ...base,
  type: z.literal("signupCount"),
  prefix: text(80),
  suffix: text(80),
});
const referralRewards = z.strictObject({
  ...base,
  type: z.literal("referralRewards"),
  heading: text(120),
  items: z
    .array(z.strictObject({ referrals: z.number().int().min(1).max(100000), reward: text(120) }))
    .min(1)
    .max(8),
});
const cta = z.strictObject({
  ...base,
  type: z.literal("cta"),
  heading: text(120),
  body: text(360),
  buttonText: text(40),
});
const footer = z.strictObject({
  ...base,
  type: z.literal("footer"),
  note: text(220),
  links: z.array(z.strictObject({ label: text(40), href })).max(6),
});
// Phase-4 rewards engine (stream A): per-waitlist points + display settings.
// Zero-config defaults preserve today's behavior (50/30/5, no offset, counts
// visible). The rewards ladder itself reuses the founder-editable
// `referralRewards` content blocks as its single source of truth.
const rewardCustomEvent = z.strictObject({
  // Builder-local stable id for React keys (never sent to the API). Optional
  // so snapshots saved before it existed still parse.
  id: z.string().max(40).optional(),
  key: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/i, "Use letters, numbers, or hyphens."),
  label: text(80),
  points: z.number().int().min(0).max(100000),
});
const rewardsSchema = z.strictObject({
  pointsSignup: z.number().int().min(0).max(100000).default(50),
  pointsReferral: z.number().int().min(0).max(100000).default(30),
  pointsFollow: z.number().int().min(0).max(100000).default(5),
  customEvents: z.array(rewardCustomEvent).max(12).default([]),
  positionOffset: z.number().int().min(0).max(1000000).default(0),
  hideCounts: z.boolean().default(false),
  showPoints: z.boolean().default(true),
  showProgress: z.boolean().default(true),
});

export const sectionSchema = z.discriminatedUnion("type", [
  navigation,
  heroSchema,
  logos,
  features,
  steps,
  stats,
  testimonials,
  faq,
  media,
  formBlock,
  signupCount,
  referralRewards,
  cta,
  footer,
]);

export const RADIUS_IDS = ["sharp", "soft", "round", "pill"];
const fontFamily = z
  .string()
  .min(1)
  .max(80)
  .trim()
  .regex(/^[\w -]+$/, "Use letters, numbers, spaces, or hyphens.");
const headingPx = z.preprocess(
  (value) =>
    typeof value === "string" ? ({ small: 40, medium: 48, large: 60 }[value] ?? value) : value,
  z.number().min(12).max(160).default(48),
);
const bodyPx = z.preprocess(
  (value) =>
    typeof value === "string" ? ({ small: 14, medium: 16, large: 18 }[value] ?? value) : value,
  z.number().min(12).max(160).default(16),
);
export const templateFormSchema = z.strictObject({
  fields: z.tuple([z.literal("email")]),
  label: text(80),
  placeholder: text(120),
  buttonText: text(40),
  layout: z.enum(["inline", "stacked"]),
  requireConsent: z.boolean(),
  consentLabel: text(240),
  verification: z.boolean(),
});
const brandSchema = z.strictObject({
  headingFont: fontFamily,
  bodyFont: fontFamily,
  pageBackground: hex,
  surfaceColor: hex,
  textColor: hex,
  mutedColor: hex,
  accentColor: hex,
  buttonColor: hex,
  buttonTextColor: hex,
  inputBackground: hex,
  inputBorder: hex,
  inputTextColor: hex,
  radius: z.enum(RADIUS_IDS),
  logo: imageUrl.default(""),
  showPoweredBy: z.boolean().default(true),
  headingSize: headingPx,
  bodySize: bodyPx,
});
const statusPageSchema = z.strictObject({
  heading: text(120),
  body: text(500),
  pendingHeading: text(120),
  pendingBody: text(500),
  showPosition: z.boolean(),
  showReferralLink: z.boolean(),
  showReferralCount: z.boolean(),
  shareMessage: text(280),
  shareChannels: z.array(z.enum(["x", "instagram", "linkedin", "whatsapp", "email"])).max(5),
  iconStyle: z.enum(["filled", "soft"]).default("filled"),
  layout: z.enum(["centered", "card"]).default("centered"),
});
const seoSchema = z.strictObject({
  title: text(70),
  description: text(180),
  image: z.string().max(500),
  indexable: z.boolean(),
});

const v2SnapshotSchema = z
  .strictObject({
    schemaVersion: z.literal(2),
    templateId: z.enum([
      "simple",
      "saas",
      "ai",
      "mobile",
      "creator",
      "community",
      "event",
      "commerce",
      "developer",
      "podcast",
      "restaurant",
      "fitness",
      "nonprofit",
      "blank",
    ]),
    templateVersion: z.number().int().positive(),
    brand: brandSchema,
    sections: z.array(sectionSchema).min(1).max(24),
    form: templateFormSchema,
    statusPage: statusPageSchema,
    seo: seoSchema,
    // New key, not required: older snapshots parse with zero-config defaults.
    rewards: rewardsSchema.default({}),
  })
  .superRefine((value, ctx) => {
    const visibleForms = value.sections.filter(
      (section) => section.type === "form" && section.visible,
    ).length;
    const heroForms = value.sections.filter(
      (section) => section.type === "hero" && section.visible && section.showForm,
    ).length;
    if (visibleForms + heroForms < 1)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a visible signup form before publishing.",
        path: ["sections"],
      });
    const ids = new Set();
    value.sections.forEach((section, index) => {
      if (ids.has(section.id))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Every block needs a unique id.",
          path: ["sections", index, "id"],
        });
      ids.add(section.id);
    });
  });

const defaultBrand = {
  headingFont: "manrope",
  bodyFont: "hanken",
  pageBackground: "#f7f8f2",
  surfaceColor: "#ffffff",
  textColor: "#182018",
  mutedColor: "#657064",
  accentColor: "#c6fe1e",
  buttonColor: "#182018",
  buttonTextColor: "#f8faf3",
  inputBackground: "#ffffff",
  inputBorder: "#cbd2c7",
  inputTextColor: "#182018",
  radius: "soft",
  headingSize: 48,
  bodySize: 16,
};
const defaultForm = {
  fields: ["email"],
  label: "Email address",
  placeholder: "you@company.com",
  buttonText: "Join the waitlist",
  layout: "inline",
  requireConsent: false,
  consentLabel: "Send me launch updates. I can unsubscribe anytime.",
  verification: true,
};
const defaultStatusPage = {
  heading: "You're on the list.",
  body: "We'll keep you close to the launch.",
  pendingHeading: "Check your inbox",
  pendingBody: "Confirm your email to secure your place.",
  showPosition: true,
  showReferralLink: true,
  showReferralCount: false,
  shareMessage: "I joined the waitlist. Come with me:",
  shareChannels: ["x", "instagram", "linkedin", "whatsapp", "email"],
  iconStyle: "filled",
  layout: "centered",
};
const defaultSeo = { title: "", description: "", image: "", indexable: false };
export const templateSnapshotSchema = v2SnapshotSchema;

const makeSection = (templateId, type, index, props = {}, variant = "default") => ({
  id: `${templateId}-${type}-${index}`,
  type,
  visible: true,
  variant,
  ...props,
});
const form = (id, index = 1, props = {}) =>
  makeSection(id, "form", index, {
    heading: "Get early access",
    body: "Join the people hearing about the launch first.",
    ...props,
  });
const hero = (id, heading, body, props = {}) =>
  makeSection(
    id,
    "hero",
    0,
    { eyebrow: "EARLY ACCESS", heading, body, showForm: false, ...props },
    "split",
  );
const nav = (id, brand, links, buttonText) =>
  makeSection(id, "navigation", 0, { brand, links, buttonText });
const benefits = (id, heading, items, variant = "columns") =>
  makeSection(id, "features", 1, { heading, items }, variant);

const definitions = [
  {
    id: "simple",
    name: "Simple form",
    description: "A focused one-screen signup with no extra sections.",
    category: "Start fast",
    form: { buttonText: "Notify me", layout: "inline" },
    sections: [
      hero(
        "simple",
        "Something useful is taking shape.",
        "Join the waitlist and be first to know when it is ready.",
        {
          showForm: true,
          variant: "centered",
        },
      ),
    ],
  },
  {
    id: "saas",
    name: "SaaS beta",
    description: "A screenshot-led product page with proof and answers.",
    category: "Software",
    brand: {
      pageBackground: "#ffffff",
      surfaceColor: "#f2f5ff",
      textColor: "#101828",
      mutedColor: "#5b6478",
      accentColor: "#3b4bff",
      buttonColor: "#101828",
      buttonTextColor: "#ffffff",
      inputBackground: "#ffffff",
      inputBorder: "#d5dbe8",
      inputTextColor: "#101828",
      radius: "soft",
    },
    form: { buttonText: "Join the beta", layout: "inline" },
    sections: [
      nav(
        "saas",
        "Northloop",
        [
          { label: "Product", href: "#" },
          { label: "Method", href: "#" },
          { label: "Pricing", href: "#" },
        ],
        "Join beta",
      ),
      hero(
        "saas",
        "A calmer way to run your work.",
        "One place for the work your team keeps rebuilding in spreadsheets. Invite-only until spring.",
      ),
      makeSection(
        "saas",
        "media",
        1,
        {
          heading: "See it before you sign up",
          body: "A live look at the workspace your team will open every morning.",
          imageUrl: "",
          imageAlt: "",
        },
        "browser",
      ),
      makeSection("saas", "logos", 2, {
        heading: "Powering modern teams",
        items: ["Acme", "Lumen", "Hexlab", "Framely", "Osmo"],
      }),
      benefits("saas", "Why teams switch", [
        {
          title: "Cut the status meetings",
          body: "Weekly updates write themselves from the work already done.",
        },
        {
          title: "Find anything fast",
          body: "Every doc, decision and file searchable in one place.",
        },
        {
          title: "Roll out in a day",
          body: "Import from spreadsheets and invite the team before lunch.",
        },
      ]),
      makeSection("saas", "stats", 3, {
        items: [
          { value: "12 min", label: "median setup time" },
          { value: "4.9/5", label: "beta tester rating" },
          { value: "99.99%", label: "uptime guaranteed" },
        ],
      }),
      form("saas", 4, {
        heading: "Get your beta invite",
        body: "Tell us where to send your invite. Founding teams lock early pricing.",
        variant: "card",
      }),
      makeSection("saas", "faq", 5, {
        heading: "Before you join",
        items: [
          {
            question: "When does the beta open?",
            answer: "We invite new teams every Monday and email your invite the Friday before.",
          },
          {
            question: "Will it be free to try?",
            answer: "Yes. Every beta team gets three months free before choosing a plan.",
          },
          {
            question: "Can we migrate our data?",
            answer:
              "Yes. Import boards, docs and files from spreadsheets or your current tool in minutes.",
          },
        ],
      }),
    ],
  },
  {
    id: "ai",
    name: "AI product",
    description: "A dark, demo-led page for an AI launch.",
    category: "Software",
    brand: {
      headingFont: "bricolage",
      bodyFont: "figtree",
      pageBackground: "#0b0f0e",
      surfaceColor: "#151c1a",
      textColor: "#edf3ef",
      mutedColor: "#9fb3a8",
      accentColor: "#7df9c6",
      buttonColor: "#7df9c6",
      buttonTextColor: "#0b0f0e",
      inputBackground: "#151c1a",
      inputBorder: "#2e3b35",
      inputTextColor: "#edf3ef",
      radius: "round",
    },
    form: { buttonText: "Get early access", layout: "stacked" },
    sections: [
      hero(
        "ai",
        "Do the thinking that matters. Delegate the rest.",
        "A focused assistant that turns the work around your work into clear next steps.",
        {
          eyebrow: "RESEARCH PREVIEW",
          showForm: true,
        },
      ),
      makeSection(
        "ai",
        "media",
        1,
        {
          heading: "Watch it work",
          body: "Two minutes of a real workflow: inbox to action plan, no editing.",
          imageUrl: "",
          imageAlt: "",
        },
        "wide",
      ),
      benefits(
        "ai",
        "Built for the overload",
        [
          {
            title: "Triage the noise",
            body: "It reads everything and hands you the three things that matter.",
          },
          {
            title: "Draft the first pass",
            body: "Replies, summaries and plans start at eighty percent done.",
          },
          {
            title: "Keep you in charge",
            body: "Nothing sends, books or deletes without your word.",
          },
        ],
        "list",
      ),
      makeSection("ai", "stats", 2, {
        items: [
          { value: "40 hrs", label: "saved every month" },
          { value: "12", label: "integrations at launch" },
          { value: "100%", label: "your data stays yours" },
        ],
      }),
      makeSection("ai", "cta", 3, {
        heading: "Be first in when the preview opens",
        body: "Cohorts open monthly. Waitlist members choose their start date.",
        buttonText: "Claim access",
      }),
    ],
  },
  {
    id: "mobile",
    name: "Mobile app",
    description: "A playful launch page with a phone mock and tester love.",
    category: "Consumer",
    brand: {
      headingFont: "Baloo 2",
      bodyFont: "hanken",
      pageBackground: "#fdf3e7",
      surfaceColor: "#fffaf2",
      textColor: "#2a1503",
      mutedColor: "#8a6f52",
      accentColor: "#ef4b0b",
      buttonColor: "#ef4b0b",
      buttonTextColor: "#ffffff",
      inputBackground: "#fffaf2",
      inputBorder: "#e7d2b2",
      inputTextColor: "#2a1503",
      radius: "pill",
    },
    form: { buttonText: "Get early access", layout: "stacked" },
    sections: [
      hero(
        "mobile",
        "A better rhythm for every day.",
        "A thoughtful new app designed to make the small things feel easier. iOS and Android at launch.",
        {
          eyebrow: "COMING SOON",
          variant: "centered",
        },
      ),
      makeSection(
        "mobile",
        "media",
        1,
        {
          heading: "Made for the screen in your hand",
          body: "Your lists, habits and reminders in one calm place.",
          imageUrl: "",
          imageAlt: "",
        },
        "phone",
      ),
      makeSection("mobile", "stats", 2, {
        items: [
          { value: "120k", label: "on the early list" },
          { value: "4.8", label: "average tester rating" },
          { value: "32", label: "launch cities" },
        ],
      }),
      makeSection(
        "mobile",
        "testimonials",
        3,
        {
          heading: "Loved by early testers",
          items: [
            {
              quote: "It replaced three apps on my home screen in a week.",
              name: "Priya Nair",
              role: "Beta tester",
            },
            {
              quote: "The rare app my whole family actually opened daily.",
              name: "Tomás Rivera",
              role: "Beta tester",
            },
          ],
        },
        "editorial",
      ),
      makeSection("mobile", "signupCount", 4, {
        prefix: "Join",
        suffix: "people already waiting",
      }),
      form("mobile", 5, {
        heading: "Be first to download",
        body: "One message on launch day, plus a founding-member badge in the app.",
        variant: "card",
      }),
    ],
  },
  {
    id: "creator",
    name: "Creator or newsletter",
    description: "An editorial signup page with reader proof and consent.",
    category: "Audience",
    brand: {
      headingFont: "DM Serif Display",
      bodyFont: "hanken",
      pageBackground: "#faf5ea",
      surfaceColor: "#fffdf7",
      textColor: "#262015",
      mutedColor: "#7c7261",
      accentColor: "#9c2b4e",
      buttonColor: "#262015",
      buttonTextColor: "#faf5ea",
      inputBackground: "#fffdf7",
      inputBorder: "#ddd2ba",
      inputTextColor: "#262015",
      radius: "sharp",
    },
    form: {
      buttonText: "Subscribe",
      layout: "stacked",
      requireConsent: true,
      consentLabel: "Email me the weekly letter. Unsubscribe anytime.",
    },
    sections: [
      hero(
        "creator",
        "One useful idea, delivered well.",
        "Field notes for people building thoughtful products and businesses. Read by 8,000 founders.",
        {
          eyebrow: "A WEEKLY LETTER",
          variant: "centered",
        },
      ),
      benefits(
        "creator",
        "Inside every issue",
        [
          {
            title: "One tactic",
            body: "A growth or product tactic you can try the same day.",
          },
          {
            title: "One teardown",
            body: "A real landing page or funnel, taken apart line by line.",
          },
          {
            title: "One question",
            body: "Something worth arguing about with your co-founder.",
          },
        ],
        "list",
      ),
      makeSection(
        "creator",
        "testimonials",
        2,
        {
          heading: "Why readers stay",
          items: [
            {
              quote: "The rare update I save and return to. It paid for itself in a month.",
              name: "Maya Chen",
              role: "Founder, Loopwork",
            },
            {
              quote: "I forward almost every issue to my team.",
              name: "Jonas Weber",
              role: "Product lead",
            },
          ],
        },
        "editorial",
      ),
      form("creator", 3, {
        heading: "Read the next issue",
        body: "Occasional, considered, and easy to leave. Free forever.",
        variant: "card",
      }),
      makeSection("creator", "footer", 4, {
        note: "Published independently. No noise, no rented attention.",
        links: [
          { label: "Archive", href: "#" },
          { label: "About", href: "#" },
          { label: "RSS", href: "#" },
        ],
      }),
    ],
  },
  {
    id: "community",
    name: "Community",
    description: "An invite-only page with member proof and referral rewards.",
    category: "Audience",
    brand: {
      headingFont: "archivo",
      bodyFont: "hanken",
      pageBackground: "#efe8f7",
      surfaceColor: "#f8f4fd",
      textColor: "#241a33",
      mutedColor: "#6f6490",
      accentColor: "#6d28a8",
      buttonColor: "#6d28a8",
      buttonTextColor: "#ffffff",
      inputBackground: "#f8f4fd",
      inputBorder: "#d3c8ea",
      inputTextColor: "#241a33",
      radius: "round",
    },
    form: { buttonText: "Claim your invite", layout: "inline" },
    sections: [
      hero(
        "community",
        "Find the people building beside you.",
        "A small, useful community for honest conversations and practical support. No pitching, no lurking.",
        {
          eyebrow: "INVITE ONLY",
          showForm: true,
        },
      ),
      makeSection("community", "stats", 1, {
        items: [
          { value: "2.4k", label: "members and counting" },
          { value: "18", label: "cities with chapters" },
          { value: "92%", label: "stay past month one" },
        ],
      }),
      makeSection("community", "testimonials", 2, {
        heading: "Member stories",
        items: [
          {
            quote: "I found my co-founder in the introductions channel.",
            name: "Amara Okafor",
            role: "Member since 2024",
          },
          {
            quote: "The feedback circle tore my landing page apart. Sales doubled.",
            name: "Daniel Kim",
            role: "Member since 2023",
          },
        ],
      }),
      makeSection("community", "referralRewards", 3, {
        heading: "Bring a friend, both skip ahead",
        items: [
          { referrals: 1, reward: "Skip 500 places in line" },
          { referrals: 3, reward: "Founding member badge" },
          { referrals: 10, reward: "Lifetime free access" },
        ],
      }),
      form("community", 4, {
        heading: "Get your invitation",
        body: "Tell us who you are building with. Invites go out weekly.",
      }),
    ],
  },
  {
    id: "event",
    name: "Event or course",
    description: "A bold agenda page that collects interest for a live date.",
    category: "Launch",
    brand: {
      headingFont: "Space Grotesk",
      bodyFont: "figtree",
      pageBackground: "#171310",
      surfaceColor: "#231c14",
      textColor: "#f5efe4",
      mutedColor: "#b3a88f",
      accentColor: "#ffb000",
      buttonColor: "#ffb000",
      buttonTextColor: "#171310",
      inputBackground: "#231c14",
      inputBorder: "#453a2c",
      inputTextColor: "#f5efe4",
      radius: "sharp",
    },
    form: { buttonText: "Save my seat", layout: "inline" },
    sections: [
      nav(
        "event",
        "Ship It Live",
        [
          { label: "Schedule", href: "#" },
          { label: "Speakers", href: "#" },
          { label: "FAQ", href: "#" },
        ],
        "Save my seat",
      ),
      hero(
        "event",
        "Learn pricing by building it.",
        "A focused live session for people who want practical progress, not another recording. Small room, real work.",
        {
          eyebrow: "LIVE WORKSHOP · MARCH 14",
          variant: "centered",
        },
      ),
      makeSection(
        "event",
        "steps",
        1,
        {
          heading: "The schedule",
          items: [
            {
              title: "09:30 · Doors and coffee",
              body: "Meet the room and pick the pricing problem you will solve.",
            },
            {
              title: "10:00 · Frame the problem",
              body: "Choose the offer and the customer it is really for.",
            },
            {
              title: "11:30 · Build together",
              body: "Draft tiers, anchors and guarantees with live feedback.",
            },
            {
              title: "13:00 · Leave with a plan",
              body: "Walk out with tested pricing and a rollout checklist.",
            },
          ],
        },
        "timeline",
      ),
      makeSection("event", "stats", 2, {
        items: [
          { value: "120", label: "seats per session" },
          { value: "4 hrs", label: "live, no recordings" },
          { value: "30", label: "pages of workbook" },
        ],
      }),
      makeSection("event", "testimonials", 3, {
        heading: "From past sessions",
        items: [
          {
            quote: "Specific, generous and immediately useful. Worth ten times the seat.",
            name: "Lena Fischer",
            role: "Past attendee",
          },
          {
            quote: "I rewrote our pricing the same evening.",
            name: "Ravi Menon",
            role: "Past attendee",
          },
        ],
      }),
      makeSection("event", "signupCount", 4, {
        prefix: "Join",
        suffix: "people already registered",
      }),
      form("event", 5, {
        heading: "Save my seat",
        body: "One email when registration opens. No spam, no recordings.",
      }),
    ],
  },
  {
    id: "commerce",
    name: "Pre-order",
    description: "A slow-luxe product story with reservation intent.",
    category: "Commerce",
    brand: {
      headingFont: "Fraunces",
      bodyFont: "hanken",
      pageBackground: "#e9e2d2",
      surfaceColor: "#f5f1e4",
      textColor: "#1e1b14",
      mutedColor: "#71664f",
      accentColor: "#55663a",
      buttonColor: "#1e1b14",
      buttonTextColor: "#f5f1e4",
      inputBackground: "#f5f1e4",
      inputBorder: "#c9bd9e",
      inputTextColor: "#1e1b14",
      radius: "sharp",
    },
    form: { buttonText: "Reserve my spot", layout: "inline" },
    sections: [
      hero(
        "commerce",
        "Made slowly. Ready soon.",
        "A considered carry good for people who would rather buy one good thing. Numbered, guaranteed, repaired forever.",
        {
          eyebrow: "SMALL BATCH · SHIPS JUNE",
        },
      ),
      makeSection(
        "commerce",
        "media",
        1,
        {
          heading: "The product, without the theatre",
          body: "Full-grain leather, brass hardware, and stitching you can count.",
          imageUrl: "",
          imageAlt: "",
        },
        "wide",
      ),
      benefits("commerce", "Why it costs what it costs", [
        {
          title: "Cut from full grain",
          body: "One hide, one bag. No splitting, no bonded scraps.",
        },
        {
          title: "Repaired forever",
          body: "Send it back any time. We fix it and return it.",
        },
        {
          title: "Numbered by hand",
          body: "Each piece is stamped with its batch and number.",
        },
      ]),
      makeSection("commerce", "signupCount", 3, {
        prefix: "Join",
        suffix: "people waiting for batch one",
      }),
      form("commerce", 4, {
        heading: "Reserve an early place",
        body: "A $1 deposit holds your place and locks batch-one pricing.",
      }),
    ],
  },
  {
    id: "developer",
    name: "Developer tool",
    description: "A docs-first page with the workflow, proof and access contract.",
    category: "Software",
    brand: {
      headingFont: "IBM Plex Mono",
      bodyFont: "Inter",
      pageBackground: "#f4f4f5",
      surfaceColor: "#ffffff",
      textColor: "#101014",
      mutedColor: "#63666f",
      accentColor: "#101014",
      buttonColor: "#101014",
      buttonTextColor: "#ffffff",
      inputBackground: "#ffffff",
      inputBorder: "#d9dade",
      inputTextColor: "#101014",
      radius: "sharp",
    },
    form: { buttonText: "Request access", layout: "inline" },
    sections: [
      nav(
        "developer",
        "querybase",
        [
          { label: "Docs", href: "#" },
          { label: "API", href: "#" },
          { label: "Changelog", href: "#" },
        ],
        "Request access",
      ),
      hero(
        "developer",
        "Less glue code. More product.",
        "A developer tool for the repetitive edges between idea and production. Bring your stack; keep your workflow.",
        {
          eyebrow: "V0.9 · SOC 2 TYPE II",
        },
      ),
      makeSection("developer", "logos", 1, {
        heading: "Built on open standards",
        items: ["Postgres", "Redis", "S3", "OAuth", "Stripe"],
      }),
      makeSection(
        "developer",
        "steps",
        2,
        {
          heading: "A smaller path to production",
          items: [
            {
              title: "Connect",
              body: "Bring the stack you already use. No agents on your machines.",
            },
            { title: "Configure", body: "Keep the decisions explicit and versioned in one file." },
            { title: "Ship", body: "Deploy without another bespoke integration." },
          ],
        },
        "timeline",
      ),
      makeSection("developer", "stats", 3, {
        items: [
          { value: "2 min", label: "to first request" },
          { value: "0", label: "new services to host" },
          { value: "100%", label: "portable, MIT-licensed core" },
        ],
      }),
      makeSection("developer", "faq", 4, {
        heading: "Straight answers",
        items: [
          {
            question: "Does it run in our VPC?",
            answer: "Yes. The control plane is hosted, execution stays in your cloud account.",
          },
          {
            question: "Which languages are supported?",
            answer: "TypeScript, Python and Go clients ship today, with Rust in beta.",
          },
          {
            question: "What does it cost during beta?",
            answer:
              "Free while in beta. Usage-based pricing starts at launch, and beta users keep 50% off.",
          },
        ],
      }),
      form("developer", 5, {
        heading: "Request access",
        body: "Invite-only while we harden the edges. Tell us your stack.",
      }),
    ],
  },
  {
    id: "podcast",
    name: "Podcast launch",
    description: "A trailer-led page that turns listeners into subscribers.",
    category: "Audience",
    brand: {
      headingFont: "Sora",
      bodyFont: "Inter",
      pageBackground: "#0e0e12",
      surfaceColor: "#1a1a21",
      textColor: "#f4f2f7",
      mutedColor: "#a7a3b8",
      accentColor: "#ff3b30",
      buttonColor: "#ff3b30",
      buttonTextColor: "#ffffff",
      inputBackground: "#1a1a21",
      inputBorder: "#3a3a46",
      inputTextColor: "#f4f2f7",
      radius: "round",
    },
    form: { buttonText: "Notify me", layout: "inline" },
    sections: [
      hero(
        "podcast",
        "Conversations worth queuing for.",
        "Long, unhurried interviews with the people building the future. New episodes every Tuesday.",
        {
          eyebrow: "A NEW SHOW · EPISODE ZERO SOON",
          variant: "centered",
        },
      ),
      makeSection(
        "podcast",
        "media",
        1,
        {
          heading: "Hear the trailer",
          body: "Ninety seconds that explain why this show exists. Plug in.",
          imageUrl: "",
          imageAlt: "",
        },
        "wide",
      ),
      benefits(
        "podcast",
        "Every episode",
        [
          {
            title: "One guest",
            body: "Founders, researchers and misfits with something real to say.",
          },
          {
            title: "One idea",
            body: "A single question, followed until it breaks open.",
          },
          {
            title: "One takeaway",
            body: "What to try, read or steal before next Tuesday.",
          },
        ],
        "list",
      ),
      makeSection(
        "podcast",
        "testimonials",
        2,
        {
          heading: "Early listeners",
          items: [
            {
              quote: "I finished the trailer and immediately sent it to three people.",
              name: "Sam Okafor",
              role: "Beta listener",
            },
            {
              quote: "The rare interview show that lets answers breathe.",
              name: "Elena Petrova",
              role: "Beta listener",
            },
          ],
        },
        "editorial",
      ),
      makeSection("podcast", "signupCount", 3, {
        prefix: "Join",
        suffix: "listeners already queued",
      }),
      form("podcast", 4, {
        heading: "Get episode zero",
        body: "First episode lands in your inbox Tuesday. No spam, unsubscribe anytime.",
      }),
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant opening",
    description: "A seasonal opening page with tastings, seats and a list.",
    category: "Local",
    brand: {
      headingFont: "DM Serif Display",
      bodyFont: "hanken",
      pageBackground: "#eef2e4",
      surfaceColor: "#f8faf2",
      textColor: "#1d2b1f",
      mutedColor: "#66785f",
      accentColor: "#b3541e",
      buttonColor: "#1d2b1f",
      buttonTextColor: "#f8faf2",
      inputBackground: "#f8faf2",
      inputBorder: "#cfd6bf",
      inputTextColor: "#1d2b1f",
      radius: "soft",
    },
    form: { buttonText: "Save my table", layout: "inline" },
    sections: [
      hero(
        "restaurant",
        "Fire, seasonality, and twelve seats.",
        "A wood-fired neighborhood kitchen. Five courses, one seating, no substitutions and no regrets.",
        {
          eyebrow: "OPENING THIS FALL · MAPLE STREET",
          variant: "centered",
        },
      ),
      makeSection(
        "restaurant",
        "media",
        1,
        {
          heading: "The room",
          body: "Twelve seats around an open hearth. Dinner, up close.",
          imageUrl: "",
          imageAlt: "",
        },
        "browser",
      ),
      benefits(
        "restaurant",
        "The idea",
        [
          {
            title: "Wood-fired",
            body: "Everything touches oak fire before it touches the plate.",
          },
          {
            title: "Eleven farms",
            body: "The menu is whatever arrived that morning.",
          },
          {
            title: "Natural wine",
            body: "Low-intervention bottles, poured generously.",
          },
        ],
        "list",
      ),
      makeSection("restaurant", "stats", 2, {
        items: [
          { value: "12", label: "seats a night" },
          { value: "5", label: "courses, no choices" },
          { value: "11", label: "farm partners" },
        ],
      }),
      makeSection("restaurant", "testimonials", 3, {
        heading: "From the tastings",
        items: [
          {
            quote: "The best meal I've had outside San Sebastián.",
            name: "Marta Vidal",
            role: "Tasting guest",
          },
          {
            quote: "We booked the opening month twice.",
            name: "James Park",
            role: "Tasting guest",
          },
        ],
      }),
      makeSection("restaurant", "signupCount", 4, {
        prefix: "Join",
        suffix: "neighbors on the list",
      }),
      form("restaurant", 5, {
        heading: "Save my table",
        body: "First seatings go to the list. One email when reservations open.",
      }),
    ],
  },
  {
    id: "fitness",
    name: "Fitness program",
    description: "A high-energy cohort page with proof and a start date.",
    category: "Consumer",
    brand: {
      headingFont: "Anton",
      bodyFont: "Inter",
      pageBackground: "#ffffff",
      surfaceColor: "#f4f4f4",
      textColor: "#111111",
      mutedColor: "#616161",
      accentColor: "#e11d2e",
      buttonColor: "#111111",
      buttonTextColor: "#ffffff",
      inputBackground: "#ffffff",
      inputBorder: "#d9d9d9",
      inputTextColor: "#111111",
      radius: "sharp",
    },
    form: { buttonText: "Claim my spot", layout: "inline" },
    sections: [
      hero(
        "fitness",
        "Stronger in 28 days.",
        "Twenty minutes a day. No gym, no guesswork. Coaching, food rules and a group that notices.",
        {
          eyebrow: "COHORT 8 · 28 DAYS",
          showForm: true,
        },
      ),
      makeSection("fitness", "stats", 1, {
        items: [
          { value: "28", label: "days, start to finish" },
          { value: "20 min", label: "a day, no gym" },
          { value: "4.9", label: "average cohort rating" },
        ],
      }),
      benefits("fitness", "Built for busy people", [
        {
          title: "Train anywhere",
          body: "Bodyweight and one dumbbell. Living room approved.",
        },
        {
          title: "Eat without math",
          body: "Three rules, endless meals. No counting, no apps.",
        },
        {
          title: "Recover on purpose",
          body: "Sleep and steps tracked gently, never judged.",
        },
      ]),
      makeSection("fitness", "testimonials", 2, {
        heading: "Cohort 7 results",
        items: [
          {
            quote: "Down 6 kilos and up three pull-ups. The group chat carried me.",
            name: "Dana Cole",
            role: "Cohort 7",
          },
          {
            quote: "First program I finished in ten years of trying.",
            name: "Marcus Reid",
            role: "Cohort 7",
          },
        ],
      }),
      makeSection("fitness", "signupCount", 3, {
        prefix: "Join",
        suffix: "already in for Monday",
      }),
      form("fitness", 4, {
        heading: "Start Monday",
        body: "Cohort 8 begins Monday. Tell us where to send the plan.",
      }),
    ],
  },
  {
    id: "nonprofit",
    name: "Nonprofit cause",
    description: "A community cause page with transparent impact and rewards.",
    category: "Community",
    brand: {
      headingFont: "DM Serif Display",
      bodyFont: "Inter",
      pageBackground: "#e7f0f4",
      surfaceColor: "#ffffff",
      textColor: "#0d2733",
      mutedColor: "#5b7a8a",
      accentColor: "#0e7c8a",
      buttonColor: "#0d2733",
      buttonTextColor: "#ffffff",
      inputBackground: "#ffffff",
      inputBorder: "#c3d5de",
      inputTextColor: "#0d2733",
      radius: "soft",
    },
    form: { buttonText: "Join the planting", layout: "inline" },
    sections: [
      hero(
        "nonprofit",
        "One thousand trees for the east side.",
        "We're planting a pocket forest with the people who live next to it. Funded by neighbors, planted by volunteers.",
        {
          eyebrow: "A COMMUNITY PROJECT",
          variant: "centered",
        },
      ),
      makeSection("nonprofit", "stats", 1, {
        items: [
          { value: "1,000", label: "trees to plant" },
          { value: "42", label: "volunteers signed up" },
          { value: "6", label: "blocks to green" },
        ],
      }),
      benefits(
        "nonprofit",
        "Where the money goes",
        [
          {
            title: "Saplings",
            body: "Native oaks and maples from two local nurseries.",
          },
          {
            title: "Watering",
            body: "Two summers of care until roots take hold.",
          },
          {
            title: "Stewardship",
            body: "A paid local crew keeps the grove thriving.",
          },
        ],
        "list",
      ),
      makeSection(
        "nonprofit",
        "testimonials",
        2,
        {
          heading: "Neighbors",
          items: [
            {
              quote: "My kids will climb these trees. That's the whole pitch.",
              name: "Rosa Jimenez",
              role: "Block captain",
            },
            {
              quote: "Finally, a project that asks us before it starts.",
              name: "David Chen",
              role: "Volunteer",
            },
          ],
        },
        "editorial",
      ),
      makeSection("nonprofit", "referralRewards", 3, {
        heading: "Grow it together",
        items: [
          { referrals: 1, reward: "Name a tree" },
          { referrals: 5, reward: "Join planting day" },
          { referrals: 20, reward: "Founders' grove plaque" },
        ],
      }),
      form("nonprofit", 4, {
        heading: "Plant with us",
        body: "One email a month: planting days, progress photos, and where your tree went.",
      }),
    ],
  },
  {
    id: "blank",
    name: "Blank page",
    description: "Start with only the essential hero and signup form.",
    category: "Start fast",
    sections: [
      hero(
        "blank",
        "Your launch starts here.",
        "Write one clear sentence about what you are building.",
        {
          variant: "centered",
        },
      ),
      form("blank", 1),
    ],
  },
];

function deepFreeze(value) {
  for (const child of Object.values(value))
    if (child && typeof child === "object") deepFreeze(child);
  return Object.freeze(value);
}
const catalog = definitions.map(
  ({ id, name, description, category, sections, brand = {}, form: formOverride = {} }) =>
    deepFreeze({
      id,
      name,
      description,
      category,
      snapshot: templateSnapshotSchema.parse({
        schemaVersion: 2,
        templateId: id,
        templateVersion: 1,
        brand: { ...defaultBrand, ...brand },
        sections,
        form: { ...defaultForm, ...formOverride },
        statusPage: defaultStatusPage,
        seo: defaultSeo,
      }),
    }),
);

export const BLOCK_TYPES = [
  {
    type: "hero",
    label: "Hero",
    category: "Essentials",
    description: "Headline, intro, and signup form above the fold.",
  },
  {
    type: "form",
    label: "Signup form",
    category: "Essentials",
    description: "Email signup form anywhere on the page.",
  },
  {
    type: "navigation",
    label: "Navigation",
    category: "Structure",
    description: "Top bar with your brand and links.",
  },
  {
    type: "features",
    label: "Benefits",
    category: "Content",
    description: "Grid of benefits your product delivers.",
  },
  {
    type: "steps",
    label: "Steps",
    category: "Content",
    description: "Numbered flow from sign-up to launch.",
  },
  {
    type: "logos",
    label: "Logos",
    category: "Proof",
    description: "Customer or press logos for social proof.",
  },
  {
    type: "stats",
    label: "Numbers",
    category: "Proof",
    description: "Key numbers in a bold three-up row.",
  },
  {
    type: "testimonials",
    label: "Testimonials",
    category: "Proof",
    description: "Quotes from people who back you.",
  },
  {
    type: "faq",
    label: "Questions",
    category: "Content",
    description: "Expandable answers to common questions.",
  },
  {
    type: "media",
    label: "Media",
    category: "Content",
    description: "Image next to supporting copy.",
  },
  {
    type: "signupCount",
    label: "Signup count",
    category: "Growth",
    description: "Live count of joined signups.",
  },
  {
    type: "referralRewards",
    label: "Referral rewards",
    category: "Growth",
    description: "Rewards for referred signups.",
  },
  {
    type: "cta",
    label: "Call to action",
    category: "Essentials",
    description: "Closing pitch with a jump-to-form button.",
  },
  {
    type: "footer",
    label: "Footer",
    category: "Structure",
    description: "Footer note and links at the bottom.",
  },
];

export function createSection(type, id = `block-${crypto.randomUUID()}`) {
  const common = { id, type, visible: true, variant: "default" };
  const values = {
    navigation: { brand: "Your product", links: [], buttonText: "Join the waitlist" },
    hero: {
      eyebrow: "EARLY ACCESS",
      heading: "A clear promise belongs here.",
      body: "Explain what you are building and who it helps.",
      showForm: false,
    },
    features: {
      heading: "Why it matters",
      items: [
        { title: "First benefit", body: "Say what this gives the visitor." },
        { title: "Second benefit", body: "Say what changes for them." },
        { title: "Third benefit", body: "Say why they should trust it." },
      ],
    },
    steps: {
      heading: "How it works",
      items: [
        { title: "Join", body: "Reserve your place." },
        { title: "Hear first", body: "Get the important updates." },
        { title: "Get access", body: "Be part of the first group." },
      ],
    },
    logos: { heading: "Built with people from", items: ["Northstar", "Acme", "Studio"] },
    stats: {
      items: [
        { value: "100+", label: "people waiting" },
        { value: "3", label: "early cohorts" },
      ],
    },
    testimonials: {
      heading: "What people say",
      items: [
        { quote: "Add an honest quote from a real person.", name: "Customer name", role: "Role" },
      ],
    },
    faq: {
      heading: "Questions",
      items: [
        { question: "When will it launch?", answer: "Share the most useful answer you can today." },
      ],
    },
    media: {
      heading: "Show the product",
      body: "Add context for the image.",
      imageUrl: "",
      imageAlt: "",
    },
    form: { heading: "Get early access", body: "Join the people hearing about the launch first." },
    signupCount: { prefix: "Join", suffix: "people waiting" },
    referralRewards: {
      heading: "Invite friends. Move forward.",
      items: [
        { referrals: 1, reward: "Move up the queue" },
        { referrals: 3, reward: "Priority access" },
      ],
    },
    cta: {
      heading: "Be there from the beginning.",
      body: "Join the waitlist for launch updates.",
      buttonText: "Join the waitlist",
    },
    footer: { note: "Built with care. Updates only when they matter.", links: [] },
  };
  if (!values[type]) throw new Error("Choose an available block.");
  return sectionSchema.parse({ ...common, ...values[type] });
}

export function listTemplates() {
  return structuredClone(catalog);
}
export function snapshotTemplate(id) {
  const template = catalog.find((entry) => entry.id === id);
  if (!template) throw new Error("Choose an available template.");
  return structuredClone(template.snapshot);
}
