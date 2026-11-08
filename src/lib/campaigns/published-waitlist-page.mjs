import { getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import prisma from "@/lib/prisma";
import { templateSnapshotSchema } from "@/lib/templates/catalog.mjs";

/** Resolve the stored revision used by public waitlist routes. */
export async function resolvePublishedWaitlistPage(waitList) {
  if (!waitList) return null;
  if (waitList.status === "PAUSED") return { waitList, paused: true };
  if (waitList.status !== "PUBLISHED" || !waitList.publishedRevision) return null;

  const publication = await prisma.waitListPublicationRevision.findUnique({
    where: {
      waitListId_revision: { waitListId: waitList.id, revision: waitList.publishedRevision },
    },
    select: { snapshot: true },
  });
  const parsed = templateSnapshotSchema.safeParse(publication?.snapshot);
  if (!parsed.success) return null;
  const entitlements = await getWorkspaceEntitlements(prisma, waitList.workspaceId);
  return { waitList, snapshot: parsed.data, canRemoveBranding: entitlements.removeBranding };
}
