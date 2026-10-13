import { z } from "zod";
import { snapshotTemplate, themeSchema } from "../templates/catalog.mjs";
import { campaignScope, createWorkspaceService } from "../workspaces/service.mjs";

export const draftInputSchema = z.strictObject({
  name: z.string().trim().min(1, "Give your waitlist a name.").max(120),
  description: z.string().trim().max(600).default(""),
  publicSlug: z.string().min(3).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens."),
  templateId: z.enum(["saas", "mobile", "ai", "community", "consumer", "newsletter", "viral", "blank"]),
  theme: themeSchema.default({ preset: "light", accent: "lime", font: "sans" }),
  showReferrals: z.boolean().default(false),
  showSocialProof: z.boolean().default(false),
  creationKey: z.uuid(),
});

export class DraftCreationError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

function sameRequest(record, input, actorId) {
  return record.userId === actorId && record.name === input.name && record.description === input.description &&
    record.publicSlug === input.publicSlug && record.templateSnapshot?.templateId === input.templateId &&
    JSON.stringify(record.templateSnapshot?.theme ?? null) === JSON.stringify(input.theme) &&
    Boolean(record.showReferrals) === input.showReferrals && Boolean(record.showSocialProof) === input.showSocialProof;
}

// The browser supplies a starter ID; it cannot supply a snapshot, owner or workspace.
// A serializable transaction rechecks membership on every retry, including idempotent retries.
export async function createDraft(db, actorId, workspaceId, rawInput) {
  const input = draftInputSchema.parse(rawInput);
  const snapshot = snapshotTemplate(input.templateId, input.theme);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        await createWorkspaceService(tx).requireAccess(actorId, workspaceId, "editCampaign");
        const existing = await tx.waitList.findFirst({
          where: { creationKey: input.creationKey, ...campaignScope(actorId, "editCampaign", workspaceId) },
        });
        if (existing) {
          if (!sameRequest(existing, input, actorId)) throw new DraftCreationError("This creation request has changed. Start a new waitlist.");
          return existing;
        }
        if (await tx.waitList.findUnique({ where: { publicSlug: input.publicSlug }, select: { id: true } })) {
          throw new DraftCreationError("This address is taken. Choose another.", "publicSlug");
        }
        return tx.waitList.create({
          data: {
            name: input.name, description: input.description, publicSlug: input.publicSlug,
            creationKey: input.creationKey, templateSnapshot: snapshot,
            userId: actorId, workspaceId, status: "DRAFT", sendEmailsToSubscribers: false,
            showReferrals: input.showReferrals, showSocialProof: input.showSocialProof, showLogo: false,
            buttonColor: "#C6FE1E", buttonBorder: "#C6FE1E", buttonTextColor: "#00160D",
          },
        });
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      if (!["P2034", "P2002"].includes(error.code)) throw error;
      if (attempt === 3) throw new DraftCreationError("Couldn't finish creating your waitlist. Try again.");
    }
  }
}
