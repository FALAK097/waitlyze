import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { snapshotTemplate, templateSnapshotSchema } from "@/lib/templates/catalog.mjs";
import { TEMPLATE_IDS, isTemplateId } from "@/lib/templates/gallery.mjs";

export const BLUEPRINT_COOKIE_NAME = "waitlyze-tool-blueprint";
export const BLUEPRINT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for unclaimed blueprints

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);

const customFieldInputSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/i),
  label: z.string().trim().min(1).max(80),
  type: z.enum(["text", "textarea", "number", "select", "checkbox"]),
  required: z.boolean().default(false),
  placeholder: z.string().trim().max(120).default(""),
  options: z.array(z.string().trim().max(80)).max(20).default([]),
});

const rewardTierSchema = z.object({
  referrals: z.number().int().min(1).max(100000),
  reward: z.string().trim().min(1).max(120),
});

const checklistItemSchema = z.object({
  id: z.string().trim().min(1).max(60),
  phase: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  dueDate: z.string().trim().max(32).optional(),
  completed: z.boolean().default(false),
});

const emailDraftSchema = z.object({
  stage: z.string().trim().min(1).max(60),
  subject: z.string().trim().min(1).max(160),
  previewText: z.string().trim().max(200).default(""),
  body: z.string().trim().min(1).max(3000),
  timing: z.string().trim().max(100).default(""),
});

export const toolBlueprintInputSchema = z.object({
  version: z.literal(1).default(1),
  toolSlug: z.string().trim().min(2).max(80),
  templateId: z.enum(TEMPLATE_IDS).default("simple"),
  campaignName: z.string().trim().max(120).default(""),
  campaignDescription: z.string().trim().max(500).default(""),
  suggestedSlug: z
    .string()
    .trim()
    .max(48)
    .regex(/^[a-z0-9-]*$/)
    .default(""),
  showReferrals: z.boolean().default(true),
  sendEmailsToSubscribers: z.boolean().default(false),
  fraudMode: z.enum(["STANDARD", "STRICT"]).default("STANDARD"),
  summaryBullets: z.array(z.string().trim().min(1).max(200)).max(8).default([]),
  heroCopy: z
    .object({
      eyebrow: z.string().trim().max(80).optional(),
      heading: z.string().trim().max(140).optional(),
      body: z.string().trim().max(700).optional(),
      buttonText: z.string().trim().max(40).optional(),
    })
    .optional(),
  sectionsPatch: z
    .object({
      featuresHeading: z.string().trim().max(120).optional(),
      features: z
        .array(
          z.object({
            title: z.string().trim().min(1).max(80),
            body: z.string().trim().min(1).max(280),
          }),
        )
        .max(6)
        .optional(),
      faqs: z
        .array(
          z.object({
            question: z.string().trim().min(1).max(140),
            answer: z.string().trim().min(1).max(500),
          }),
        )
        .max(8)
        .optional(),
      hideMedia: z.boolean().optional(),
      statusHeading: z.string().trim().max(120).optional(),
      statusBody: z.string().trim().max(360).optional(),
      shareMessage: z.string().trim().max(260).optional(),
    })
    .optional(),
  formFields: z
    .object({
      doubleOptIn: z.boolean().optional(),
      requireConsent: z.boolean().optional(),
      consentLabel: z.string().trim().max(240).optional(),
      placeholder: z.string().trim().max(120).optional(),
      buttonText: z.string().trim().max(40).optional(),
      layout: z.enum(["inline", "stacked"]).optional(),
      customFields: z.array(customFieldInputSchema).max(10).optional(),
    })
    .optional(),
  referralConfig: z
    .object({
      enabled: z.boolean().optional(),
      pointsSignup: z.number().int().min(0).max(100000).optional(),
      pointsReferral: z.number().int().min(0).max(100000).optional(),
      pointsFollow: z.number().int().min(0).max(100000).optional(),
      hideCounts: z.boolean().optional(),
      showPoints: z.boolean().optional(),
      showProgress: z.boolean().optional(),
      rewardTiers: z.array(rewardTierSchema).max(6).optional(),
      modeledKFactor: z.number().min(0).max(20).optional(),
    })
    .optional(),
  brandPatch: z
    .object({
      accentColor: hexColor.optional(),
      buttonColor: hexColor.optional(),
      buttonTextColor: hexColor.optional(),
      radius: z.enum(["sharp", "soft", "round", "pill"]).optional(),
    })
    .optional(),
  emailDrafts: z.array(emailDraftSchema).max(6).optional(),
  launchChecklist: z.array(checklistItemSchema).max(24).optional(),
  utmPlan: z
    .object({
      campaign: z.string().trim().max(80).optional(),
      channels: z
        .array(
          z.object({
            channel: z.string().trim().max(60),
            source: z.string().trim().max(60),
            medium: z.string().trim().max(60),
            content: z.string().trim().max(80).optional(),
          }),
        )
        .max(15)
        .optional(),
    })
    .optional(),
  embedConfig: z
    .object({
      mode: z.enum(["inline", "pill", "modal", "drawer"]).optional(),
      framework: z.string().trim().max(40).optional(),
    })
    .optional(),
  domainConfig: z
    .object({
      domain: z.string().trim().max(253).optional(),
      score: z.number().min(0).max(100).optional(),
    })
    .optional(),
  auditSummary: z
    .object({
      score: z.number().min(0).max(100).optional(),
      grade: z.string().trim().max(8).optional(),
      topFixes: z.array(z.string().trim().max(200)).max(5).optional(),
    })
    .optional(),
});

function getSigningKey() {
  return (
    process.env.BETTER_AUTH_SECRET ||
    process.env.WEBHOOK_SECRET_ENCRYPTION_KEY ||
    "waitlyze-dev-blueprint-signing-key"
  );
}

export function signBlueprintCookieValue(blueprintId, toolSlug) {
  const payload = `${blueprintId}.${toolSlug}`;
  const sig = createHmac("sha256", getSigningKey()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyBlueprintCookieValue(rawValue) {
  if (typeof rawValue !== "string" || !rawValue) return null;
  const parts = rawValue.split(".");
  if (parts.length !== 3) return null;
  const [blueprintId, toolSlug, providedSig] = parts;
  if (!blueprintId || !toolSlug || !providedSig) return null;
  const expectedSig = createHmac("sha256", getSigningKey())
    .update(`${blueprintId}.${toolSlug}`)
    .digest("base64url");
  const a = Buffer.from(providedSig, "utf8");
  const b = Buffer.from(expectedSig, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { id: blueprintId, toolSlug };
}

/**
 * Safely merges a validated ToolBlueprint payload into a fresh template snapshot,
 * validating the result with templateSnapshotSchema so malformed drafts are impossible.
 */
export function applyBlueprintToSnapshot(baseSnapshot, blueprint) {
  if (!blueprint || typeof blueprint !== "object") return baseSnapshot;
  const draft = structuredClone(
    baseSnapshot ||
      snapshotTemplate(isTemplateId(blueprint.templateId) ? blueprint.templateId : "simple"),
  );

  // 1. Patch sections (hero, features, faq, referralRewards, media)
  if (Array.isArray(draft.sections)) {
    draft.sections = draft.sections.map((section) => {
      if (section.type === "hero" && blueprint.heroCopy) {
        return {
          ...section,
          ...(blueprint.heroCopy.eyebrow !== undefined
            ? { eyebrow: blueprint.heroCopy.eyebrow }
            : {}),
          ...(blueprint.heroCopy.heading ? { heading: blueprint.heroCopy.heading } : {}),
          ...(blueprint.heroCopy.body ? { body: blueprint.heroCopy.body } : {}),
        };
      }
      if (section.type === "features" && blueprint.sectionsPatch?.features?.length) {
        return {
          ...section,
          visible: true,
          ...(blueprint.sectionsPatch.featuresHeading
            ? { heading: blueprint.sectionsPatch.featuresHeading }
            : {}),
          items: blueprint.sectionsPatch.features.slice(0, 8),
        };
      }
      if (section.type === "faq" && blueprint.sectionsPatch?.faqs?.length) {
        return {
          ...section,
          visible: true,
          items: blueprint.sectionsPatch.faqs.slice(0, 10),
        };
      }
      if (section.type === "media" && blueprint.sectionsPatch?.hideMedia) {
        return { ...section, visible: false };
      }
      if (section.type === "referralRewards" && blueprint.referralConfig?.rewardTiers?.length) {
        return {
          ...section,
          visible: true,
          items: blueprint.referralConfig.rewardTiers.slice(0, 8),
        };
      }
      return section;
    });

    // Ensure features, faq, and referralRewards sections exist if supplied and base template lacked them
    const insertBeforeFooter = (newSection) => {
      const footerIdx = draft.sections.findIndex((s) => s.type === "footer");
      if (footerIdx >= 0) {
        draft.sections.splice(footerIdx, 0, newSection);
      } else {
        draft.sections.push(newSection);
      }
    };

    if (
      blueprint.sectionsPatch?.features?.length &&
      !draft.sections.some((s) => s.type === "features")
    ) {
      insertBeforeFooter({
        id: "blueprint-features",
        type: "features",
        visible: true,
        variant: "grid",
        heading: blueprint.sectionsPatch.featuresHeading || "What you get with early access",
        items: blueprint.sectionsPatch.features.slice(0, 8),
      });
    }

    if (
      blueprint.referralConfig?.rewardTiers?.length &&
      !draft.sections.some((s) => s.type === "referralRewards")
    ) {
      insertBeforeFooter({
        id: "blueprint-referral-rewards",
        type: "referralRewards",
        visible: true,
        variant: "list",
        heading: "Invite friends, unlock early rewards",
        items: blueprint.referralConfig.rewardTiers.slice(0, 8),
      });
    }

    if (blueprint.sectionsPatch?.faqs?.length && !draft.sections.some((s) => s.type === "faq")) {
      insertBeforeFooter({
        id: "blueprint-faq",
        type: "faq",
        visible: true,
        variant: "list",
        heading: "Frequently asked questions",
        items: blueprint.sectionsPatch.faqs.slice(0, 10),
      });
    }
  }

  // 2. Patch form settings & custom fields
  if (draft.form) {
    if (blueprint.heroCopy?.buttonText) {
      draft.form.buttonText = blueprint.heroCopy.buttonText.slice(0, 40);
    }
    if (blueprint.formFields) {
      if (blueprint.formFields.buttonText) {
        draft.form.buttonText = blueprint.formFields.buttonText.slice(0, 40);
      }
      if (blueprint.formFields.placeholder) {
        draft.form.placeholder = blueprint.formFields.placeholder.slice(0, 120);
      }
      if (blueprint.formFields.layout) {
        draft.form.layout = blueprint.formFields.layout;
      }
      if (typeof blueprint.formFields.doubleOptIn === "boolean") {
        draft.form.doubleOptIn = blueprint.formFields.doubleOptIn;
        draft.form.verification = blueprint.formFields.doubleOptIn;
      }
      if (typeof blueprint.formFields.requireConsent === "boolean") {
        draft.form.requireConsent = blueprint.formFields.requireConsent;
      }
      if (blueprint.formFields.consentLabel) {
        draft.form.consentLabel = blueprint.formFields.consentLabel;
      }
      if (
        Array.isArray(blueprint.formFields.customFields) &&
        blueprint.formFields.customFields.length
      ) {
        draft.form.customFields = blueprint.formFields.customFields.slice(0, 10);
      }
    }
  }

  // 3. Patch rewards/points engine config
  if (blueprint.referralConfig) {
    draft.rewards = {
      pointsSignup: blueprint.referralConfig.pointsSignup ?? draft.rewards?.pointsSignup ?? 50,
      pointsReferral:
        blueprint.referralConfig.pointsReferral ?? draft.rewards?.pointsReferral ?? 30,
      pointsFollow: blueprint.referralConfig.pointsFollow ?? draft.rewards?.pointsFollow ?? 5,
      customEvents: draft.rewards?.customEvents ?? [],
      positionOffset: draft.rewards?.positionOffset ?? 0,
      hideCounts: blueprint.referralConfig.hideCounts ?? draft.rewards?.hideCounts ?? false,
      showPoints: blueprint.referralConfig.showPoints ?? draft.rewards?.showPoints ?? true,
      showProgress: blueprint.referralConfig.showProgress ?? draft.rewards?.showProgress ?? true,
    };
  }

  // 4. Patch brand colors / radius
  if (draft.brand && blueprint.brandPatch) {
    if (blueprint.brandPatch.accentColor)
      draft.brand.accentColor = blueprint.brandPatch.accentColor;
    if (blueprint.brandPatch.buttonColor)
      draft.brand.buttonColor = blueprint.brandPatch.buttonColor;
    if (blueprint.brandPatch.buttonTextColor) {
      draft.brand.buttonTextColor = blueprint.brandPatch.buttonTextColor;
    }
    if (blueprint.brandPatch.radius) draft.brand.radius = blueprint.brandPatch.radius;
  }

  // 5. Patch status page copy
  if (draft.statusPage && blueprint.sectionsPatch) {
    if (blueprint.sectionsPatch.statusHeading) {
      draft.statusPage.heading = blueprint.sectionsPatch.statusHeading;
    }
    if (blueprint.sectionsPatch.statusBody && "body" in draft.statusPage) {
      draft.statusPage.body = blueprint.sectionsPatch.statusBody;
    }
    if (blueprint.sectionsPatch.shareMessage && "shareMessage" in draft.statusPage) {
      draft.statusPage.shareMessage = blueprint.sectionsPatch.shareMessage;
    }
  }

  const parsed = templateSnapshotSchema.safeParse(draft);
  return parsed.success ? parsed.data : baseSnapshot;
}

export async function createToolBlueprint(db, rawInput) {
  const payload = toolBlueprintInputSchema.parse(rawInput);
  const expiresAt = new Date(Date.now() + BLUEPRINT_TTL_MS);
  return db.toolBlueprint.create({
    data: {
      version: payload.version,
      toolSlug: payload.toolSlug,
      payload,
      expiresAt,
    },
    select: {
      id: true,
      version: true,
      toolSlug: true,
      expiresAt: true,
      createdAt: true,
    },
  });
}

export async function getActiveToolBlueprint(db, id) {
  if (typeof id !== "string" || id.length < 8 || id.length > 64) return null;
  try {
    const record = await db.toolBlueprint.findUnique({
      where: { id },
    });
    if (!record) return null;
    if (record.claimedWaitlistId) return null;
    if (new Date(record.expiresAt).getTime() < Date.now()) return null;
    const parsed = toolBlueprintInputSchema.safeParse(record.payload);
    if (!parsed.success) return null;
    return {
      id: record.id,
      version: record.version,
      toolSlug: record.toolSlug,
      payload: parsed.data,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    };
  } catch (error) {
    console.error("Failed to read tool blueprint:", error?.code || error?.name || "unknown");
    return null;
  }
}

export async function claimToolBlueprint(db, { id, userId, waitListId, creationKey }) {
  if (!id || !userId || !waitListId || !creationKey) {
    return { claimed: false, alreadyClaimedForDraft: false };
  }
  try {
    const now = new Date();
    const updated = await db.toolBlueprint.updateMany({
      where: {
        id,
        claimedWaitlistId: null,
        expiresAt: { gt: now },
      },
      data: {
        claimedByUserId: userId,
        claimedWaitlistId: waitListId,
        claimedCreationKey: creationKey,
        claimedAt: now,
      },
    });
    if (updated.count > 0) {
      return { claimed: true, alreadyClaimedForDraft: false, id };
    }
    const existing = await db.toolBlueprint.findUnique({
      where: { id },
      select: { claimedByUserId: true, claimedWaitlistId: true, claimedCreationKey: true },
    });
    return {
      claimed: false,
      alreadyClaimedForDraft:
        existing?.claimedByUserId === userId &&
        existing.claimedWaitlistId === waitListId &&
        existing.claimedCreationKey === creationKey,
      id,
    };
  } catch (error) {
    console.error("Failed to claim tool blueprint:", error?.code || error?.name || "unknown");
    return { claimed: false, alreadyClaimedForDraft: false, error: true };
  }
}

export async function saveClaimedBlueprintForWaitlist(db, { userId, waitListId, rawInput }) {
  const payload = toolBlueprintInputSchema.parse(rawInput);
  const now = new Date();
  return db.toolBlueprint.create({
    data: {
      version: payload.version,
      toolSlug: payload.toolSlug,
      payload,
      claimedByUserId: userId,
      claimedWaitlistId: waitListId,
      claimedAt: now,
      expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
    },
    select: { id: true, toolSlug: true, claimedAt: true },
  });
}

export async function getClaimedBlueprintForWaitlist(db, waitListId) {
  if (!waitListId) return null;
  try {
    const records = await db.toolBlueprint.findMany({
      where: { claimedWaitlistId: waitListId },
      orderBy: { claimedAt: "desc" },
      take: 20,
    });
    if (!records || records.length === 0) return null;

    const validRecords = [];
    for (const record of records) {
      const parsed = toolBlueprintInputSchema.safeParse(record.payload);
      if (parsed.success) {
        validRecords.push({
          id: record.id,
          toolSlug: record.toolSlug,
          claimedAt: record.claimedAt,
          payload: parsed.data,
        });
      }
    }
    if (validRecords.length === 0) return null;

    const latest = validRecords[0];
    const mergedPayload = { ...latest.payload };
    const seenBullets = new Set();
    const mergedBullets = [];
    const toolSlugs = [];

    for (const item of validRecords) {
      if (!toolSlugs.includes(item.toolSlug)) {
        toolSlugs.push(item.toolSlug);
      }
      for (const bullet of item.payload.summaryBullets || []) {
        if (!seenBullets.has(bullet) && mergedBullets.length < 10) {
          seenBullets.add(bullet);
          mergedBullets.push(bullet);
        }
      }
      if (!mergedPayload.emailDrafts?.length && item.payload.emailDrafts?.length) {
        mergedPayload.emailDrafts = item.payload.emailDrafts;
      }
      if (!mergedPayload.utmPlan?.channels?.length && item.payload.utmPlan?.channels?.length) {
        mergedPayload.utmPlan = item.payload.utmPlan;
      }
      if (!mergedPayload.domainConfig?.domain && item.payload.domainConfig?.domain) {
        mergedPayload.domainConfig = item.payload.domainConfig;
      }
      if (!mergedPayload.launchChecklist?.length && item.payload.launchChecklist?.length) {
        mergedPayload.launchChecklist = item.payload.launchChecklist;
      }
      if (!mergedPayload.auditSummary && item.payload.auditSummary) {
        mergedPayload.auditSummary = item.payload.auditSummary;
      }
    }
    mergedPayload.summaryBullets = mergedBullets;

    return {
      id: latest.id,
      toolSlug: latest.toolSlug,
      toolSlugs,
      claimedAt: latest.claimedAt,
      payload: mergedPayload,
    };
  } catch {
    return null;
  }
}
