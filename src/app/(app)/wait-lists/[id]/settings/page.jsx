
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { DeleteWaitlist } from "@/components/product/delete-waitlist";
import { ReferralSettings } from "@/components/product/referral-settings";
import { WebhookSettings } from "@/components/product/webhook-settings";
import { CustomDomainSettings } from "@/components/product/custom-domain-settings";
import "@/components/product/waitlist-settings.css";
import { env } from "@/lib/env.mjs";
export const metadata = { title: "Waitlist settings" };
export default async function WaitlistSettings({ params }) {
  const { id } = await params;
  const { user, workspace } = await currentWorkspace();
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) }, select: { id: true, name: true, showReferrals: true } });
  if (!waitlist) notFound();
  const canDelete = ["OWNER", "ADMIN"].includes(workspace.members[0]?.role);
  return <div className="product-section product-waitlist-settings">
    <header className="product-waitlist-settings-heading"><h2>Settings</h2><p>Manage sharing and connections for this waitlist.</p></header>
    <section className="product-waitlist-setting" aria-labelledby="referral-settings-title">
      <h3 id="referral-settings-title">Referral sharing</h3>
      <ReferralSettings waitListId={waitlist.id} initialEnabled={waitlist.showReferrals} />
    </section>
    <Collapsible className="product-waitlist-setting-disclosure">
      <CollapsibleTrigger><span>Custom domain</span><span>Publish on a domain you own</span></CollapsibleTrigger><CollapsibleContent>
      <div className="product-waitlist-setting-body"><CustomDomainSettings waitListId={waitlist.id} canManage={canDelete} available={Boolean(env.VERCEL_TOKEN && env.VERCEL_PROJECT_ID && env.APP_ROOT_DOMAIN)} /></div>
    </CollapsibleContent></Collapsible>
    <Collapsible className="product-waitlist-setting-disclosure">
      <CollapsibleTrigger><span>Webhooks</span><span>Send signed signup events to your tools</span></CollapsibleTrigger><CollapsibleContent>
      <div className="product-waitlist-setting-body"><WebhookSettings waitListId={waitlist.id} canManage={canDelete} /></div>
    </CollapsibleContent></Collapsible>
    <Collapsible className="product-waitlist-setting-disclosure product-waitlist-setting-danger">
      <CollapsibleTrigger><span>Delete waitlist</span><span>Permanently remove this waitlist and its data</span></CollapsibleTrigger><CollapsibleContent>
      <div className="product-waitlist-setting-body"><p>Export any subscriber data you want to keep first.</p>{canDelete ? <DeleteWaitlist id={id} name={waitlist.name || "Untitled waitlist"} /> : <p className="product-help">An owner or admin can delete this waitlist.</p>}</div>
    </CollapsibleContent></Collapsible>
  </div>;
}
