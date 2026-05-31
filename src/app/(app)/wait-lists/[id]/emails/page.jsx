import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { EmailTemplatesManager } from "@/components/email/email-templates-manager";
import { getOrCreateTemplates } from "@/app/actions/emails";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const getUser = cache(async (id) =>
  prisma.user.findUnique({ where: { id } })
);

const getWaitList = cache(async (id, userId) =>
  prisma.waitList.findUnique({ where: { id, userId }, select: { id: true, name: true } })
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

  const waitList = await getWaitList(id, user.id);
  if (!waitList) return notFound();

  const templates = await getOrCreateTemplates(waitList.id);

  return (
    <ContentLayout title="Email Templates">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/wait-lists">WaitLists</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/wait-lists/${waitList.id}/edit`}>
                {waitList.name || "Waitlist"}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>Emails</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

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
