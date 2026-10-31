import { notFound } from "next/navigation";

import {
  getBroadcastRecipients,
  getOrCreateTemplates,
  listBroadcasts,
  listBroadcastSegments,
} from "@/app/actions/emails";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { BroadcastManager } from "@/components/email/broadcast-manager";
import { env } from "@/lib/env.mjs";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = {
  title: "Broadcasts",
  description: "Create and send opted-in waitlist updates.",
};

export default async function BroadcastsPage({ params, searchParams }) {
  const { id } = await params;
  const { broadcast: requestedBroadcastId } = await searchParams;
  const { campaign } = await requireCampaignPage(id, "sendEmail");
  if (!campaign) return notFound();
  const broadcasts = await listBroadcasts(campaign.id);
  const initialBroadcast =
    broadcasts.find((broadcast) => broadcast.id === requestedBroadcastId) || broadcasts[0];
  const [initialPreview, initialSegments, templates] = await Promise.all([
    getBroadcastRecipients(campaign.id, initialBroadcast?.segment || "ALL"),
    listBroadcastSegments(),
    getOrCreateTemplates(campaign.id),
  ]);
  return (
    <ContentLayout title="Broadcasts">
      <BroadcastManager
        waitListId={campaign.id}
        waitListName={campaign.name}
        initialBroadcasts={broadcasts}
        initialBroadcastId={initialBroadcast?.id || null}
        initialPreview={initialPreview}
        initialSegments={initialSegments}
        initialTemplates={templates}
        deliveryReady={Boolean(env.OUTBOX_DISPATCH_SECRET && env.RESEND_API_KEY)}
      />
    </ContentLayout>
  );
}
