import { notFound } from "next/navigation";

import { listEmailRuns } from "@/app/actions/emails";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { EmailLogs } from "@/components/email/email-logs";
import { EmailToolsNav } from "@/components/email/email-tools-nav";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = {
  title: "Email logs",
  description: "Every automation and broadcast email run for this waitlist.",
};

export default async function EmailLogsPage({ params }) {
  const { id } = await params;
  const { campaign } = await requireCampaignPage(id, "sendEmail");
  if (!campaign) return notFound();
  const runs = await listEmailRuns(campaign.id);
  return (
    <ContentLayout title="Email logs">
      <EmailToolsNav waitListId={campaign.id} current="logs" />
      <EmailLogs waitListId={campaign.id} runs={runs} />
    </ContentLayout>
  );
}
