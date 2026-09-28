import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { notFound } from "next/navigation";
import { AudienceTable } from "@/components/dashboard/audience-table";

export const metadata = { title: "Subscribers" };

export default async function SubscribersPage({ params }) {
  const { id } = await params;
  const { user, workspace } = await currentWorkspace();
  const waitlist = await prisma.waitList.findFirst({
    where: { id, ...campaignScope(user.id, "viewAudience", workspace.id) },
    select: { id: true, name: true },
  });
  if (!waitlist) notFound();
  return <div className="product-section"><AudienceTable waitlist={waitlist} /></div>;
}
