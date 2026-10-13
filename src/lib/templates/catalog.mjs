import { z } from "zod";
import { THEME_ACCENT_IDS, THEME_FONT_IDS, THEME_PRESET_IDS, normalizeTheme } from "./theme.mjs";

const text = (max) => z.string().min(1).max(max).refine((value) => value.trim().length > 0, "Enter some text.");
const hero = z.strictObject({ type: z.literal("hero"), heading: text(120), body: text(600) });
const features = z.strictObject({ type: z.literal("features"), items: z.array(z.strictObject({ title: text(80), body: text(240) })).min(1).max(6) });
const faq = z.strictObject({ type: z.literal("faq"), items: z.array(z.strictObject({ question: text(120), answer: text(400) })).min(1).max(6) });
const form = z.strictObject({ type: z.literal("form"), label: text(80), buttonText: text(40) });
const footer = z.strictObject({ type: z.literal("footer"), note: text(160) });
export const sectionSchema = z.discriminatedUnion("type", [hero, features, faq, form, footer]);
export const templateFormSchema = z.strictObject({ fields: z.tuple([z.literal("email")]), referrals: z.literal(false), verification: z.literal(false) });

export const themeSchema = z.strictObject({
  preset: z.enum(THEME_PRESET_IDS),
  accent: z.enum(THEME_ACCENT_IDS),
  font: z.enum(THEME_FONT_IDS),
});

export const templateSnapshotSchema = z.strictObject({
  schemaVersion: z.literal(1),
  templateId: z.enum(["saas", "mobile", "ai", "community", "consumer", "newsletter", "viral", "blank"]),
  templateVersion: z.number().int().positive(),
  sections: z.array(sectionSchema).min(2).max(12),
  // normalizeTheme keeps snapshots saved before themes were editable valid.
  theme: z.preprocess((value) => normalizeTheme(value), themeSchema),
  form: templateFormSchema,
  thankYou: z.strictObject({ heading: text(120), body: text(400) }),
  email: z.strictObject({ enabled: z.literal(false), subject: text(160), body: text(600) }),
}).superRefine((value, ctx) => {
  if (value.sections.filter((section) => section.type === "form").length !== 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A page needs exactly one signup form.", path: ["sections"] });
  if (value.sections[0]?.type !== "hero") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Start the page with a hero section.", path: ["sections"] });
});

const emailSignup = { type: "form", label: "Email address", buttonText: "Join the waitlist" };

const definitions = [
  {
    id: "saas", name: "SaaS", description: "A focused product introduction with three benefits and a signup form.",
    theme: { preset: "light", accent: "lime", font: "sans" },
    sections: [
      { type: "hero", heading: "Your next great workflow starts here.", body: "One workspace for your launch: collect interest, confirm every email, and know exactly who is waiting." },
      { type: "features", items: [
        { title: "Launch in minutes", body: "Pick this starter, add your copy, and publish. No code, no designer needed." },
        { title: "Every email confirmed", body: "Double opt-in keeps your list real, so launch day reaches humans." },
        { title: "Know your audience", body: "See where signups come from and which messages convert." },
      ] },
      emailSignup,
    ],
  },
  {
    id: "mobile", name: "Mobile app", description: "App-store style introduction with platform questions answered.",
    theme: { preset: "light", accent: "sky", font: "sans" },
    sections: [
      { type: "hero", heading: "Something new for your everyday.", body: "Join the list for early access on iOS and Android, plus a founding-member badge at launch." },
      { ...emailSignup, buttonText: "Notify me" },
      { type: "faq", items: [
        { question: "Which devices will it support?", answer: "iOS and Android from day one, with a web companion to follow." },
        { question: "When does the beta start?", answer: "We invite the list in signup order. Early signups get in first." },
      ] },
    ],
  },
  {
    id: "ai", name: "AI tool", description: "Dark, confident starter that leads with the job your tool does.",
    theme: { preset: "dark", accent: "violet", font: "sans" },
    sections: [
      { type: "hero", heading: "A new way to get things done.", body: "Describe the task your tool takes off people's plates, and where a human stays in control." },
      { type: "features", items: [
        { title: "Does the busywork", body: "Say plainly what the tool drafts, summarizes, or automates." },
        { title: "You stay in control", body: "Approvals, edits, and exports work the way your users expect." },
        { title: "Private by default", body: "Your work stays yours. Say how you handle data in one line." },
      ] },
      emailSignup,
    ],
  },
  {
    id: "community", name: "Community", description: "Warm editorial starter about the people and the invitation.",
    theme: { preset: "sand", accent: "coral", font: "serif" },
    sections: [
      { type: "hero", heading: "Find your people.", body: "A small, deliberate community for people who care about the same thing you do. Tell them what that thing is." },
      { ...emailSignup, buttonText: "Request an invite" },
      { type: "faq", items: [
        { question: "What brings us together?", answer: "Explain the shared interest, craft, or goal members rally around." },
        { question: "How do invites work?", answer: "Join the waitlist and we open the doors in small weekly cohorts." },
      ] },
    ],
  },
  {
    id: "consumer", name: "Consumer product", description: "One product, one clear introduction, one signup form.",
    theme: { preset: "mist", accent: "coral", font: "sans" },
    sections: [
      { type: "hero", heading: "Meet your next favorite.", body: "Introduce the product, who it is for, and when it ships. One screen, no scrolling required to join." },
      { type: "features", items: [
        { title: "Why it exists", body: "The frustration you felt that made you build this." },
        { title: "What changes", body: "The before-and-after in a single sentence each." },
        { title: "When you get it", body: "Your ship date or launch window, stated plainly." },
      ] },
      emailSignup,
    ],
  },
  {
    id: "newsletter", name: "Newsletter", description: "Subject-first starter with cadence set before signup.",
    theme: { preset: "light", accent: "violet", font: "serif" },
    sections: [
      { type: "hero", heading: "A fresh perspective, in your inbox.", body: "Tell readers what you write about, how often it arrives, and why it is worth opening." },
      { ...emailSignup, buttonText: "Subscribe" },
      { type: "footer", note: "One email a week. Unsubscribe anytime, no hard feelings." },
    ],
  },
  {
    id: "viral", name: "Viral waitlist", description: "Referral-first starter: signups climb the queue by inviting friends.",
    theme: { preset: "dark", accent: "lime", font: "sans" },
    sections: [
      { type: "hero", heading: "Skip the line.", body: "Join the waitlist, get your link, and every friend who joins moves you up. Early believers get in first." },
      { type: "features", items: [
        { title: "Your place in line", body: "Every signup sees their position the moment they join." },
        { title: "Invites move you up", body: "Share your link. Each friend who joins jumps you forward." },
        { title: "Rewards unlock", body: "Top referrers earn early access and founding-member perks." },
      ] },
      { ...emailSignup, buttonText: "Claim my spot" },
      { type: "faq", items: [
        { question: "How do referrals work?", answer: "After joining you get a personal link. Friends who join through it move you up the queue." },
      ] },
    ],
  },
  {
    id: "blank", name: "Blank", description: "Start with a heading and an email form. Full control in the editor.",
    theme: { preset: "light", accent: "lime", font: "sans" },
    sections: [
      { type: "hero", heading: "Your launch starts here.", body: "Introduce what you're building." },
      emailSignup,
    ],
  },
];

function deepFreeze(value) {
  for (const child of Object.values(value)) if (child && typeof child === "object") deepFreeze(child);
  return Object.freeze(value);
}

const catalog = definitions.map(({ id, name, description, theme, sections }) => deepFreeze({
  id, name, description, theme,
  snapshot: templateSnapshotSchema.parse({
    schemaVersion: 1, templateId: id, templateVersion: 1, sections,
    theme,
    form: { fields: ["email"], referrals: false, verification: false },
    thankYou: { heading: "You're on the list.", body: "Thanks for your interest." },
    email: { enabled: false, subject: "You're on the {{waitlist}} list", body: "Thanks for joining {{waitlist}}." },
  }),
}));

export function listTemplates() {
  return structuredClone(catalog);
}

// Accept only the ID from a browser. The trusted versioned snapshot comes from this catalog.
// themeOverride lets creation-time style choices ride along; validated before use.
export function snapshotTemplate(id, themeOverride) {
  const template = catalog.find((item) => item.id === id);
  if (!template) throw new Error("Choose an available template.");
  const snapshot = structuredClone(template.snapshot);
  if (themeOverride !== undefined) snapshot.theme = themeSchema.parse(themeOverride);
  return snapshot;
}
