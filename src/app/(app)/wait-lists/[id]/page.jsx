import Link from "next/link";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { notFound } from "next/navigation";
import { LaunchRehearsal } from "@/components/product/launch-rehearsal";
import { WaitlistAnalytics } from "@/components/product/waitlist-analytics";
export const metadata = { title: "Overview" };
export default async function OverviewPage({ params }) {
  const { id } = await params;
  const { user, workspace } = await currentWorkspace();
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) }, select: { status: true } });
  if (!waitlist) notFound();
  const initialRuns = await prisma.launchRehearsal.findMany({ where: { waitListId: id }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, status: true, checksPassed: true, checksFailed: true, checkResults: true, createdAt: true } });
  if (waitlist.status === "DRAFT") return <div className="product-section"><section className="product-panel"><h2 className="product-create-heading">Your waitlist is a draft.</h2><p className="product-help">It is private and cannot accept subscribers. Review the page before publishing.</p><Link href={`/wait-lists/${id}/edit`} className="product-back-link">Edit page →</Link></section><LaunchRehearsal waitListId={id} initialRuns={initialRuns} /></div>;
  return <div className="product-section"><WaitlistAnalytics waitListId={id} /><LaunchRehearsal waitListId={id} initialRuns={initialRuns} /></div>;
}
