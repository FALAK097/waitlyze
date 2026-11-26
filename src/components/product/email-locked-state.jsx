import { LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { ContentLayout } from "@/components/dashboard/content-layout";
import { UpgradeButton } from "@/components/shared/upgrade-button";

export function EmailLockedState({
  title = "Emails",
  waitlistName,
  workspaceId,
  canManageBilling,
}) {
  return (
    <ContentLayout title={title}>
      <div className="rounded-2xl border border-product-border-subtle bg-product-bg-surface p-6 text-center sm:p-10">
        <div className="mx-auto max-w-md">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-product-bg-inset text-product-text-primary">
            <HugeiconsIcon icon={LockIcon} size={20} aria-hidden="true" />
          </span>
          <p className="mt-4 text-xs font-semibold tracking-widest text-product-success-text uppercase">
            Pro feature
          </p>
          <h2 className="mt-2 font-product-display text-2xl font-semibold tracking-tight">
            Send custom emails and updates to subscribers.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-product-text-secondary">
            {waitlistName
              ? `Upgrade to Pro to unlock email templates, broadcasts, automations, and delivery logs for ${waitlistName}.`
              : "Upgrade to Pro to unlock email templates, broadcasts, automations, and delivery logs."}
          </p>
          <UpgradeButton
            label={canManageBilling ? "Compare Pro plans" : "See Pro plans"}
            feature="Email marketing"
            canManageBilling={canManageBilling}
            workspaceId={workspaceId}
            size="md"
            className="mt-6 justify-center"
          />
        </div>
      </div>
    </ContentLayout>
  );
}
