import { after } from "next/server";

import { WaitlistAnalytics } from "@/components/product/waitlist-analytics";
import {
  createServerPerformanceContext,
  logElapsedServerPhase,
  withServerPhase,
} from "@/lib/server-performance.mjs";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ params }) {
  const performanceContext = createServerPerformanceContext("/waitlists/[id]/analytics");
  after(() => {
    logElapsedServerPhase(performanceContext, "response-total", performanceContext.startedAt);
  });
  const { id } = await params;
  const { campaign: waitlist } = await withServerPhase(
    performanceContext,
    "campaign-page-access",
    () => requireCampaignPage(id, "viewCampaign"),
  );
  return (
    <WaitlistAnalytics waitListId={waitlist.id} emailsEnabled={waitlist.sendEmailsToSubscribers} />
  );
}
