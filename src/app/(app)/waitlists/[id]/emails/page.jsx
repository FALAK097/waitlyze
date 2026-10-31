import { ContentLayout } from "@/components/dashboard/content-layout";
import { EmailTemplatesManager } from "@/components/email/email-templates-manager";
import { EmailToolsNav } from "@/components/email/email-tools-nav";
import { getOrCreateTemplatesForCampaign } from "@/lib/emails/templates.mjs";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = {
  title: "Emails",
  description: "Write and preview the emails your subscribers receive.",
};

export default async function EmailsPage(props) {
  const params = await props.params;
  const { id } = params;

  const { campaign: waitList, scope } = await requireCampaignPage(id, "sendEmail");
  const templates = await getOrCreateTemplatesForCampaign(waitList.id, scope);

  return (
    <ContentLayout title="Emails">
      <EmailToolsNav waitListId={waitList.id} current="templates" />
      <EmailTemplatesManager
        waitListId={waitList.id}
        waitListName={waitList.name}
        initialTemplates={templates}
      />
    </ContentLayout>
  );
}
