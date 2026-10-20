import { notFound } from "next/navigation";
import { requireCampaignPage } from "@/lib/workspaces/authorize";
import { env } from "@/lib/env.mjs";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { getAutomationConsole, getAutomationRunDetail } from "@/app/actions/automations";
import { EmailToolsNav } from "@/components/email/email-tools-nav";
import { AutomationManager } from "@/components/email/automation-manager";
import prisma from "@/lib/prisma";
import { workspaceEmailDeliveryReady } from "@/lib/integrations/email-sender.mjs";

export const metadata = { title: "Automations", description: "Set up consent-aware waitlist email automations." };

export default async function AutomationsPage({ params, searchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { campaign } = await requireCampaignPage(id, "sendEmail");
  if (!campaign) return notFound();
  const [data, selectedRun, senderReady] = await Promise.all([
    getAutomationConsole(campaign.id),
    query.run ? getAutomationRunDetail(campaign.id, query.run) : null,
    workspaceEmailDeliveryReady(prisma, campaign.workspaceId, Boolean(env.RESEND_API_KEY && env.RESEND_WEBHOOK_SECRET)),
  ]);
  return <ContentLayout title="Automations">
    <EmailToolsNav waitListId={campaign.id} current="automations" />
    <AutomationManager waitListId={campaign.id} initialRecipes={data.recipes} deliveryReady={Boolean(env.OUTBOX_DISPATCH_SECRET && senderReady)} initialRecipeId={selectedRun?.recipeId || query.recipe} selectedRun={selectedRun} />
  </ContentLayout>;
}
