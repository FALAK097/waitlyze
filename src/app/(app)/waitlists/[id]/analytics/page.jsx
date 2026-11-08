import { AnalyticsLockedState } from "@/components/product/analytics-locked-state";
import { WaitlistAnalytics } from "@/components/product/waitlist-analytics";
import { getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import prisma from "@/lib/prisma";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ params }) {
  const { id } = await params;
  const { campaign: waitlist, workspace, role } = await requireCampaignPage(id, "viewCampaign");
  const entitlements = await getWorkspaceEntitlements(prisma, workspace.id);
  if (!entitlements.analytics)
    return (
      <AnalyticsLockedState waitlistName={waitlist.name} canManageBilling={role === "OWNER"} />
    );
  return (
    <WaitlistAnalytics
      key={waitlist.id}
      waitListId={waitlist.id}
      emailsEnabled={waitlist.sendEmailsToSubscribers}
    />
  );
}
