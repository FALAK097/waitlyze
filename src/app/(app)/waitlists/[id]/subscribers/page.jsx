import { notFound } from "next/navigation";

import { AudienceTable } from "@/components/dashboard/audience-table";
import { loadReferralReviews } from "@/lib/campaigns/referral-review-read.mjs";
import prisma from "@/lib/prisma";
import { templateSnapshotSchema } from "@/lib/templates/catalog.mjs";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export const metadata = { title: "Signups" };

export default async function SubscribersPage({ params }) {
  const [{ id }, { user, workspace }] = await Promise.all([params, currentWorkspace()]);
  const waitlist = await prisma.waitList.findFirst({
    where: { id, ...campaignScope(user.id, "viewAudience", workspace.id) },
    select: {
      id: true,
      name: true,
      publicSlug: true,
      showReferrals: true,
      sendEmailsToSubscribers: true,
      publishedRevision: true,
      templateSnapshot: true,
    },
  });
  if (!waitlist) notFound();
  const [publication, reviewData] = await Promise.all([
    waitlist.publishedRevision
      ? prisma.waitListPublicationRevision.findUnique({
          where: {
            waitListId_revision: { waitListId: id, revision: waitlist.publishedRevision },
          },
          select: { snapshot: true },
        })
      : null,
    loadReferralReviews(prisma, id),
  ]);
  const draftSnapshot = templateSnapshotSchema.safeParse(waitlist.templateSnapshot);
  const publishedSnapshot = templateSnapshotSchema.safeParse(publication?.snapshot);
  const snapshotCollectsPhone = (parsed) =>
    parsed.success &&
    (parsed.data.form.collectPhone === true || parsed.data.form.requirePhone === true);
  // Show the column for the active published form or a draft that has phone
  // capture selected, while keeping historical numbers visible until publish.
  const collectPhone =
    snapshotCollectsPhone(draftSnapshot) || snapshotCollectsPhone(publishedSnapshot);
  const canManage = ["OWNER", "ADMIN"].includes(workspace.members[0]?.role);
  return (
    <div className="mt-6">
      <AudienceTable
        waitlist={{ ...waitlist, collectPhone }}
        initialReviews={reviewData.reviews}
        initialReviewsFailed={reviewData.failed}
        canManage={canManage}
      />
    </div>
  );
}
