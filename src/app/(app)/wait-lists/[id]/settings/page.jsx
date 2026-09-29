import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { DeleteWaitlist } from "@/components/product/delete-waitlist";
import { ReferralSettings } from "@/components/product/referral-settings";
export const metadata = { title: "Waitlist settings" };
export default async function WaitlistSettings({ params }) {
  const { id } = await params;
  const { user, workspace } = await currentWorkspace();
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) }, select: { id: true, name: true, showReferrals: true } });
  if (!waitlist) notFound();
  const canDelete = ["OWNER", "ADMIN"].includes(workspace.members[0]?.role);
  return <div className="product-settings-sections product-section">
    <section className="product-settings-panel" aria-labelledby="referral-settings-title">
      <h2 id="referral-settings-title">Referral sharing</h2>
      <p className="product-help">Let new subscribers invite people with a personal link. Referral credit requires both signup email addresses to be verified.</p>
      <ReferralSettings waitListId={waitlist.id} initialEnabled={waitlist.showReferrals} />
    </section>
    <section className="product-settings-panel" aria-labelledby="delete-waitlist-title">
      <h2 id="delete-waitlist-title">Delete waitlist</h2>
      <p className="product-help">Remove this waitlist and its subscriber and analytics records. Export any data you want to keep first.</p>
      {canDelete ? <DeleteWaitlist id={id} name={waitlist.name || "Untitled waitlist"} /> : <p className="product-help">An owner or admin can delete this waitlist.</p>}
    </section>
  </div>;
}
