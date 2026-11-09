import { LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { ScheduledBroadcastCancellation } from "@/components/product/scheduled-broadcast-cancellation";
import { UpgradeButton } from "@/components/shared/upgrade-button";

const EMPTY_SCHEDULED_BROADCASTS = Object.freeze([]);

export function PlanFeatureLocked({
  feature,
  title,
  description,
  canManageBilling,
  workspaceId,
  waitListId,
  scheduledBroadcasts = EMPTY_SCHEDULED_BROADCASTS,
}) {
  return (
    <section
      className="mx-auto grid min-h-112 w-full max-w-190 place-items-center px-4 py-10"
      aria-labelledby="plan-feature-title"
    >
      <div className="w-full max-w-xl rounded-2xl border border-product-border-subtle bg-product-bg-surface p-6 text-center shadow-sm sm:p-9">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-product-bg-inset text-product-text-primary">
          <HugeiconsIcon icon={LockIcon} size={21} aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-semibold tracking-widest text-product-success-text uppercase">
          Pro feature
        </p>
        <h2
          id="plan-feature-title"
          className="mt-2 font-product-display text-2xl font-semibold tracking-tight"
        >
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-product-text-secondary">
          {description}
        </p>
        <UpgradeButton
          label={canManageBilling ? "Compare Pro plans" : "See Pro plans"}
          feature={feature}
          canManageBilling={canManageBilling}
          workspaceId={workspaceId}
          size="md"
          className="mt-6 justify-center"
        />
        {waitListId && scheduledBroadcasts.length > 0 && (
          <ScheduledBroadcastCancellation
            waitListId={waitListId}
            broadcasts={scheduledBroadcasts}
          />
        )}
      </div>
    </section>
  );
}
