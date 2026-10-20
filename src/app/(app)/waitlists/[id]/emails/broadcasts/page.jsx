import { notFound } from "next/navigation";
import { requireCampaignPage } from "@/lib/workspaces/authorize";
import { env } from "@/lib/env.mjs";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { BroadcastManager } from "@/components/email/broadcast-manager";
import { getBroadcastRecipients, listBroadcasts } from "@/app/actions/emails";
import prisma from "@/lib/prisma";
import { workspaceEmailDeliveryReady } from "@/lib/integrations/email-sender.mjs";

export const metadata = { title: "Broadcasts", description: "Create and send opted-in waitlist updates." };

export default async function BroadcastsPage({ params, searchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { campaign } = await requireCampaignPage(id, "sendEmail");
  if (!campaign) return notFound();
  const [broadcasts, initialPreview, senderReady] = await Promise.all([
    listBroadcasts(campaign.id),
    getBroadcastRecipients(campaign.id),
    workspaceEmailDeliveryReady(prisma, campaign.workspaceId, Boolean(env.RESEND_API_KEY && env.RESEND_WEBHOOK_SECRET)),
  ]);
  return <ContentLayout title="Broadcasts">
    <BroadcastManager waitListId={campaign.id} initialBroadcasts={broadcasts} initialPreview={initialPreview} deliveryReady={Boolean(env.OUTBOX_DISPATCH_SECRET && senderReady)} initialBroadcastId={query.broadcast} />
  </ContentLayout>;
}
