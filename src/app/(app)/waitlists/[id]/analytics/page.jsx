import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { WaitlistAnalytics } from "@/components/product/waitlist-analytics";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ params }) {
  const [{ id }, { user, workspace }] = await Promise.all([params, currentWorkspace()]);
  const waitlist = await prisma.waitList.findFirst({
    where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) },
    select: { id: true },
  });
  if (!waitlist) notFound();
  return <WaitlistAnalytics waitListId={waitlist.id} />;
}
