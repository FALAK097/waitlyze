import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomDomainSettings } from "@/components/product/custom-domain-settings";
import { DeleteWaitlist } from "@/components/product/delete-waitlist";
import { ReferralSettings } from "@/components/product/referral-settings";
import { WaitlistSettingsNavigation } from "@/components/product/waitlist-settings-nav";
import { WebhookSettings } from "@/components/product/webhook-settings";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export const metadata = { title: "Waitlist settings" };

const VALID_SECTIONS = new Set(["referral", "domain", "webhooks", "delete"]);

function SelectedWaitlistSettings({ section, waitlist, canManage, domainAvailable }) {
  if (section === "domain")
    return (
      <section className="max-w-190 min-w-0 flex-1" aria-labelledby="settings-panel-heading">
        <header className="mb-9 max-[760px]:mb-6">
          <h2 id="settings-panel-heading" className="mb-1.5!">
            Custom domain
          </h2>
          <p className="text-product-text-secondary">Publish on a domain you own.</p>
        </header>
        <CustomDomainSettings
          waitListId={waitlist.id}
          canManage={canManage}
          available={domainAvailable}
        />
      </section>
    );
  if (section === "webhooks")
    return (
      <section className="max-w-190 min-w-0 flex-1" aria-labelledby="settings-panel-heading">
        <header className="mb-9 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 max-[760px]:mb-6 [&>div]:min-w-0">
          <div>
            <h2 id="settings-panel-heading" className="mb-1.5!">
              Webhooks
            </h2>
            <p className="text-product-text-secondary">Send signed signup events to your tools.</p>
          </div>
          <Button
            variant="ghost"
            render={
              <Link prefetch={false} href="/docs/webhooks" target="_blank" rel="noreferrer" />
            }
          >
            View docs <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
          </Button>
        </header>
        <WebhookSettings waitListId={waitlist.id} canManage={canManage} />
      </section>
    );
  if (section === "delete")
    return (
      <section className="max-w-190 min-w-0 flex-1" aria-labelledby="settings-panel-heading">
        <header className="mb-9 max-[760px]:mb-6">
          <h2 id="settings-panel-heading" className="mb-1.5!">
            Delete waitlist
          </h2>
          <p className="text-product-text-secondary">
            Permanently remove this waitlist and its data.
          </p>
        </header>
        {canManage ? (
          <DeleteWaitlist id={waitlist.id} name={waitlist.name || "Untitled waitlist"} />
        ) : (
          <p className="mb-5! max-w-prose text-sm leading-relaxed text-product-text-secondary">
            An owner or admin can delete this waitlist.
          </p>
        )}
      </section>
    );
  return (
    <section className="max-w-190 min-w-0 flex-1" aria-labelledby="settings-panel-heading">
      <header className="mb-9 max-[760px]:mb-6">
        <h2 id="settings-panel-heading" className="mb-1.5!">
          Referral sharing
        </h2>
        <p className="text-product-text-secondary">
          Let subscribers invite others with a personal link.
        </p>
      </header>
      <ReferralSettings waitListId={waitlist.id} initialEnabled={waitlist.showReferrals} />
    </section>
  );
}

export default async function WaitlistSettings({ params, searchParams }) {
  const [{ id }, query, { user, workspace }] = await Promise.all([
    params,
    searchParams,
    currentWorkspace(),
  ]);
  const section = VALID_SECTIONS.has(query?.section) ? query.section : "referral";
  const waitlist = await prisma.waitList.findFirst({
    where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) },
    select: { id: true, name: true, showReferrals: true },
  });
  if (!waitlist) notFound();
  const canManage = ["OWNER", "ADMIN"].includes(workspace.members[0]?.role);
  const domainAvailable = Boolean(env.VERCEL_TOKEN && env.VERCEL_PROJECT_ID && env.APP_ROOT_DOMAIN);
  return (
    <div className="mx-auto w-full max-w-280">
      <div className="flex items-start gap-8 max-[760px]:flex-col max-[760px]:gap-8 lg:gap-12 xl:gap-18">
        <aside className="sticky top-6 w-52.5 min-w-0 shrink-0 max-[760px]:static max-[760px]:w-full">
          <WaitlistSettingsNavigation waitlistId={waitlist.id} section={section} />
        </aside>
        <SelectedWaitlistSettings
          section={section}
          waitlist={waitlist}
          canManage={canManage}
          domainAvailable={domainAvailable}
        />
      </div>
    </div>
  );
}
