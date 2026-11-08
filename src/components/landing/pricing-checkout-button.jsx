"use client";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { createProCheckout } from "@/app/actions/billing";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export default function PricingCheckoutButton({
  interval,
  isPro,
  currentInterval,
  canManageBilling,
  workspaceId,
  hasBillingCustomer,
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { data: session, isPending: sessionPending } = useSession();
  const { openAuthModal } = useAuthModal();

  async function checkout() {
    setError("");
    if (!session && !sessionPending) {
      openAuthModal();
      return;
    }
    if (sessionPending || pending || isPro || !canManageBilling) return;
    setPending(true);
    try {
      const result = await createProCheckout(interval, workspaceId);
      if (result?.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      setError(result?.error || "Could not start checkout. Please try again.");
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {isPro ? (
        <Button type="button" variant="product-outline" className="w-full" disabled>
          {currentInterval ? `You're on Pro (${currentInterval.toLowerCase()})` : "You're on Pro"}
        </Button>
      ) : hasBillingCustomer && canManageBilling ? (
        <Button type="button" variant="product-outline" className="w-full" disabled>
          Manage the existing subscription above
        </Button>
      ) : canManageBilling ? (
        <Button
          type="button"
          variant="product-accent"
          size="product-action"
          className="group w-fit"
          onClick={checkout}
          disabled={pending || sessionPending}
        >
          {pending
            ? "Opening secure checkout…"
            : session
              ? "Continue to secure checkout"
              : "Sign up, then choose Pro"}
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            size={18}
            aria-hidden="true"
            className="shrink-0 transition-transform duration-180 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Button>
      ) : (
        <Button type="button" variant="product-outline" className="w-full" disabled>
          Ask your workspace owner to upgrade
        </Button>
      )}
      {error && (
        <p className="mt-3 text-center text-xs text-product-danger-text" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
