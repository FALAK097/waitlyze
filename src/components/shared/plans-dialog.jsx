"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import Pricing from "@/components/landing/pricing";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Shared plan-comparison dialog. Renders the pricing table inside a properly
 * sized, scrollable Base UI dialog. Use it directly (controlled) when opening
 * from another dialog, or through `UpgradeButton` for feature locks.
 */
export function PlansDialog({
  trigger,
  open,
  onOpenChange,
  feature = null,
  currentPlan = "FREE",
  currentInterval = null,
  canManageBilling = true,
  workspaceId = null,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent
        className="max-h-[min(92dvh,52rem)] w-[min(58rem,calc(100%-1.5rem))] overflow-y-auto p-0 sm:max-w-none"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {feature ? `Compare plans — ${feature}` : "Compare Waitlyze plans"}
        </DialogTitle>
        <DialogClose className="absolute top-4 right-4 z-10 grid size-8 place-items-center rounded-full text-product-text-secondary transition-colors hover:bg-product-bg-inset hover:text-product-text-primary">
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <Pricing
          isModal
          feature={feature}
          currentPlan={currentPlan}
          currentInterval={currentInterval}
          canManageBilling={canManageBilling}
          workspaceId={workspaceId}
        />
      </DialogContent>
    </Dialog>
  );
}

/** Small helper for callers that manage dialog state sparingly. */
export function usePlansDialog() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
