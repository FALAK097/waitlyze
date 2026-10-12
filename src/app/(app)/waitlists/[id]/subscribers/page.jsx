import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { notFound } from "next/navigation";
import { AudienceTable } from "@/components/dashboard/audience-table";
import { loadReferralReviews } from "@/lib/campaigns/referral-review-read.mjs";

export const metadata = { title: "Subscribers" };

export default async function SubscribersPage({ params }) {
  const { id } = await params;
  const { user, workspace } = await currentWorkspace();
  const waitlist = await prisma.waitList.findFirst({
    where: { id, ...campaignScope(user.id, "viewAudience", workspace.id) },
    select: { id: true, name: true },
  });
  if (!waitlist) notFound();
  const { reviews: initialReviews, failed: initialReviewsFailed } = await loadReferralReviews(prisma, id);
  const canManage = ["OWNER", "ADMIN"].includes(workspace.members[0]?.role);
  return <div className="product-section"><AudienceTable waitlist={waitlist} initialReviews={initialReviews} initialReviewsFailed={initialReviewsFailed} canManage={canManage} /></div>;
}
