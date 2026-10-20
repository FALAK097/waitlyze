import { z } from "zod";

const text = (max) =>
  z
    .string()
    .min(1)
    .max(max)
    .refine((value) => value.trim().length > 0, "Enter some text.");
const hero = z.strictObject({ type: z.literal("hero"), heading: text(120), body: text(600) });
const features = z.strictObject({
  type: z.literal("features"),
  items: z
    .array(z.strictObject({ title: text(80), body: text(240) }))
    .min(1)
    .max(6),
});
const faq = z.strictObject({
  type: z.literal("faq"),
  items: z
    .array(z.strictObject({ question: text(120), answer: text(400) }))
    .min(1)
    .max(6),
});
const formSection = z.strictObject({
  type: z.literal("form"),
  label: text(80),
  buttonText: text(40),
});
const footer = z.strictObject({ type: z.literal("footer"), note: text(160) });
const sectionSchema = z.discriminatedUnion("type", [hero, features, faq, formSection, footer]);
const templateFormSchema = z.strictObject({
  fields: z.tuple([z.literal("email")]),
  referrals: z.literal(false),
  verification: z.literal(false),
});

export const legacySnapshotSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    templateId: z.enum(["saas", "mobile", "ai", "community", "consumer", "newsletter", "blank"]),
    templateVersion: z.number().int().positive(),
    sections: z.array(sectionSchema).min(2).max(12),
    theme: z.strictObject({
      surface: z.literal("white"),
      text: z.literal("ink"),
      action: z.literal("lime"),
      font: z.literal("geist"),
    }),
    form: templateFormSchema,
    thankYou: z.strictObject({ heading: text(120), body: text(400) }),
    email: z.strictObject({ enabled: z.literal(false), subject: text(160), body: text(600) }),
  })
  .superRefine((value, ctx) => {
    if (value.sections.filter((section) => section.type === "form").length !== 1)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A page needs exactly one signup form.",
        path: ["sections"],
      });
    if (value.sections[0]?.type !== "hero")
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start the page with a hero section.",
        path: ["sections"],
      });
  });

// Retain the original record as well as mapping every rendered v1 field.
// Disabled legacy email copy has no v2 editor surface and must not be discarded.
export function migrateLegacySnapshot(value, { brand, form, statusPage, seo }) {
  const templateId =
    { consumer: "commerce", newsletter: "creator" }[value.templateId] || value.templateId;
  const signup = value.sections.find((section) => section.type === "form");
  return {
    schemaVersion: 2,
    templateId,
    templateVersion: value.templateVersion,
    brand: {
      ...brand,
      pageBackground: "#ffffff",
      surfaceColor: "#ffffff",
      textColor: "#00160d",
      accentColor: "#c6fe1e",
      buttonColor: "#c6fe1e",
      buttonTextColor: "#00160d",
    },
    sections: value.sections.map((section, index) => {
      const common = { id: `legacy-${section.type}-${index}`, visible: true, variant: "default" };
      switch (section.type) {
        case "hero":
          return { ...common, ...section, eyebrow: "", showForm: false };
        case "features":
          return { ...common, ...section, heading: "Benefits" };
        case "faq":
          return { ...common, ...section, heading: "Questions" };
        case "form":
          return { ...common, type: "form", heading: "", body: "" };
        case "footer":
          return { ...common, ...section, links: [] };
      }
    }),
    form: {
      ...form,
      fields: value.form.fields,
      label: signup.label,
      buttonText: signup.buttonText,
      verification: value.form.verification,
    },
    statusPage: {
      ...statusPage,
      ...value.thankYou,
      showReferralLink: value.form.referrals,
      showReferralCount: value.form.referrals,
    },
    seo: { ...seo },
    legacy: value,
  };
}
