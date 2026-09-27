import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { DeleteWaitlist } from "@/components/product/delete-waitlist";
export const metadata = { title: "Waitlist settings" };
export default async function WaitlistSettings({ params }) {
  const { id } = await params;
  const { user, workspace } = await currentWorkspace();
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) }, select: { id: true, name: true } });
  if (!waitlist) notFound();
  const canDelete = ["OWNER", "ADMIN"].includes(workspace.members[0]?.role);
  return <section className="product-settings-panel product-section"><h2>Delete waitlist</h2><p className="product-help">Remove this waitlist and its subscriber and analytics records. Export any data you want to keep first.</p>{canDelete ? <DeleteWaitlist id={id} name={waitlist.name || "Untitled waitlist"} /> : <p className="product-help">An owner or admin can delete this waitlist.</p>}</section>;
}
