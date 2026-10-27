"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VerifyAction({ token, returnPath, waitlistName }) {
  const [state, setState] = useState("ready");
  const [referral, setReferral] = useState(null);

  async function verify() {
    setState("loading");
    try {
      const response = await fetch("/api/v1/sign_up/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "This link can’t be used.");
      setReferral(data.referral || null);
      setState("success");
    } catch (error) {
      setState("error");
      toast.error(error.message || "Verification failed. Request a new link from the waitlist.");
    }
  }

  const referralUrl = referral ? `${window.location.origin}${referral.path}` : null;
  const brand = waitlistName || referral?.waitListName || "this waitlist";

  async function copyReferralLink() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast.success("Referral link copied.");
    } catch {
      toast.error("Select the link and copy it.");
    }
  }

  return (
    <main
      className="grid min-h-svh place-items-center bg-product-bg-page p-6 text-product-text-primary"
      aria-labelledby="verify-title"
    >
      <section className="w-full max-w-lg rounded-2xl border border-product-border-subtle bg-product-bg-surface p-6 md:p-10">
        <p className="text-xs font-bold tracking-widest text-product-text-muted">{brand}</p>
        <h1
          id="verify-title"
          className="mt-2 mb-3 font-product-display text-title leading-tight font-semibold md:text-display"
        >
          {state === "success" ? "You’re confirmed" : "Confirm your email"}
        </h1>
        <p>
          {state === "success"
            ? "Your email is verified and your place is secured."
            : `Confirm this address to secure your place on ${brand}.`}
        </p>
        {state === "ready" || state === "loading" ? (
          <Button
            type="button"
            size="xl"
            variant="product-accent"
            onClick={verify}
            disabled={state === "loading"}
          >
            {state === "loading" ? "Confirming…" : "Confirm email"}
          </Button>
        ) : null}
        {referralUrl ? (
          <div className="mt-6 border-t border-product-border-subtle pt-5">
            <div className="flex gap-2 max-sm:flex-col">
              <Input
                value={referralUrl}
                readOnly
                aria-label="Your referral link"
                className="h-11 min-w-0 flex-1 rounded-lg border-product-border-control bg-product-bg-surface px-3 text-caption text-product-text-primary focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus"
              />
              <Button
                type="button"
                className="shrink-0 max-sm:w-full"
                size="xl"
                variant="product-accent"
                onClick={copyReferralLink}
              >
                Copy link
              </Button>
            </div>
            {referral.position && referral.hideCounts !== true ? (
              <p className="mt-3 text-sm text-product-text-secondary">
                You’re <strong>#{referral.displayPosition ?? referral.position}</strong> on {brand}.
              </p>
            ) : null}
            {typeof referral.points === "number" &&
            referral.showPoints !== false &&
            referral.hideCounts !== true ? (
              <p className="mt-3 text-sm text-product-text-secondary">
                You’ve earned <strong>{referral.points} points</strong>.
              </p>
            ) : null}
            {referral.showProgress !== false &&
            referral.hideCounts !== true &&
            referral.nextReward != null ? (
              <p className="mt-3 text-sm text-product-text-secondary">
                {referral.nextReward.remaining} more referral
                {referral.nextReward.remaining === 1 ? "" : "s"} to unlock{" "}
                <strong>{referral.nextReward.reward}</strong>.
              </p>
            ) : null}
          </div>
        ) : null}
        {(state === "success" || state === "error") && !referralUrl ? (
          <a href={returnPath}>Return to waitlist</a>
        ) : null}
      </section>
    </main>
  );
}
