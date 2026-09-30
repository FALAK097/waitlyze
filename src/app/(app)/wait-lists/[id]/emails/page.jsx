import { cache } from "react";
import { requireCampaignPage } from "@/lib/workspaces/authorize";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { EmailTemplatesManager } from "@/components/email/email-templates-manager";
import { getOrCreateTemplates } from "@/app/actions/emails";
import { env } from "@/lib/env.mjs";


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

  const [templates, delivery] = await Promise.all([
    getOrCreateTemplates(waitList.id),
    prisma.outboxEvent.findMany({
      where: { waitListId: waitList.id, type: "SIGNUP_VERIFICATION_REQUESTED" },
      select: { status: true, attempts: true, lastErrorCode: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  const pending = delivery.filter((event) => event.status === "PENDING" || event.status === "PROCESSING").length;
  const failed = delivery.filter((event) => event.status === "FAILED").length;
  const configured = Boolean(env.OUTBOX_DISPATCH_SECRET);
  const latestFailure = delivery.find((event) => event.status === "FAILED");

  return (
    <ContentLayout title="Email Templates">
      <section className="delivery-health" aria-labelledby="delivery-health-title">
        <div>
          <p className="delivery-health-eyebrow">DELIVERY</p>
          <h2 id="delivery-health-title">Verification email delivery</h2>
          <p>{configured ? (pending ? `${pending} waiting to send` : "No emails waiting to send") : "Dispatcher not configured"}{failed ? ` · ${failed} failed in the latest 5` : ""}</p>
          {latestFailure?.lastErrorCode ? <p className="delivery-health-error">Latest issue: {latestFailure.lastErrorCode.replaceAll("_", " ").toLowerCase()}</p> : null}
        </div>
        <span className={`delivery-health-badge ${failed || !configured ? "is-warning" : ""}`}>{!configured ? "Setup needed" : failed ? "Needs attention" : "Key configured"}</span>
      </section>
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
