import { WaitlistAnalytics } from "@/components/product/waitlist-analytics";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ params }) {
  const { id } = await params;
  const { campaign: waitlist } = await requireCampaignPage(id, "viewCampaign");
  return (
    <WaitlistAnalytics waitListId={waitlist.id} emailsEnabled={waitlist.sendEmailsToSubscribers} />
  );
}
