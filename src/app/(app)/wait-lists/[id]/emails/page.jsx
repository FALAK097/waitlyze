import { cache } from "react";
import { requireCampaignPage } from "@/lib/workspaces/authorize";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { EmailTemplatesManager } from "@/components/email/email-templates-manager";
import { getOrCreateTemplates } from "@/app/actions/emails";


const getUser = cache(async (id) =>
  prisma.user.findUnique({ where: { id } })
);

export const metadata = {
  title: "Email Templates | Waitlyze",
  description: "Manage waitlist email templates",
};

export default async function EmailsPage(props) {
  const params = await props.params;
  const { id } = params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/");

  const user = await getUser(session.user.id);
  if (!user) return notFound();

  const { campaign: waitList } = await requireCampaignPage(id, "sendEmail");
  if (!waitList) return notFound();

  const templates = await getOrCreateTemplates(waitList.id);

  return (
    <ContentLayout title="Email Templates">


      <div className="mt-6">
        <EmailTemplatesManager
          waitListId={waitList.id}
          waitListName={waitList.name || "Project"}
          initialTemplates={templates}
        />
      </div>
    </ContentLayout>
  );
}
