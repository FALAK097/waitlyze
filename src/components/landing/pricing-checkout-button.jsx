"use client";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { createProCheckout } from "@/app/actions/billing";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

function CheckoutActionButton({
  isPro,
  currentInterval,
  billingNeedsAttention,
  canManageBilling,
  pending,
  session,
  sessionPending,
  onCheckout,
}) {
  if (isPro)
    return (
      <Button type="button" variant="product-outline" className="w-full" disabled>
        {currentInterval ? `You're on Pro (${currentInterval.toLowerCase()})` : "You're on Pro"}
      </Button>
    );
  if (billingNeedsAttention && canManageBilling)
    return (
      <Button type="button" variant="product-outline" className="w-full" disabled>
        Manage the existing subscription above
      </Button>
    );
  if (!canManageBilling)
    return (
      <Button type="button" variant="product-outline" className="w-full" disabled>
        Ask your workspace owner to upgrade
      </Button>
    );

  return (
    <Button
      type="button"
      variant="product-accent"
      size="product-action"
      className="group w-fit"
      onClick={onCheckout}
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
  );
}

export default function PricingCheckoutButton({
  interval,
  isPro,
  currentInterval,
  canManageBilling,
  workspaceId,
  billingNeedsAttention,
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { data: session, isPending: sessionPending } = useSession();
  const { openAuthModal } = useAuthModal();

  async function checkout() {
    if (!session && !sessionPending) {
      openAuthModal();
      return;
    }
    if (!session || sessionPending || pending || isPro || !canManageBilling) return;
    setError("");
    setPending(true);
    try {
      const result = await createProCheckout(interval, workspaceId);
      const destination = result?.portalUrl || result?.checkoutUrl;
      if (destination) {
        window.location.assign(destination);
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
      <CheckoutActionButton
        isPro={isPro}
        currentInterval={currentInterval}
        billingNeedsAttention={billingNeedsAttention}
        canManageBilling={canManageBilling}
        pending={pending}
        session={session}
        sessionPending={sessionPending}
        onCheckout={checkout}
      />
      {error && (
        <p className="mt-3 text-center text-xs text-product-danger-text" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
