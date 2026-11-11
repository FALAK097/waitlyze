import { getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import prisma from "@/lib/prisma";
import { templateSnapshotSchema } from "@/lib/templates/catalog.mjs";

/** Resolve the stored revision used by public waitlist routes. */
export async function resolvePublishedWaitlistPage(waitList) {
  if (!waitList) return null;
  if (waitList.status === "PAUSED") {
    const entitlements = await getWorkspaceEntitlements(prisma, waitList.workspaceId);
    return { waitList, paused: true, canUseCustomDomain: entitlements.customDomains };
  }
  if (waitList.status !== "PUBLISHED" || !waitList.publishedRevision) return null;

  const [entitlements, publication] = await Promise.all([
    getWorkspaceEntitlements(prisma, waitList.workspaceId),
    prisma.waitListPublicationRevision.findUnique({
      where: {
        waitListId_revision: { waitListId: waitList.id, revision: waitList.publishedRevision },
      },
      select: { snapshot: true },
    }),
  ]);
  const parsed = templateSnapshotSchema.safeParse(publication?.snapshot);
  if (!parsed.success) return null;
  return {
    waitList,
    snapshot: parsed.data,
    canRemoveBranding: entitlements.removeBranding,
    canUseCustomDomain: entitlements.customDomains,
  };
}
