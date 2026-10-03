import Link from "next/link";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { notFound } from "next/navigation";
import { LaunchRehearsal } from "@/components/product/launch-rehearsal";
import { WaitlistAnalytics } from "@/components/product/waitlist-analytics";
import { LaunchReadiness } from "@/components/product/launch-readiness";
import { assessWaitlistReadiness } from "@/lib/campaigns/readiness.mjs";
import { buttonVariants } from "@/components/product/button-variants";
import styles from "@/components/product/waitlist-experience.module.css";
export const metadata = { title: "Overview" };
export default async function OverviewPage({ params }) {
  const { id } = await params;
  const { user, workspace } = await currentWorkspace();
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) }, select: {
    id: true, name: true, status: true, createdAt: true, updatedAt: true,
    templateSnapshot: true, templateRevision: true,
    publishedRevision: true, publishedTemplateRevision: true,
    customDomain: { select: { status: true } },
    _count: { select: { signUps: true } },
  } });
  if (!waitlist) notFound();
  const publication = waitlist.publishedRevision == null ? null : await prisma.waitListPublicationRevision.findUnique({
    where: { waitListId_revision: { waitListId: id, revision: waitlist.publishedRevision } },
    select: { snapshot: true },
  });
  const readiness = assessWaitlistReadiness({ ...waitlist, publishedSnapshot: publication?.snapshot ?? null });
  const initialRuns = await prisma.launchRehearsal.findMany({ where: { waitListId: id }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, status: true, checksPassed: true, checksFailed: true, checkResults: true, createdAt: true } });
  const lifecycle = {
    DRAFT: { title: "Keep shaping your launch page", detail: "This waitlist is a draft and is not open to signups. Review the page and its launch checks when you are ready." },
    PUBLISHED: { title: "Your waitlist is live", detail: "This page is published and can collect signups. Use the subscriber list and analytics to follow activity." },
    PAUSED: { title: "Signups are paused", detail: "The page is not currently accepting new signups. Existing subscriber records remain available." },
  }[waitlist.status];
  const date = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(value);
  return <div className={`product-section ${styles.overview}`}>
    <section className={styles.overviewHero} aria-labelledby="waitlist-overview-title">
      <div>
        <p className={styles.eyebrow}>Waitlist overview</p>
        <h2 id="waitlist-overview-title">{lifecycle.title}</h2>
        <p>{lifecycle.detail}</p>
        <dl className={styles.overviewFacts}>
          <div><dt>Status</dt><dd><span className={styles.status} data-status={waitlist.status}>{({ DRAFT: "Draft", PUBLISHED: "Published", PAUSED: "Paused" })[waitlist.status]}</span></dd></div>
          <div><dt>Subscribers</dt><dd>{waitlist._count.signUps.toLocaleString()}</dd></div>
          <div><dt>Created</dt><dd><time dateTime={waitlist.createdAt.toISOString()}>{date(waitlist.createdAt)}</time></dd></div>
          <div><dt>Last updated</dt><dd><time dateTime={waitlist.updatedAt.toISOString()}>{date(waitlist.updatedAt)}</time></dd></div>
        </dl>
      </div>
      <div className={styles.overviewActions}>
        <Link href={`/wait-lists/${id}/edit`} className={buttonVariants({ variant: "outline" })}>Edit page</Link>
        <Link href={`/wait-lists/${id}/subscribers`} className={buttonVariants()}>View subscribers</Link>
      </div>
    </section>
    {waitlist.status === "DRAFT"
      ? <LaunchReadiness checks={readiness} />
      : <><WaitlistAnalytics waitListId={id} /><LaunchReadiness checks={readiness} /></>}
    <LaunchRehearsal waitListId={id} initialRuns={initialRuns} className={styles.rehearsal} summaryClassName={styles.rehearsalSummary} titleClassName={styles.rehearsalTitle} bodyClassName={styles.rehearsalBody} />
  </div>;
}
