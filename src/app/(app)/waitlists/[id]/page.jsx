import { replaceInvalidDraftPage, saveDraftPage } from "@/app/actions/draft-snapshot";
import { publishWaitlist, pauseWaitlist, rollbackWaitlist } from "@/app/actions/publication";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { SnapshotPageBuilder } from "@/components/product/snapshot-page-builder";
import {
  InProductToolDrawer,
  OriginatingBlueprintBanner,
} from "@/components/tools/in-product-launch-lab";
import { getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import { hasCustomerEmailSender } from "@/lib/email/sender-resolution.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-metadata";
import {
  sanitizeLegacySnapshotForRead,
  snapshotTemplate,
  templateSnapshotSchema,
} from "@/lib/templates/catalog.mjs";
import { getClaimedBlueprintForWaitlist } from "@/lib/tools/blueprint.mjs";
import { getToolBySlug } from "@/lib/tools/registry.mjs";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = { title: "Builder" };

export default async function WaitListsEditPage(props) {
  const { id } = await props.params;
  const { campaign: waitList, role, workspace } = await requireCampaignPage(id, "editCampaign");
  const canPublish = ["OWNER", "ADMIN"].includes(role);

  const [draft, publication, domain, entitlements, customerEmailSenderConnected, claimedBlueprint] =
    await Promise.all([
      prisma.waitList.findFirst({
        where: { id: waitList.id, workspaceId: workspace.id },
        select: { templateSnapshot: true },
      }),
      waitList.publishedRevision
        ? prisma.waitListPublicationRevision.findUnique({
            where: {
              waitListId_revision: {
                waitListId: waitList.id,
                revision: waitList.publishedRevision,
              },
            },
            select: { snapshot: true },
          })
        : null,
      prisma.customDomain.findUnique({
        where: { waitListId: waitList.id },
        select: { hostname: true, status: true },
      }),
      getWorkspaceEntitlements(prisma, workspace.id),
      hasCustomerEmailSender(prisma, { workspaceId: workspace.id, waitListId: waitList.id }),
      getClaimedBlueprintForWaitlist(prisma, waitList.id),
    ]);
  const parsedSnapshot = templateSnapshotSchema.safeParse(draft?.templateSnapshot);
  const templateSnapshot = parsedSnapshot.success
    ? parsedSnapshot.data
    : snapshotTemplate("simple");
  const parsedPublished = templateSnapshotSchema.safeParse(
    sanitizeLegacySnapshotForRead(publication?.snapshot),
  );
  // Only an existing-but-unreadable snapshot needs the destructive replacement flow. A page
  // with no snapshot yet is simply a new page and saves through the normal draft path.
  const snapshotReplacement = draft?.templateSnapshot != null && !parsedSnapshot.success;
  const origin = process.env.BETTER_AUTH_URL || SITE_URL;
  const liveUrl =
    waitList.status === "PUBLISHED" && waitList.publicSlug
      ? `${origin.replace(/\/$/, "")}/w/${waitList.publicSlug}`
      : "";
  const blueprintToolMeta = claimedBlueprint ? getToolBySlug(claimedBlueprint.toolSlug) : null;
  return (
    <ContentLayout title="Builder">
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <InProductToolDrawer
          surface="builder"
          waitlistUrl={liveUrl}
          waitlistKeyId={waitList.id}
          customDomain={domain?.hostname || ""}
        />
      </div>
      {claimedBlueprint ? (
        <OriginatingBlueprintBanner
          blueprint={claimedBlueprint}
          toolTitle={blueprintToolMeta?.shortTitle || claimedBlueprint.toolSlug}
        />
      ) : null}
      <SnapshotPageBuilder
        waitList={{
          id: waitList.id,
          name: waitList.name,
          publicSlug: waitList.publicSlug,
          status: waitList.status,
          showReferrals: waitList.showReferrals,
          templateRevision: waitList.templateRevision,
          publishedRevision: waitList.publishedRevision,
          publishedTemplateRevision: waitList.publishedTemplateRevision,
          templateSnapshot,
          snapshotReplacement,
          publishedSnapshot: parsedPublished.success ? parsedPublished.data : null,
          customDomain: domain,
          canRemoveBranding: entitlements.removeBranding,
        }}
        saveDraftPage={saveDraftPage}
        replaceInvalidDraftPage={replaceInvalidDraftPage}
        publishPage={publishWaitlist}
        pausePage={pauseWaitlist}
        rollbackPage={rollbackWaitlist}
        canPublish={canPublish}
        canManageBilling={role === "OWNER"}
        workspaceId={workspace.id}
        turnstileConfigured={Boolean(
          env.TURNSTILE_SITE_KEY?.trim() && env.TURNSTILE_SECRET_KEY?.trim(),
        )}
        customerEmailSenderConnected={customerEmailSenderConnected}
        publicationOrigin={process.env.BETTER_AUTH_URL || SITE_URL}
      />
    </ContentLayout>
  );
}
