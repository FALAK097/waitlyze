import { listEmailRuns } from "@/app/actions/emails";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { EmailLogs } from "@/components/email/email-logs";
import { EmailToolsNav } from "@/components/email/email-tools-nav";
import { EmailLockedState } from "@/components/product/email-locked-state";
import { getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import prisma from "@/lib/prisma";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = {
  title: "Email logs",
  description: "Every automation and broadcast email run for this waitlist.",
};

export default async function EmailLogsPage({ params }) {
  const { id } = await params;
  const { campaign, workspace, role } = await requireCampaignPage(id, "sendEmail");
  const entitlements = await getWorkspaceEntitlements(prisma, workspace.id);
  if (!entitlements.emailMarketing) {
    return (
      <EmailLockedState
        title="Email logs"
        waitlistName={campaign.name}
        workspaceId={workspace.id}
        canManageBilling={role === "OWNER"}
      />
    );
  }
  const runs = await listEmailRuns(campaign.id);
  return (
    <ContentLayout title="Email logs">
      <EmailToolsNav waitListId={campaign.id} current="logs" />
      <EmailLogs waitListId={campaign.id} runs={runs} />
    </ContentLayout>
  );
}
