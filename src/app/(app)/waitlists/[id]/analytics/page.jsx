import { notFound } from "next/navigation";

import { WaitlistAnalytics } from "@/components/product/waitlist-analytics";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ params }) {
  const [{ id }, { user, workspace }] = await Promise.all([params, currentWorkspace()]);
  const waitlist = await prisma.waitList.findFirst({
    where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) },
    select: { id: true, sendEmailsToSubscribers: true },
  });
  if (!waitlist) notFound();
  return (
    <WaitlistAnalytics waitListId={waitlist.id} emailsEnabled={waitlist.sendEmailsToSubscribers} />
  );
}
