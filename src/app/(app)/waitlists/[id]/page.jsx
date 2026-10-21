import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { replaceInvalidDraftPage, saveDraftPage } from "@/app/actions/draft-snapshot";
import { publishWaitlist, pauseWaitlist, rollbackWaitlist } from "@/app/actions/publication";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { SnapshotPageBuilder } from "@/components/product/snapshot-page-builder";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-metadata";
import { templateSnapshotSchema } from "@/lib/templates/catalog.mjs";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

const getUser = cache(async (id) => {
  return await prisma.user.findUnique({
    where: { id },
  });
});

export const metadata = { title: "Builder" };

export default async function WaitListsEditPage(props) {
  const params = await props.params;
  const { id } = params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!id || !session) {
    redirect("/");
  }

  const user = await getUser(session.user.id);

  if (!user) {
    return notFound();
  }

  const { campaign: waitList } = await requireCampaignPage(id, "editCampaign");

  if (!waitList) {
    return notFound();
  }
  const publicationMember = waitList.workspaceId
    ? await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: waitList.workspaceId, userId: user.id } },
        select: { role: true },
      })
    : null;
  const canPublish = publicationMember
    ? ["OWNER", "ADMIN"].includes(publicationMember.role)
    : waitList.userId === user.id;

  const parsedSnapshot = templateSnapshotSchema.safeParse(waitList.templateSnapshot);
  // A waitlist without a valid snapshot still runs on the classic editor. The
  // new Builder must not open it, or saving would replace that page with a
  // starter template.
  if (!parsedSnapshot.success)
    return (
      <ContentLayout title="Builder">
        <div className="grid max-w-2xl gap-4 py-8">
          <h2 className="m-0 text-section">{waitList.name || "This waitlist"}</h2>
          <p className="m-0 text-caption leading-relaxed text-product-text-secondary">
            This waitlist still uses the classic editor, so the new Builder stays closed for it. Its
            published page keeps working as it is.
          </p>
        </div>
      </ContentLayout>
    );
  const templateSnapshot = parsedSnapshot.data;
  const [publication, domain] = await Promise.all([
    waitList.publishedRevision
      ? prisma.waitListPublicationRevision.findUnique({
          where: {
            waitListId_revision: { waitListId: waitList.id, revision: waitList.publishedRevision },
          },
          select: { snapshot: true },
        })
      : null,
    prisma.customDomain.findUnique({
      where: { waitListId: waitList.id },
      select: { hostname: true, status: true },
    }),
  ]);
  const parsedPublished = templateSnapshotSchema.safeParse(publication?.snapshot);
  return (
    <ContentLayout title="Builder">
      <SnapshotPageBuilder
        waitList={{
          id: waitList.id,
          name: waitList.name,
          publicSlug: waitList.publicSlug,
          status: waitList.status,
          showReferrals: waitList.showReferrals,
          templateRevision: waitList.templateRevision,
          publishedRevision: waitList.publishedRevision,
          publishedTemplateRevision: waitList.publishedTemplateRevision,
          templateSnapshot,
          snapshotReplacement: !parsedSnapshot.success,
          publishedSnapshot: parsedPublished.success ? parsedPublished.data : null,
          customDomain: domain,
        }}
        saveDraftPage={saveDraftPage}
        replaceInvalidDraftPage={replaceInvalidDraftPage}
        publishPage={publishWaitlist}
        pausePage={pauseWaitlist}
        rollbackPage={rollbackWaitlist}
        canPublish={canPublish}
        publicationOrigin={
          process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.BETTER_AUTH_URL || SITE_URL
        }
      />
    </ContentLayout>
  );
}
