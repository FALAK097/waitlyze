import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { WaitlistNav } from "@/components/product/waitlist-nav";

export default async function WaitlistLayout({ children, params }) {
  const { id } = await params;
  const { user, workspace } = await currentWorkspace();
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) }, select: { id: true, name: true } });
  if (!waitlist) notFound();
  const canSendEmail = ["OWNER", "ADMIN"].includes(workspace.members[0]?.role);
  return <section><Link className="product-back-link" href="/wait-lists">← Back to waitlists</Link><h1 className="product-page-title">{waitlist.name || "Untitled waitlist"}</h1><WaitlistNav id={id} canSendEmail={canSendEmail} />{children}</section>;
}
