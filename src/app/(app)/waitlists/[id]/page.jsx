import { replaceInvalidDraftPage, saveDraftPage } from "@/app/actions/draft-snapshot";
import { publishWaitlist, pauseWaitlist, rollbackWaitlist } from "@/app/actions/publication";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { SnapshotPageBuilder } from "@/components/product/snapshot-page-builder";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-metadata";
import { snapshotTemplate, templateSnapshotSchema } from "@/lib/templates/catalog.mjs";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = { title: "Builder" };

export default async function WaitListsEditPage(props) {
  const { id } = await props.params;
  const { campaign: waitList, role } = await requireCampaignPage(id, "editCampaign");
  const canPublish = ["OWNER", "ADMIN"].includes(role);

  const parsedSnapshot = templateSnapshotSchema.safeParse(waitList.templateSnapshot);
  const templateSnapshot = parsedSnapshot.success
    ? parsedSnapshot.data
    : snapshotTemplate("simple");
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
        turnstileConfigured={Boolean(
          env.TURNSTILE_SITE_KEY?.trim() && env.TURNSTILE_SECRET_KEY?.trim(),
        )}
        publicationOrigin={
          process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.BETTER_AUTH_URL || SITE_URL
        }
      />
    </ContentLayout>
  );
}
