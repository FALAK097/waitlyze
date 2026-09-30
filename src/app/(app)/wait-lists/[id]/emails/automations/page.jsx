import { notFound } from "next/navigation";
import { requireCampaignPage } from "@/lib/workspaces/authorize";
import { env } from "@/lib/env.mjs";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { getAutomationConsole } from "@/app/actions/automations";
import { EmailToolsNav } from "@/components/email/email-tools-nav";
import { AutomationManager } from "@/components/email/automation-manager";

export const metadata = { title: "Automations | Waitlyze", description: "Set up consent-aware waitlist email automations." };

export default async function AutomationsPage({ params }) {
  const { id } = await params;
  const { campaign } = await requireCampaignPage(id, "sendEmail");
  if (!campaign) return notFound();
  const data = await getAutomationConsole(campaign.id);
  return <ContentLayout title="Automations">
    <EmailToolsNav waitListId={campaign.id} current="automations" />
    <AutomationManager waitListId={campaign.id} initialRecipes={data.recipes} initialRuns={data.runs} deliveryReady={Boolean(env.OUTBOX_DISPATCH_SECRET && env.RESEND_API_KEY)} />
  </ContentLayout>;
}
