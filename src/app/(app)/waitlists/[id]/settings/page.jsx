import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { ChatNotificationSettings } from "@/components/product/chat-notification-settings";
import { CustomDomainSettings } from "@/components/product/custom-domain-settings";
import { DeleteWaitlist } from "@/components/product/delete-waitlist";
import { ReferralSettings } from "@/components/product/referral-settings";
import { WaitlistSettingsNavigation } from "@/components/product/waitlist-settings-nav";
import { WebhookSettings } from "@/components/product/webhook-settings";
import { Button } from "@/components/ui/button";
import { getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { validateWebhookUrl } from "@/lib/webhooks/security.mjs";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

export const metadata = { title: "Waitlist settings" };

const VALID_SECTIONS = new Set(["referral", "domain", "webhooks", "notifications", "delete"]);

const webhookSelect = {
  id: true,
  name: true,
  url: true,
  eventTypes: true,
  enabled: true,
  includeSubscriberData: true,
  createdAt: true,
  lastDeliveredAt: true,
  deliveries: {
    select: {
      id: true,
      eventType: true,
      status: true,
      attempts: true,
      responseStatus: true,
      lastErrorCode: true,
      createdAt: true,
      deliveredAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  },
};

const notificationSelect = {
  id: true,
  waitListId: true,
  provider: true,
  status: true,
  triggers: true,
  lastTestedAt: true,
  lastErrorCode: true,
  updatedAt: true,
};

function safeDomain(row) {
  if (!row) return null;
  const hasCloudflareHostname = Boolean(row.providerId);
  return {
    id: row.id,
    hostname: row.hostname,
    status: hasCloudflareHostname ? row.status : row.status === "ACTIVE" ? "NEEDS_DNS" : row.status,
    verification: hasCloudflareHostname ? row.verification : [],
    dnsRecords: hasCloudflareHostname
      ? row.dnsRecords
      : [
          {
            type: "CNAME",
            name: row.hostname,
            value: process.env.CLOUDFLARE_CUSTOM_HOSTNAME_TARGET || "customers.waitlyze.com",
          },
        ],
    lastCheckedAt: row.lastCheckedAt,
    lastErrorCode: row.lastErrorCode,
  };
}

function SelectedWaitlistSettings({
  section,
  waitlist,
  canManage,
  canManageBilling,
  domainAvailable,
  proAvailable,
  initialSectionData,
}) {
  if (section === "notifications")
    return (
      <section className="max-w-190 min-w-0 flex-1" aria-labelledby="settings-panel-heading">
        <header className="mb-9 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 max-[760px]:mb-6 [&>div]:min-w-0">
          <div>
            <h2 id="settings-panel-heading" className="mb-1.5!">
              Notifications
            </h2>
            <p className="text-product-text-secondary">
              Connect Slack or Discord to keep your team in the loop.
            </p>
          </div>
          <Button
            variant="ghost"
            render={
              <Link prefetch={false} href="/docs/notifications" target="_blank" rel="noreferrer" />
            }
          >
            View docs <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
          </Button>
        </header>
        <ChatNotificationSettings
          waitListId={waitlist.id}
          canManage={canManage}
          initialChannels={initialSectionData || []}
        />
      </section>
    );
  if (section === "domain")
    return (
      <section className="max-w-190 min-w-0 flex-1" aria-labelledby="settings-panel-heading">
        <header className="mb-9 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 max-[760px]:mb-6 [&>div]:min-w-0">
          <div>
            <h2 id="settings-panel-heading" className="mb-1.5!">
              Custom domain
            </h2>
            <p className="text-product-text-secondary">Publish on a domain you own.</p>
          </div>
          <Button
            variant="ghost"
            render={<Link prefetch={false} href="/docs/domains" target="_blank" rel="noreferrer" />}
          >
            View docs <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
          </Button>
        </header>
        <CustomDomainSettings
          waitListId={waitlist.id}
          workspaceId={waitlist.workspaceId}
          canManage={canManage}
          canManageBilling={canManageBilling}
          available={domainAvailable}
          proAvailable={proAvailable}
          initialDomain={initialSectionData}
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
        <WebhookSettings
          waitListId={waitlist.id}
          canManage={canManage}
          initialData={initialSectionData}
        />
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
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const section = VALID_SECTIONS.has(query?.section) ? query.section : "referral";
  const { campaign: waitlist, role } = await requireCampaignPage(id, "viewCampaign");

  const [entitlements, initialSectionData] = await Promise.all([
    getWorkspaceEntitlements(prisma, waitlist.workspaceId),
    (async () => {
      if (section === "webhooks") {
        const rows = await prisma.webhookSubscription.findMany({
          where: { waitListId: waitlist.id },
          select: webhookSelect,
          orderBy: { createdAt: "asc" },
        });
        return JSON.parse(
          JSON.stringify({
            data: rows.map((row) => ({ ...row, url: validateWebhookUrl(row.url).safeUrl })),
            configured: Boolean(env.WEBHOOK_SECRET_ENCRYPTION_KEY),
          }),
        );
      }
      if (section === "notifications") {
        const channels = await prisma.waitlistNotificationChannel.findMany({
          where: { waitListId: waitlist.id },
          select: notificationSelect,
        });
        return JSON.parse(JSON.stringify(channels));
      }
      if (section === "domain") {
        const domainRow = await prisma.customDomain.findUnique({
          where: { waitListId: waitlist.id },
        });
        return JSON.parse(JSON.stringify(safeDomain(domainRow)));
      }
      return null;
    })(),
  ]);

  const canManage = ["OWNER", "ADMIN"].includes(role);
  const domainAvailable = Boolean(env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ZONE_ID);
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
          canManageBilling={role === "OWNER"}
          domainAvailable={domainAvailable}
          proAvailable={entitlements.customDomains}
          initialSectionData={initialSectionData}
        />
      </div>
    </div>
  );
}
