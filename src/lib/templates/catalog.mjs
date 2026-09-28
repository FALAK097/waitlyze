import { z } from "zod";

const text = (max) => z.string().trim().min(1).max(max);
const hero = z.object({ type: z.literal("hero"), heading: text(120), body: text(600) }).strict();
const features = z.object({ type: z.literal("features"), items: z.array(z.object({ title: text(80), body: text(240) }).strict()).min(1).max(6) }).strict();
const faq = z.object({ type: z.literal("faq"), items: z.array(z.object({ question: text(120), answer: text(400) }).strict()).min(1).max(6) }).strict();
const form = z.object({ type: z.literal("form"), label: text(80), buttonText: text(40) }).strict();
const footer = z.object({ type: z.literal("footer"), note: text(160) }).strict();
export const sectionSchema = z.discriminatedUnion("type", [hero, features, faq, form, footer]);

export const templateSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  templateId: z.enum(["saas", "mobile", "ai", "community", "consumer", "newsletter", "blank"]),
  templateVersion: z.number().int().positive(),
  sections: z.array(sectionSchema).min(2).max(12),
  theme: z.object({ surface: z.literal("white"), text: z.literal("ink"), action: z.literal("lime"), font: z.literal("geist") }).strict(),
  form: z.object({ fields: z.tuple([z.literal("email")]), referrals: z.literal(false), verification: z.literal(false) }).strict(),
  thankYou: z.object({ heading: text(120), body: text(400) }).strict(),
  email: z.object({ enabled: z.literal(false), subject: text(160), body: text(600) }).strict(),
}).strict().superRefine((value, ctx) => {
  if (value.sections.filter((section) => section.type === "form").length !== 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A page needs exactly one signup form.", path: ["sections"] });
  if (value.sections[0]?.type !== "hero") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Start the page with a hero section.", path: ["sections"] });
});

const signup = { type: "form", label: "Email address", buttonText: "Join the waitlist" };
const launchFeatures = [
  { title: "What you're building", body: "Describe the product in a sentence." },
  { title: "Who it's for", body: "Help visitors recognize themselves." },
  { title: "Why join now", body: "Explain what joining the waitlist means." },
];
const definitions = [
  { id: "saas", name: "SaaS", description: "A focused product introduction with three benefits.", sections: [{ type: "hero", heading: "Your next great workflow starts here.", body: "Introduce your product and the problem it solves." }, { type: "features", items: launchFeatures }, signup] },
  { id: "mobile", name: "Mobile app", description: "An app introduction with a simple launch signup.", sections: [{ type: "hero", heading: "Something new for your everyday.", body: "Tell visitors what your app helps them do." }, signup, { type: "faq", items: [{ question: "Which devices will it support?", answer: "Add the platforms you plan to support." }] }] },
  { id: "ai", name: "AI tool", description: "Lead with the task your tool helps people accomplish.", sections: [{ type: "hero", heading: "A new way to get things done.", body: "Describe what your tool does and where people stay in control." }, { type: "features", items: launchFeatures }, signup] },
  { id: "community", name: "Community", description: "Introduce the people, purpose and invitation.", sections: [{ type: "hero", heading: "Find your people.", body: "Describe the community you're creating and who should join." }, signup, { type: "faq", items: [{ question: "What brings us together?", answer: "Explain your community's shared interest or purpose." }] }] },
  { id: "consumer", name: "Consumer product", description: "Give one product a clear introduction.", sections: [{ type: "hero", heading: "Meet your next favorite.", body: "Introduce the product and why you're making it." }, { type: "features", items: launchFeatures }, signup] },
  { id: "newsletter", name: "Newsletter", description: "Explain the subject and why people should subscribe.", sections: [{ type: "hero", heading: "A fresh perspective, in your inbox.", body: "Tell readers what you'll write about and how often." }, { ...signup, buttonText: "Join the list" }, { type: "footer", note: "Add a short note about what subscribers can expect." }] },
  { id: "blank", name: "Blank", description: "Start with a heading and an email form.", sections: [{ type: "hero", heading: "Your launch starts here.", body: "Introduce what you're building." }, signup] },
];

function deepFreeze(value) {
  for (const child of Object.values(value)) if (child && typeof child === "object") deepFreeze(child);
  return Object.freeze(value);
}

const catalog = definitions.map(({ id, name, description, sections }) => deepFreeze({
  id, name, description,
  snapshot: templateSnapshotSchema.parse({
    schemaVersion: 1, templateId: id, templateVersion: 1, sections,
    theme: { surface: "white", text: "ink", action: "lime", font: "geist" },
    form: { fields: ["email"], referrals: false, verification: false },
    thankYou: { heading: "You're on the list.", body: "Thanks for your interest." },
    email: { enabled: false, subject: "You're on the {{waitlist}} list", body: "Thanks for joining {{waitlist}}." },
  }),
}));

export function listTemplates() {
  return structuredClone(catalog);
}

// Accept only the ID from a browser. The trusted versioned snapshot comes from this catalog.
export function snapshotTemplate(id) {
  const template = catalog.find((item) => item.id === id);
  if (!template) throw new Error("Choose an available template.");
  return structuredClone(template.snapshot);
}
