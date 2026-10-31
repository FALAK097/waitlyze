import { notFound } from "next/navigation";

import {
  getBroadcastRecipients,
  listBroadcasts,
  listBroadcastSegments,
} from "@/app/actions/emails";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { BroadcastManager } from "@/components/email/broadcast-manager";
import { getOrCreateTemplatesForCampaign } from "@/lib/emails/templates.mjs";
import { env } from "@/lib/env.mjs";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = {
  title: "Broadcasts",
  description: "Create and send opted-in waitlist updates.",
};

export default async function BroadcastsPage({ params, searchParams }) {
  const [{ id }, { broadcast: requestedBroadcastId }] = await Promise.all([params, searchParams]);
  const { campaign, scope } = await requireCampaignPage(id, "sendEmail");
  if (!campaign) return notFound();
  const [{ broadcasts, selectedBroadcast, hasMore, nextCursor }, initialSegments, templates] =
    await Promise.all([
      listBroadcasts(campaign.id, {
        includeLatestContent: true,
        selectedBroadcastId: typeof requestedBroadcastId === "string" ? requestedBroadcastId : null,
      }),
      listBroadcastSegments(),
      getOrCreateTemplatesForCampaign(campaign.id, scope),
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
        deliveryReady={Boolean(env.OUTBOX_DISPATCH_SECRET && env.RESEND_API_KEY)}
      />
    </ContentLayout>
  );
}
