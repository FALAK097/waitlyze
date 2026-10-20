import { notFound } from "next/navigation";

import { getBroadcastRecipients, listBroadcasts } from "@/app/actions/emails";
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
  const [broadcasts, initialPreview] = await Promise.all([
    listBroadcasts(campaign.id),
    getBroadcastRecipients(campaign.id),
  ]);
  return (
    <ContentLayout title="Broadcasts">
      <BroadcastManager
        waitListId={campaign.id}
        initialBroadcasts={broadcasts}
        initialPreview={initialPreview}
        deliveryReady={Boolean(env.OUTBOX_DISPATCH_SECRET && env.RESEND_API_KEY)}
      />
    </ContentLayout>
  );
}
