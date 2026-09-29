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
  const [initialReviews, canManage] = await Promise.all([
    prisma.referral.findMany({
      where: { signUp: { is: { waitListId: id } }, reviewStatus: { not: "CLEAR" } },
      select: { id: true, reviewStatus: true, reviewReason: true, resolution: true, reviewedAt: true, signUp: { select: { email: true, createdAt: true } }, referredBy: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    Promise.resolve(["OWNER", "ADMIN"].includes(workspace.members[0]?.role)),
  ]);
  return <div className="product-section"><AudienceTable waitlist={waitlist} initialReviews={initialReviews} canManage={canManage} /></div>;
}
