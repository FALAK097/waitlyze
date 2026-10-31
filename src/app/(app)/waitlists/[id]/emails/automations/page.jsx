import { notFound } from "next/navigation";

import { ContentLayout } from "@/components/dashboard/content-layout";
import { AutomationManager } from "@/components/email/automation-manager";
import { EmailToolsNav } from "@/components/email/email-tools-nav";
import { getAutomationConsoleForCampaign } from "@/lib/emails/automation-console.mjs";
import { getOrCreateTemplatesForCampaign } from "@/lib/emails/templates.mjs";
import { env } from "@/lib/env.mjs";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = {
  title: "Automations",
  description: "Set up consent-aware waitlist email automations.",
};

export default async function AutomationsPage({ params, searchParams }) {
  const [{ id }, { recipe: requestedRecipeId }] = await Promise.all([params, searchParams]);
  const { campaign, scope } = await requireCampaignPage(id, "sendEmail");
  if (!campaign) return notFound();
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
        deliveryReady={Boolean(env.OUTBOX_DISPATCH_SECRET && env.RESEND_API_KEY)}
      />
    </ContentLayout>
  );
}
