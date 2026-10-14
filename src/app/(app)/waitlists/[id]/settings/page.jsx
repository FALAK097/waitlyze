import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { DeleteWaitlist } from "@/components/product/delete-waitlist";
import { ReferralSettings } from "@/components/product/referral-settings";
import { WebhookSettings } from "@/components/product/webhook-settings";
import { CustomDomainSettings } from "@/components/product/custom-domain-settings";
import { WaitlistSettingsNavigation } from "@/components/product/waitlist-settings-nav";
import "@/components/product/settings-page.css";
import "@/components/product/waitlist-settings.css";
import { env } from "@/lib/env.mjs";

export const metadata = { title: "Waitlist settings" };

const VALID_SECTIONS = ["referral", "domain", "webhooks", "delete"];

function SelectedWaitlistSettings({ section, waitlist, canManage, domainAvailable }) {
  if (section === "domain") return <section className="product-settings-content" aria-labelledby="settings-panel-heading">
    <header><h2 id="settings-panel-heading">Custom domain</h2><p>Publish on a domain you own.</p></header>
    <CustomDomainSettings waitListId={waitlist.id} canManage={canManage} available={domainAvailable} />
  </section>;
  if (section === "webhooks") return <section className="product-settings-content" aria-labelledby="settings-panel-heading">
    <header className="product-settings-header-split"><div><h2 id="settings-panel-heading">Webhooks</h2><p>Send signed signup events to your tools.</p></div><Button variant="ghost" render={<Link prefetch={false} href="/docs/webhooks" target="_blank" rel="noreferrer" />}>View docs <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" /></Button></header>
    <WebhookSettings waitListId={waitlist.id} canManage={canManage} />
  </section>;
  if (section === "delete") return <section className="product-settings-content" aria-labelledby="settings-panel-heading">
    <header><h2 id="settings-panel-heading">Delete waitlist</h2><p>Permanently remove this waitlist and its data.</p></header>
    {canManage
      ? <DeleteWaitlist id={waitlist.id} name={waitlist.name || "Untitled waitlist"} />
      : <p className="product-help">An owner or admin can delete this waitlist.</p>}
  </section>;
  return <section className="product-settings-content" aria-labelledby="settings-panel-heading">
    <header><h2 id="settings-panel-heading">Referral sharing</h2><p>Let subscribers invite others with a personal link.</p></header>
    <ReferralSettings waitListId={waitlist.id} initialEnabled={waitlist.showReferrals} />
  </section>;
}

export default async function WaitlistSettings({ params, searchParams }) {
  const [{ id }, query, { user, workspace }] = await Promise.all([params, searchParams, currentWorkspace()]);
  const section = VALID_SECTIONS.includes(query?.section) ? query.section : "referral";
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) }, select: { id: true, name: true, showReferrals: true } });
  if (!waitlist) notFound();
  const canManage = ["OWNER", "ADMIN"].includes(workspace.members[0]?.role);
  const domainAvailable = Boolean(env.VERCEL_TOKEN && env.VERCEL_PROJECT_ID && env.APP_ROOT_DOMAIN);
  return <div className="product-settings-page product-waitlist-settings-page">
    <div className="product-settings-layout">
      <aside className="product-settings-menu">
        <WaitlistSettingsNavigation waitlistId={waitlist.id} section={section} />
      </aside>
      <SelectedWaitlistSettings section={section} waitlist={waitlist} canManage={canManage} domainAvailable={domainAvailable} />
    </div>
  </div>;
}
