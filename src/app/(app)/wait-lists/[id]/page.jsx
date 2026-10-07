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
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
export default async function OverviewPage({ params }) {
  const { id } = await params;
  const { user, workspace } = await currentWorkspace();
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) }, select: {
    id: true, userId: true, workspaceId: true, publicSlug: true, name: true, status: true, createdAt: true, updatedAt: true,
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
  const publicationMember = waitlist.workspaceId ? await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: waitlist.workspaceId, userId: user.id } },
    select: { role: true },
  }) : null;
  const canPublish = publicationMember
    ? ["OWNER", "ADMIN"].includes(publicationMember.role)
    : waitlist.userId === user.id;
  const readiness = assessWaitlistReadiness({ ...waitlist, canPublish, publishedSnapshot: publication?.snapshot ?? null });
  const publicationNeedsAction = readiness.find(({ key }) => key === "publication")?.status === "action";
  const initialRuns = await prisma.launchRehearsal.findMany({ where: { waitListId: id }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, status: true, checksPassed: true, checksFailed: true, checkResults: true, createdAt: true } });
  const lifecycle = {
    DRAFT: { title: "Get your waitlist ready", detail: canPublish ? "Review the page and signup flow, then publish when you’re ready." : "Review the page and signup flow. A workspace owner or admin can publish it when it’s ready." },
    PUBLISHED: { title: "Your waitlist is live", detail: "This page is published and can collect signups. Use the subscriber list and analytics to follow activity." },
    PAUSED: { title: "Signups are paused", detail: "The page is not currently accepting new signups. Existing subscriber records remain available." },
  }[waitlist.status];
  const editHref = `/wait-lists/${id}/edit#page-content`;
  const subscriberHref = `/wait-lists/${id}/subscribers`;
  return <div className={`product-section ${styles.overview}`}>
    <section className={styles.overviewHero} aria-labelledby="waitlist-overview-title">
      <div>
        <p className={styles.eyebrow}>Waitlist overview</p>
        <h2 id="waitlist-overview-title">{lifecycle.title}</h2>
        <p>{lifecycle.detail}</p>
        <dl className={styles.overviewFacts}>
          <div><dt>Status</dt><dd><span className={styles.status} data-status={waitlist.status}>{({ DRAFT: "Draft", PUBLISHED: "Published", PAUSED: "Paused" })[waitlist.status]}</span></dd></div>
          <div><dt>Subscribers</dt><dd>{waitlist._count.signUps.toLocaleString()}</dd></div>
          <div><dt>Created</dt><dd><time dateTime={waitlist.createdAt.toISOString()}>{dateFormat.format(waitlist.createdAt)}</time></dd></div>
          <div><dt>Last updated</dt><dd><time dateTime={waitlist.updatedAt.toISOString()}>{dateFormat.format(waitlist.updatedAt)}</time></dd></div>
        </dl>
      </div>
      <div className={styles.overviewActions}>
        {waitlist.status === "DRAFT"
          ? <Link href={`/wait-lists/${id}/edit${publicationNeedsAction ? "#publication-actions" : "#page-content"}`} className={buttonVariants()}>{publicationNeedsAction ? "Review publication controls" : "Edit page"}</Link>
          : waitlist.status === "PAUSED"
            ? <Link href={`/wait-lists/${id}/edit${publicationNeedsAction ? "#publication-actions" : "#page-content"}`} className={buttonVariants()}>{publicationNeedsAction ? "Review publication controls" : "Edit page"}</Link>
            : publicationNeedsAction
              ? <Link href={`/wait-lists/${id}/edit#publication-actions`} className={buttonVariants()}>Review publication controls</Link>
              : waitlist._count.signUps > 0
                ? <Link href={subscriberHref} className={buttonVariants()}>View subscribers</Link>
                : waitlist.publicSlug
                  ? <Link href={`/w/${waitlist.publicSlug}`} target="_blank" rel="noreferrer" className={buttonVariants()}>View live page</Link>
                  : <Link href={editHref} className={buttonVariants()}>Edit page</Link>}
        {waitlist.status === "DRAFT" && canPublish && publicationNeedsAction && <Link href={editHref} className={buttonVariants({ variant: "outline" })}>Edit page</Link>}
        {waitlist.status === "PAUSED" && waitlist._count.signUps > 0 && <Link href={subscriberHref} className={buttonVariants({ variant: "outline" })}>View subscribers</Link>}
        {waitlist.status === "PUBLISHED" && (publicationNeedsAction
          ? waitlist._count.signUps > 0
            ? <Link href={subscriberHref} className={buttonVariants({ variant: "outline" })}>View subscribers</Link>
            : waitlist.publicSlug
              ? <Link href={`/w/${waitlist.publicSlug}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>View live page</Link>
              : null
          : <Link href={editHref} className={buttonVariants({ variant: "outline" })}>Edit page</Link>)}
      </div>
    </section>
    {waitlist.status === "DRAFT"
      ? <LaunchReadiness checks={readiness} />
      : <><WaitlistAnalytics waitListId={id} /><LaunchReadiness checks={readiness} /></>}
    <LaunchRehearsal waitListId={id} initialRuns={initialRuns} className={styles.rehearsal} summaryClassName={styles.rehearsalSummary} titleClassName={styles.rehearsalTitle} bodyClassName={styles.rehearsalBody} />
  </div>;
}
