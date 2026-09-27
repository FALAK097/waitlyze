import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { notFound } from "next/navigation";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
export const metadata = { title: "Overview" };
export default async function OverviewPage({ params }) {
  const { id } = await params;
  const { user, workspace } = await currentWorkspace();
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) }, select: { _count: { select: { signUps: true, impressions: true } } } });
  if (!waitlist) notFound();
  return <div className="product-section"><dl className="product-metrics"><div><dt>Subscribers</dt><dd>{waitlist._count.signUps.toLocaleString()}</dd></div><div><dt>Page views</dt><dd>{waitlist._count.impressions.toLocaleString()}</dd></div></dl><DashboardCharts waitListId={id} /></div>;
}
