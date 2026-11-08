import { ContentLayout } from "@/components/dashboard/content-layout";
import { PlanFeatureLocked } from "@/components/product/plan-feature-locked";
import { getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import prisma from "@/lib/prisma";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export default async function EmailsLayout({ children, params }) {
  const { id } = await params;
  const { workspace, role } = await requireCampaignPage(id, "sendEmail");
  const entitlements = await getWorkspaceEntitlements(prisma, workspace.id);
  if (!entitlements.emailMarketing)
    return (
      <ContentLayout title="Emails">
        <PlanFeatureLocked
          feature="Email marketing"
          title="Email your audience from your own sender."
          description="Pro unlocks broadcasts, email templates, and automations. Connect and verify your Resend sender first; Waitlyze never sends subscriber mail through its own Resend account."
          canManageBilling={role === "OWNER"}
        />
      </ContentLayout>
    );
  return children;
}
