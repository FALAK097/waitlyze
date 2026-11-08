"use client";

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
      const result = await createProCheckout(interval);
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
      ) : canManageBilling ? (
        <Button
          type="button"
          className="w-full"
          onClick={checkout}
          disabled={pending || sessionPending}
        >
          {pending
            ? "Opening secure checkout…"
            : session
              ? "Continue to secure checkout"
              : "Sign up, then choose Pro"}
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
