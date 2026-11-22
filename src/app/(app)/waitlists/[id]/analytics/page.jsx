import { AnalyticsLockedState } from "@/components/product/analytics-locked-state";
import { WaitlistAnalytics } from "@/components/product/waitlist-analytics";
import {
  InProductToolDrawer,
  OriginatingBlueprintBanner,
} from "@/components/tools/in-product-launch-lab";
import { getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import prisma from "@/lib/prisma";
import { getClaimedBlueprintForWaitlist } from "@/lib/tools/blueprint.mjs";
import { getToolBySlug } from "@/lib/tools/registry.mjs";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ params }) {
  const { id } = await params;
  const { campaign: waitlist, workspace, role } = await requireCampaignPage(id, "viewCampaign");
  const [entitlements, claimedBlueprint] = await Promise.all([
    getWorkspaceEntitlements(prisma, workspace.id),
    getClaimedBlueprintForWaitlist(prisma, waitlist.id),
  ]);
  if (!entitlements.analytics)
    return (
      <AnalyticsLockedState
        waitlistName={waitlist.name}
        workspaceId={workspace.id}
        canManageBilling={role === "OWNER"}
      />
    );
  const blueprintToolMeta = claimedBlueprint ? getToolBySlug(claimedBlueprint.toolSlug) : null;
  return (
    <>
      <div className="mb-3 flex justify-end">
        <InProductToolDrawer surface="analytics" waitlistKeyId={waitlist.id} />
      </div>
      {claimedBlueprint ? (
        <OriginatingBlueprintBanner
          blueprint={claimedBlueprint}
          toolTitle={blueprintToolMeta?.shortTitle}
        />
      ) : null}
      <WaitlistAnalytics
        key={waitlist.id}
        waitListId={waitlist.id}
        emailsEnabled={waitlist.sendEmailsToSubscribers}
      />
    </>
  );
}
