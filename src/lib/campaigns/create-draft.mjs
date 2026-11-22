import { z } from "zod";

import { getWorkspaceEntitlements, requireCapacity } from "../billing/plans.mjs";
import { snapshotTemplate } from "../templates/catalog.mjs";
import { campaignScope, createWorkspaceService } from "../workspaces/service.mjs";

export const RESERVED_WAITLIST_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "docs",
  "help",
  "login",
  "new",
  "settings",
  "status",
  "support",
  "verify",
  "waitlists",
]);

export const draftInputSchema = z.strictObject({
  name: z.string().trim().min(1, "Give your waitlist a name.").max(120),
  description: z.string().trim().max(600).default(""),
  publicSlug: z
    .string()
    .min(3)
    .max(48)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.")
    .refine((slug) => !RESERVED_WAITLIST_SLUGS.has(slug), "This address is reserved."),
  templateId: z
    .enum([
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
    ])
    .default("simple"),
  showReferrals: z.boolean().default(true),
  sendEmailsToSubscribers: z.boolean().default(true),
  creationKey: z.uuid(),
});

export class DraftCreationError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

function sameRequest(record, input, actorId) {
  return (
    record.userId === actorId &&
    record.name === input.name &&
    record.description === input.description &&
    record.publicSlug === input.publicSlug &&
    record.templateSnapshot?.templateId === input.templateId &&
    (record.showReferrals ?? false) === input.showReferrals &&
    (record.sendEmailsToSubscribers ?? false) === input.sendEmailsToSubscribers
  );
}

import { isUniqueConstraintError } from "../db/sqlite-helpers.mjs";
import { applyBlueprintToSnapshot } from "../tools/blueprint.mjs";

// The browser supplies a starter ID; it cannot supply a raw snapshot, owner or workspace.
// An optional server-loaded ToolBlueprint may safely patch the starter snapshot.
export async function createDraft(db, actorId, workspaceId, rawInput, options = {}) {
  const input = draftInputSchema.parse(rawInput);
  const blueprintPayload = options?.blueprint?.payload || null;
  const baseSnapshot = snapshotTemplate(input.templateId);
  const snapshot = blueprintPayload
    ? applyBlueprintToSnapshot(baseSnapshot, blueprintPayload)
    : baseSnapshot;
  const fraudMode = blueprintPayload?.fraudMode === "STRICT" ? "STRICT" : "STANDARD";
  const showReferrals =
    typeof blueprintPayload?.showReferrals === "boolean"
      ? blueprintPayload.showReferrals
      : input.showReferrals;
  await createWorkspaceService(db).requireAccess(actorId, workspaceId, "editCampaign");

  const existing = await db.waitList.findFirst({
    where: {
      creationKey: input.creationKey,
      ...campaignScope(actorId, "editCampaign", workspaceId),
    },
  });
  if (existing) {
    if (!sameRequest(existing, input, actorId)) {
      throw new DraftCreationError("This creation request has changed. Start a new waitlist.");
    }
    return existing;
  }

  const [entitlements, workspaceWaitlists] = await Promise.all([
    getWorkspaceEntitlements(db, workspaceId),
    db.waitList.count({ where: { workspaceId } }),
  ]);
  requireCapacity({
    entitlements,
    feature: "waitlists",
    used: workspaceWaitlists,
    message: `The ${entitlements.plan === "FREE" ? "Free" : "Pro"} plan includes ${entitlements.waitlists} waitlist${entitlements.waitlists === 1 ? "" : "s"} per workspace. Upgrade or remove a waitlist to create another.`,
  });

  if (
    await db.waitList.findUnique({
      where: { publicSlug: input.publicSlug },
      select: { id: true },
    })
  ) {
    throw new DraftCreationError("This address is taken. Choose another.", "publicSlug");
  }

  try {
    return await db.waitList.create({
      data: {
        name: input.name,
        description: input.description,
        publicSlug: input.publicSlug,
        creationKey: input.creationKey,
        templateSnapshot: snapshot,
        showReferrals,
        sendEmailsToSubscribers: input.sendEmailsToSubscribers,
        fraudMode,
        userId: actorId,
        workspaceId,
        status: "DRAFT",
        showSocialProof: false,
        showLogo: false,
        buttonColor: blueprintPayload?.brandPatch?.buttonColor || "#C6FE1E",
        buttonBorder: blueprintPayload?.brandPatch?.buttonColor || "#C6FE1E",
        buttonTextColor: blueprintPayload?.brandPatch?.buttonTextColor || "#00160D",
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const raced = await db.waitList.findFirst({
      where: {
        creationKey: input.creationKey,
        ...campaignScope(actorId, "editCampaign", workspaceId),
      },
    });
    if (raced) {
      if (!sameRequest(raced, input, actorId)) {
        throw new DraftCreationError("This creation request has changed. Start a new waitlist.");
      }
      return raced;
    }
    throw new DraftCreationError("This address was just claimed. Choose another.", "publicSlug");
  }
}
