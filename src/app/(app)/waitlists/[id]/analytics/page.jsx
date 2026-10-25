import { notFound } from "next/navigation";

import { WaitlistAnalytics } from "@/components/product/waitlist-analytics";
import { FREE_HISTORY_DAYS, normalizePlan } from "@/lib/billing/workspace-plan.mjs";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ params }) {
  const [{ id }, { user, workspace }] = await Promise.all([params, currentWorkspace()]);
  const waitlist = await prisma.waitList.findFirst({
    where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) },
    select: { id: true, sendEmailsToSubscribers: true, workspaceId: true },
  });
  if (!waitlist) notFound();
  // Plan-gated history window, resolved server-side. Free workspaces see the
  // most recent FREE_HISTORY_DAYS; the API clamps any larger request.
  const owner = waitlist.workspaceId
    ? await prisma.workspace.findUnique({
        where: { id: waitlist.workspaceId },
        select: { plan: true },
      })
    : null;
  const plan = normalizePlan(owner?.plan);
  const limited = plan === "FREE";
  return (
    <>
      {limited ? (
        <p
          className="mb-4 rounded-xl border border-product-border-subtle bg-product-bg-surface px-4 py-3 text-caption text-product-text-secondary"
          role="note"
        >
          Showing the last {FREE_HISTORY_DAYS} days — upgrade for all-time history.
        </p>
      ) : null}
      <WaitlistAnalytics
        waitListId={waitlist.id}
        emailsEnabled={waitlist.sendEmailsToSubscribers}
      />
    </>
  );
}
