import { ContentLayout } from "@/components/dashboard/content-layout";
import { EmailTemplatesManager } from "@/components/email/email-templates-manager";
import { EmailToolsNav } from "@/components/email/email-tools-nav";
import {
  InProductToolDrawer,
  OriginatingBlueprintBanner,
} from "@/components/tools/in-product-launch-lab";
import { getOrCreateTemplatesForCampaign } from "@/lib/emails/templates.mjs";
import prisma from "@/lib/prisma";
import { getClaimedBlueprintForWaitlist } from "@/lib/tools/blueprint.mjs";
import { getToolBySlug } from "@/lib/tools/registry.mjs";
import { requireCampaignFeature } from "@/lib/workspaces/authorize";

export const metadata = {
  title: "Emails",
  description: "Write and preview the emails your subscribers receive.",
};

export default async function EmailsPage(props) {
  const params = await props.params;
  const { id } = params;

  const { campaign: waitList, scope } = await requireCampaignFeature(
    id,
    "sendEmail",
    "emailMarketing",
  );
  const [templates, claimedBlueprint] = await Promise.all([
    getOrCreateTemplatesForCampaign(waitList.id, scope),
    getClaimedBlueprintForWaitlist(prisma, waitList.id),
  ]);
  const blueprintToolMeta = claimedBlueprint ? getToolBySlug(claimedBlueprint.toolSlug) : null;

  return (
    <ContentLayout title="Emails">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <EmailToolsNav waitListId={waitList.id} current="templates" />
        <InProductToolDrawer surface="emails" waitlistKeyId={waitList.id} />
      </div>
      {claimedBlueprint ? (
        <OriginatingBlueprintBanner
          blueprint={claimedBlueprint}
          toolTitle={blueprintToolMeta?.shortTitle}
        />
      ) : null}
      <EmailTemplatesManager
        waitListId={waitList.id}
        waitListName={waitList.name}
        initialTemplates={templates}
      />
    </ContentLayout>
  );
}
