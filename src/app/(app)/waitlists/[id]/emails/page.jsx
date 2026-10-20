import { getOrCreateTemplates } from "@/app/actions/emails";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { EmailTemplatesManager } from "@/components/email/email-templates-manager";
import { EmailToolsNav } from "@/components/email/email-tools-nav";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = {
  title: "Emails",
  description: "Write and preview the emails your subscribers receive.",
};

export default async function EmailsPage(props) {
  const params = await props.params;
  const { id } = params;

  const { campaign: waitList } = await requireCampaignPage(id, "sendEmail");
  const templates = await getOrCreateTemplates(waitList.id);

  return (
    <ContentLayout title="Emails">
      <EmailToolsNav waitListId={waitList.id} current="templates" />
      <EmailTemplatesManager waitListId={waitList.id} initialTemplates={templates} />
    </ContentLayout>
  );
}
