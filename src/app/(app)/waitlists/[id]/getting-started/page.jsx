import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { notFound } from "next/navigation";
import styles from "./getting-started.module.css";

export const metadata = { title: "Getting started" };

export default async function GettingStartedPage({ params }) {
  const [{ id }, { user, workspace }] = await Promise.all([params, currentWorkspace()]);
  const waitlist = await prisma.waitList.findFirst({
    where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) },
    select: {
      id: true, name: true, status: true, publicSlug: true,
      showReferrals: true, sendEmailsToSubscribers: true, templateRevision: true,
      _count: { select: { signUps: true } },
    },
  });
  if (!waitlist) notFound();
  const root = `/waitlists/${id}`;
  const steps = [
    {
      title: "Review your page design",
      body: "Open the editor, make it yours, and preview it as visitors will see it.",
      href: `${root}/edit`,
      action: "Open editor",
      done: waitlist.templateRevision > 1 || waitlist.status !== "DRAFT",
    },
    {
      title: "Turn on referrals",
      body: "Every joiner gets a personal link. Friends who join through it move them up in line.",
      href: `${root}/settings`,
      action: "Referral settings",
      done: waitlist.showReferrals,
    },
    {
      title: "Turn on emails",
      body: "New joiners get an email to confirm their spot.",
      href: `${root}/emails`,
      action: "Email settings",
      done: waitlist.sendEmailsToSubscribers,
    },
    {
      title: "Publish your page",
      body: "Your page stays private until you publish. You can unpublish any time.",
      href: `${root}/edit#publication-actions`,
      action: "Review & publish",
      done: waitlist.status === "PUBLISHED" || waitlist.status === "PAUSED",
    },
    {
      title: "Get your first signup",
      body: waitlist.publicSlug ? `Share your link to start collecting signups.` : "Publish first to get a shareable link.",
      href: waitlist.publicSlug ? `/w/${waitlist.publicSlug}` : `${root}/edit#publication-actions`,
      action: "Open live page",
      done: waitlist._count.signUps > 0,
    },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  return <div className="product-section">
    <div className="product-page-heading">
      <p className="product-eyebrow">{waitlist.name || "Untitled waitlist"}</p>
      <h1>Getting started</h1>
      <p className="product-description">{doneCount === steps.length ? "All set. Your waitlist is ready to grow." : `${doneCount} of ${steps.length} done. Work through the rest whenever you’re ready.`}</p>
    </div>
    <ol className={styles.list}>
      {steps.map((step) => <li key={step.title} className={styles.item} data-done={step.done || undefined}>
        <span className={styles.marker} aria-hidden="true">{step.done && <HugeiconsIcon icon={Tick01Icon} size={14} />}</span>
        <div className={styles.body}>
          <strong>{step.title}</strong>
          <p>{step.body}</p>
          {step.title === "Get your first signup" && waitlist.publicSlug && <p className={styles.share}>/w/{waitlist.publicSlug}</p>}
        </div>
        {step.done
          ? <span className={styles.action} aria-label={`${step.title}: done`}>Done</span>
          : <Link prefetch={false} href={step.href} className={styles.action}>{step.action} →</Link>}
      </li>)}
    </ol>
    <div className="product-actions">
      <Link prefetch={false} href={root}>Back to overview</Link>
    </div>
  </div>;
}
