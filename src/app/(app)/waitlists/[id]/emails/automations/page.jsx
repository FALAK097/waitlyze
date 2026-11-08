import { notFound } from "next/navigation";

import { ContentLayout } from "@/components/dashboard/content-layout";
import { AutomationManager } from "@/components/email/automation-manager";
import { EmailToolsNav } from "@/components/email/email-tools-nav";
import { hasCustomerEmailSender } from "@/lib/email/sender-resolution.mjs";
import { getAutomationConsoleForCampaign } from "@/lib/emails/automation-console.mjs";
import { getOrCreateTemplatesForCampaign } from "@/lib/emails/templates.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { requireCampaignFeature } from "@/lib/workspaces/authorize";

export const metadata = {
  title: "Automations",
  description: "Set up consent-aware waitlist email automations.",
};

export default async function AutomationsPage({ params, searchParams }) {
  const [{ id }, { recipe: requestedRecipeId }] = await Promise.all([params, searchParams]);
  const { campaign, scope } = await requireCampaignFeature(id, "sendEmail", "emailMarketing");
  if (!campaign) return notFound();
  const senderConnected = await hasCustomerEmailSender(prisma, {
    workspaceId: campaign.workspaceId,
    waitListId: campaign.id,
  });
  const [data, templates] = await Promise.all([
    getAutomationConsoleForCampaign(campaign.id, scope),
    getOrCreateTemplatesForCampaign(campaign.id, scope),
  ]);
  return (
    <ContentLayout title="Automations">
      <EmailToolsNav waitListId={campaign.id} current="automations" />
      <AutomationManager
        waitListId={campaign.id}
        waitListName={campaign.name}
        initialRecipes={data.recipes}
        initialRecipeId={requestedRecipeId}
        initialTemplates={templates}
        deliveryReady={Boolean(env.OUTBOX_DISPATCH_SECRET && senderConnected)}
      />
    </ContentLayout>
  );
}
