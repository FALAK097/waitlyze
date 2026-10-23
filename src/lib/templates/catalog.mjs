import { z } from "zod";

const text = (max) => z.string().max(max);
const hex = z.string().regex(/^#[0-9a-f]{6}$/i, "Choose a six-digit hex color.");
const blockId = z
  .string()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9-]+$/i);
const base = { id: blockId, visible: z.boolean(), variant: z.string().min(1).max(40) };
const item = z.strictObject({ title: text(80), body: text(280) });

const navigation = z.strictObject({
  ...base,
  type: z.literal("navigation"),
  brand: text(80),
  links: z.array(z.strictObject({ label: text(40), href: z.string().max(240) })).max(5),
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
const logos = z.strictObject({
  ...base,
  type: z.literal("logos"),
  heading: text(120),
  items: z.array(text(50)).min(2).max(8),
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
  imageUrl: z.string().max(500),
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
  links: z.array(z.strictObject({ label: text(40), href: z.string().max(240) })).max(6),
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

export const FONT_IDS = ["hanken", "manrope", "bricolage", "figtree", "archivo"];
export const RADIUS_IDS = ["sharp", "soft", "round", "pill"];
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
  headingFont: z.enum(FONT_IDS),
  bodyFont: z.enum(FONT_IDS),
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
  shareChannels: z.array(z.enum(["x", "linkedin", "whatsapp", "email"])).max(4),
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
      "blank",
    ]),
    templateVersion: z.number().int().positive(),
    brand: brandSchema,
    sections: z.array(sectionSchema).min(1).max(24),
    form: templateFormSchema,
    statusPage: statusPageSchema,
    seo: seoSchema,
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
  shareChannels: ["x", "linkedin", "whatsapp", "email"],
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
const benefits = (id, items) =>
  makeSection(id, "features", 1, { heading: "Why join early", items }, "columns");
const baseBenefits = [
  { title: "See it first", body: "Get a first look before the public launch." },
  { title: "Shape the product", body: "Tell us what matters while we are still building." },
  { title: "Keep your place", body: "Early members receive priority access." },
];

const definitions = [
  {
    id: "simple",
    name: "Simple form",
    description: "A focused one-screen signup with no extra sections.",
    category: "Start fast",
    sections: [
      hero(
        "simple",
        "Something useful is taking shape.",
        "Join the waitlist and be first to know when it is ready.",
        {
          showForm: true,
        },
      ),
    ],
  },
  {
    id: "saas",
    name: "SaaS beta",
    description: "A clear product promise, benefits and questions.",
    category: "Software",
    sections: [
      hero(
        "saas",
        "A calmer way to run your work.",
        "One place for the work your team keeps rebuilding in spreadsheets.",
      ),
      benefits("saas", baseBenefits),
      makeSection("saas", "steps", 2, {
        heading: "From invite to impact",
        items: [
          { title: "Join", body: "Reserve your place with one email." },
          { title: "Try", body: "Get invited in small, thoughtful cohorts." },
          { title: "Shape", body: "Share feedback directly with the team." },
        ],
      }),
      form("saas", 3),
      makeSection("saas", "faq", 4, {
        heading: "Before you join",
        items: [
          {
            question: "When does the beta open?",
            answer: "We are inviting the first group soon and will email you before access opens.",
          },
          {
            question: "Will it be free to try?",
            answer: "Yes. Early members can explore the beta before choosing a plan.",
          },
        ],
      }),
    ],
  },
  {
    id: "ai",
    name: "AI product",
    description: "Lead with the job the product helps people complete.",
    category: "Software",
    brand: {
      headingFont: "bricolage",
      bodyFont: "figtree",
      pageBackground: "#f4f4ef",
      accentColor: "#d8ff55",
    },
    sections: [
      hero(
        "ai",
        "Do the thinking that matters. Delegate the rest.",
        "A focused assistant that turns the work around your work into clear next steps.",
      ),
      makeSection(
        "ai",
        "media",
        1,
        {
          heading: "Your workflow, visible",
          body: "Show a real product screenshot here when you are ready.",
          imageUrl: "",
          imageAlt: "",
        },
        "browser",
      ),
      benefits("ai", baseBenefits),
      form("ai", 3),
    ],
  },
  {
    id: "mobile",
    name: "Mobile app",
    description: "An app-first page with a product visual and concise benefits.",
    category: "Consumer",
    brand: {
      headingFont: "figtree",
      bodyFont: "hanken",
      pageBackground: "#f5f7fb",
      accentColor: "#bdf02c",
    },
    sections: [
      hero(
        "mobile",
        "A better rhythm for every day.",
        "A thoughtful new app designed to make the small things feel easier.",
      ),
      makeSection(
        "mobile",
        "media",
        1,
        {
          heading: "Made for the screen in your hand",
          body: "Add an app screenshot or product preview.",
          imageUrl: "",
          imageAlt: "",
        },
        "phone",
      ),
      benefits("mobile", baseBenefits),
      form("mobile", 3),
    ],
  },
  {
    id: "creator",
    name: "Creator or newsletter",
    description: "Build anticipation around a point of view and regular updates.",
    category: "Audience",
    brand: {
      headingFont: "archivo",
      bodyFont: "figtree",
      pageBackground: "#fbf8f0",
      accentColor: "#f1ff9c",
    },
    sections: [
      hero(
        "creator",
        "One useful idea, delivered well.",
        "Field notes for people building thoughtful products and businesses.",
      ),
      makeSection(
        "creator",
        "testimonials",
        1,
        {
          heading: "Why readers stay",
          items: [
            {
              quote: "The rare update I save and return to.",
              name: "Early reader",
              role: "Founder",
            },
          ],
        },
        "editorial",
      ),
      form("creator", 2, {
        heading: "Read the next issue",
        body: "Occasional, considered, and easy to leave.",
      }),
      makeSection("creator", "footer", 3, {
        note: "Published independently. No noise, no rented attention.",
        links: [],
      }),
    ],
  },
  {
    id: "community",
    name: "Community",
    description: "Introduce the people, shared purpose and invitation.",
    category: "Audience",
    sections: [
      hero(
        "community",
        "Find the people building beside you.",
        "A small, useful community for honest conversations and practical support.",
      ),
      makeSection("community", "stats", 1, {
        items: [
          { value: "Small", label: "by design" },
          { value: "Useful", label: "over noisy" },
          { value: "Kind", label: "without posturing" },
        ],
      }),
      benefits("community", baseBenefits),
      form("community", 3),
    ],
  },
  {
    id: "event",
    name: "Event or course",
    description: "Set expectations and collect interest for a dated experience.",
    category: "Launch",
    sections: [
      hero(
        "event",
        "Learn the thing by building it.",
        "A focused live session for people who want practical progress, not another recording.",
      ),
      makeSection("event", "steps", 1, {
        heading: "What the session covers",
        items: [
          { title: "Frame", body: "Choose the problem worth solving." },
          { title: "Build", body: "Work through the core decisions together." },
          { title: "Leave ready", body: "Take a clear plan into the next week." },
        ],
      }),
      makeSection("event", "testimonials", 2, {
        heading: "From past sessions",
        items: [
          {
            quote: "Specific, generous and immediately useful.",
            name: "Past attendee",
            role: "Product lead",
          },
        ],
      }),
      form("event", 3, { heading: "Get the first invitation" }),
    ],
  },
  {
    id: "commerce",
    name: "Pre-order",
    description: "A visual product story with proof and reservation intent.",
    category: "Commerce",
    brand: {
      headingFont: "bricolage",
      bodyFont: "hanken",
      pageBackground: "#f6f1e8",
      accentColor: "#d4ff65",
    },
    sections: [
      hero(
        "commerce",
        "Made slowly. Ready soon.",
        "A considered product for people who would rather buy one good thing.",
      ),
      makeSection(
        "commerce",
        "media",
        1,
        {
          heading: "The product, without the theatre",
          body: "Replace this space with your clearest product image.",
          imageUrl: "",
          imageAlt: "",
        },
        "gallery",
      ),
      benefits("commerce", baseBenefits),
      makeSection("commerce", "signupCount", 3, { prefix: "Join", suffix: "people waiting" }),
      form("commerce", 4, { heading: "Reserve an early place" }),
    ],
  },
  {
    id: "developer",
    name: "Developer tool",
    description: "Explain the workflow, proof and early-access contract.",
    category: "Software",
    brand: {
      headingFont: "archivo",
      bodyFont: "hanken",
      pageBackground: "#f5f6f1",
      accentColor: "#c6fe1e",
    },
    sections: [
      hero(
        "developer",
        "Less glue code. More product.",
        "A developer tool for the repetitive edges between idea and production.",
      ),
      makeSection(
        "developer",
        "steps",
        1,
        {
          heading: "A smaller path to production",
          items: [
            { title: "Connect", body: "Bring the stack you already use." },
            { title: "Configure", body: "Keep the decisions explicit and versioned." },
            { title: "Ship", body: "Deploy without another bespoke integration." },
          ],
        },
        "timeline",
      ),
      makeSection("developer", "stats", 2, {
        items: [
          { value: "2 min", label: "to first request" },
          { value: "0", label: "new services to host" },
          { value: "100%", label: "portable" },
        ],
      }),
      form("developer", 3),
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
const catalog = definitions.map(({ id, name, description, category, sections, brand = {} }) =>
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
      form: defaultForm,
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
    features: { heading: "Why it matters", items: structuredClone(baseBenefits) },
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
