"use client";

import { GemIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { PlansDialog } from "@/components/shared/plans-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * One canonical "compare plans" CTA. No border or filled background — a quiet
 * link-style button with a gem icon that reads as an upgrade hint, not an alert.
 * Every locked feature uses this component so the flow looks and behaves the
 * same everywhere.
 */
const upgradeCtaClasses = cn(
  "h-auto gap-1.5 rounded-full bg-transparent px-3 py-1.5 text-xs font-semibold text-primary",
  "hover:bg-primary/10 hover:text-primary",
);

export function UpgradeButton({
  className,
  label = "Upgrade",
  feature,
  currentPlan = "FREE",
  currentInterval = null,
  canManageBilling = true,
  size = "sm",
}) {
  return (
    <PlansDialog
      feature={feature}
      currentPlan={currentPlan}
      currentInterval={currentInterval}
      canManageBilling={canManageBilling}
      trigger={
        <Button
          type="button"
          variant="ghost"
          className={cn(upgradeCtaClasses, size === "md" && "px-4 py-2.5 text-sm", className)}
        >
          <HugeiconsIcon icon={GemIcon} className="size-3.5 shrink-0" aria-hidden="true" />
          {label}
        </Button>
      }
    />
  );
}
