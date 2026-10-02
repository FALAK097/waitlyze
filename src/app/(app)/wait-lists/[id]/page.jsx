import Link from "next/link";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { notFound } from "next/navigation";
import { LaunchRehearsal } from "@/components/product/launch-rehearsal";
import { WaitlistAnalytics } from "@/components/product/waitlist-analytics";
import { LaunchReadiness } from "@/components/product/launch-readiness";
import { assessWaitlistReadiness } from "@/lib/campaigns/readiness.mjs";
export const metadata = { title: "Overview" };
export default async function OverviewPage({ params }) {
  const { id } = await params;
  const { user, workspace } = await currentWorkspace();
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) }, select: {
    id: true, status: true, templateSnapshot: true, templateRevision: true,
    publishedRevision: true, publishedTemplateRevision: true,
    customDomain: { select: { status: true } },
  } });
  if (!waitlist) notFound();
  const publication = waitlist.publishedRevision == null ? null : await prisma.waitListPublicationRevision.findUnique({
    where: { waitListId_revision: { waitListId: id, revision: waitlist.publishedRevision } },
    select: { snapshot: true },
  });
  const readiness = assessWaitlistReadiness({ ...waitlist, publishedSnapshot: publication?.snapshot ?? null });
  const initialRuns = await prisma.launchRehearsal.findMany({ where: { waitListId: id }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, status: true, checksPassed: true, checksFailed: true, checkResults: true, createdAt: true } });
  return <div className="product-section">
    {waitlist.status === "DRAFT" && <section className="product-panel"><h2 className="product-create-heading">Your waitlist is a draft.</h2><p className="product-help">It is private and cannot accept subscribers.</p><Link href={`/wait-lists/${id}/edit`} className="product-back-link">Review page →</Link></section>}
    <LaunchReadiness checks={readiness} />
    {waitlist.status !== "DRAFT" && <WaitlistAnalytics waitListId={id} />}
    <LaunchRehearsal waitListId={id} initialRuns={initialRuns} />
  </div>;
}
