import { notFound } from "next/navigation";

import {
  getBroadcastRecipients,
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

export default async function BroadcastsPage({ params }) {
  const { id } = await params;
  const { campaign } = await requireCampaignPage(id, "sendEmail");
  if (!campaign) return notFound();
  const broadcasts = await listBroadcasts(campaign.id);
  const [initialPreview, initialSegments] = await Promise.all([
    getBroadcastRecipients(campaign.id, broadcasts?.[0]?.segment || "ALL"),
    listBroadcastSegments(),
  ]);
  return (
    <ContentLayout title="Broadcasts">
      <BroadcastManager
        waitListId={campaign.id}
        waitListName={campaign.name}
        initialBroadcasts={broadcasts}
        initialPreview={initialPreview}
        initialSegments={initialSegments}
        deliveryReady={Boolean(env.OUTBOX_DISPATCH_SECRET && env.RESEND_API_KEY)}
      />
    </ContentLayout>
  );
}
