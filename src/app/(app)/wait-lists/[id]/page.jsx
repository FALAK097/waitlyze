import Link from "next/link";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { notFound } from "next/navigation";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { LaunchRehearsal } from "@/components/product/launch-rehearsal";
export const metadata = { title: "Overview" };
export default async function OverviewPage({ params }) {
  const { id } = await params;
  const { user, workspace } = await currentWorkspace();
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) }, select: { status: true, _count: { select: { signUps: true, impressions: true } } } });
  if (!waitlist) notFound();
  const initialRuns = await prisma.launchRehearsal.findMany({ where: { waitListId: id }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, status: true, checksPassed: true, checksFailed: true, checkResults: true, createdAt: true } });
  if (waitlist.status === "DRAFT") return <div className="product-section"><section className="product-panel"><h2 className="product-create-heading">Your waitlist is a draft.</h2><p className="product-help">It is private and cannot accept subscribers. Review the page before publishing.</p><Link href={`/wait-lists/${id}/edit`} className="product-back-link">Edit page →</Link></section><LaunchRehearsal waitListId={id} initialRuns={initialRuns} /></div>;
  return <div className="product-section"><dl className="product-metrics"><div><dt>Subscribers</dt><dd>{waitlist._count.signUps.toLocaleString()}</dd></div><div><dt>Page views</dt><dd>{waitlist._count.impressions.toLocaleString()}</dd></div></dl><LaunchRehearsal waitListId={id} initialRuns={initialRuns} /><DashboardCharts waitListId={id} /></div>;
}
