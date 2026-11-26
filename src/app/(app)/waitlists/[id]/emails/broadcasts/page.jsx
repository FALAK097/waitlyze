import {
  getBroadcastRecipients,
  listBroadcasts,
  listBroadcastSegments,
} from "@/app/actions/emails";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { BroadcastManager } from "@/components/email/broadcast-manager";
import { EmailLockedState } from "@/components/product/email-locked-state";
import { getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import { hasCustomerEmailSender } from "@/lib/email/sender-resolution.mjs";
import { getOrCreateTemplatesForCampaign } from "@/lib/emails/templates.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = {
  title: "Broadcasts",
  description: "Create and send opted-in waitlist updates.",
};

export default async function BroadcastsPage({ params, searchParams }) {
  const [{ id }, { broadcast: requestedBroadcastId }] = await Promise.all([params, searchParams]);
  const { campaign, workspace, role, scope } = await requireCampaignPage(id, "sendEmail");
  const entitlements = await getWorkspaceEntitlements(prisma, workspace.id);
  if (!entitlements.emailMarketing) {
    return (
      <EmailLockedState
        title="Broadcasts"
        waitlistName={campaign.name}
        workspaceId={workspace.id}
        canManageBilling={role === "OWNER"}
      />
    );
  }
  const [
    { broadcasts, selectedBroadcast, hasMore, nextCursor },
    initialSegments,
    templates,
    senderConnected,
  ] = await Promise.all([
    listBroadcasts(campaign.id, {
      includeLatestContent: true,
      selectedBroadcastId: typeof requestedBroadcastId === "string" ? requestedBroadcastId : null,
    }),
    listBroadcastSegments(),
    getOrCreateTemplatesForCampaign(campaign.id, scope),
    hasCustomerEmailSender(prisma, {
      workspaceId: campaign.workspaceId,
      waitListId: campaign.id,
    }),
  ]);
  const initialPreview = await getBroadcastRecipients(
    campaign.id,
    selectedBroadcast?.segment || broadcasts?.[0]?.segment || "ALL",
  );
  return (
    <ContentLayout title="Broadcasts">
      <BroadcastManager
        waitListId={campaign.id}
        waitListName={campaign.name}
        initialBroadcasts={broadcasts}
        initialBroadcast={selectedBroadcast}
        initialHasMore={hasMore}
        initialCursor={nextCursor}
        initialPreview={initialPreview}
        initialSegments={initialSegments}
        initialTemplates={templates}
        deliveryReady={Boolean(env.OUTBOX_DISPATCH_SECRET && senderConnected)}
      />
    </ContentLayout>
  );
}
