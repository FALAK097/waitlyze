import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { notFound } from "next/navigation";
import { UserSegmentation } from "@/components/dashboard/user-segmentation";
export const metadata = { title: "Subscribers" };
export default async function SubscribersPage({ params }) {
  const { id } = await params;
  const { user, workspace } = await currentWorkspace();
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...campaignScope(user.id, "viewAudience", workspace.id) }, select: { id: true, name: true, showReferrals: true } });
  if (!waitlist) notFound();
  return <div className="product-section"><UserSegmentation waitlist={waitlist} /></div>;
}
