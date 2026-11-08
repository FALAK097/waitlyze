"use client";

import { useState } from "react";

import { createBillingPortal } from "@/app/actions/billing";
import Pricing from "@/components/landing/pricing";
import { Button } from "@/components/ui/button";

function dateLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? null
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export function WorkspaceBillingSettings({
  workspaceName,
  plan,
  interval,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  canManageBilling,
  waitlistCount,
  signupCount,
  memberCount,
  checkoutReturn = false,
}) {
  const [portalPending, setPortalPending] = useState(false);
  const [error, setError] = useState("");
  const periodEnd = dateLabel(currentPeriodEnd);
  const pro = plan === "PRO";

  async function openPortal() {
    setPortalPending(true);
    setError("");
    try {
      const result = await createBillingPortal();
      if (result?.portalUrl) {
        window.location.assign(result.portalUrl);
        return;
      }
      setError(result?.error || "Could not open billing management. Try again.");
    } catch {
      setError("Could not open billing management. Try again.");
    } finally {
      setPortalPending(false);
    }
  }

  return (
    <div className="max-w-190 min-w-0 flex-1" aria-labelledby="settings-panel-heading">
      <header className="mb-7">
        <h2 id="settings-panel-heading" className="mb-1.5!">
          Billing
        </h2>
        <p className="text-product-text-secondary">Plans and usage for {workspaceName}.</p>
      </header>

      {checkoutReturn && (
        <div
          className="mb-5 rounded-xl border border-product-border-subtle bg-product-bg-surface p-4 text-sm"
          role="status"
        >
          Checkout returned. We’re confirming the subscription with Dodo Payments; this page will
          update after its signed notification arrives.
        </div>
      )}

      <section
        className="mb-8 rounded-xl border border-product-border-subtle bg-product-bg-surface p-5 sm:p-6"
        aria-label="Current plan"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-product-text-secondary uppercase">
              Current plan
            </p>
            <h3 className="mt-2 font-product-display text-2xl font-semibold tracking-tight">
              {pro ? "Pro" : "Free"}
            </h3>
            <p className="mt-1 text-sm text-product-text-secondary">
              {pro
                ? `${interval === "ANNUAL" ? "Annual" : "Monthly"} billing · ${status === "PAST_DUE" ? "Payment needs attention" : cancelAtPeriodEnd ? "Cancels at period end" : "Active"}${periodEnd ? ` · ${cancelAtPeriodEnd ? "access through" : "renews"} ${periodEnd}` : ""}`
                : "Free forever · no card required"}
            </p>
          </div>
          {canManageBilling && pro && (
            <Button
              type="button"
              variant="product-outline"
              onClick={openPortal}
              disabled={portalPending}
            >
              {portalPending ? "Opening…" : "Manage subscription"}
            </Button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-product-border-subtle pt-4 sm:gap-4">
          <Usage label="Waitlists" value={waitlistCount} limit={pro ? 3 : 1} />
          <Usage label="Signups" value={signupCount} limit={pro ? 2000 : 100} />
          <Usage label="Members" value={memberCount} limit={pro ? 3 : 1} />
        </div>
        {!canManageBilling && (
          <p className="mt-4 text-xs text-product-text-secondary">
            Only this workspace’s owner can change its plan or billing details.
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-product-danger-text" role="alert">
            {error}
          </p>
        )}
      </section>

      <Pricing currentPlan={plan} currentInterval={interval} canManageBilling={canManageBilling} />
    </div>
  );
}

function Usage({ label, value, limit }) {
  const number = new Intl.NumberFormat("en");
  const atLimit = value >= limit;
  return (
    <div className="min-w-0">
      <p className="text-xs text-product-text-secondary">{label}</p>
      <p
        className={`mt-1 truncate text-sm font-semibold ${atLimit ? "text-product-danger-text" : "text-product-text-primary"}`}
      >
        {number.format(value)}{" "}
        <span className="font-normal text-product-text-secondary">/ {number.format(limit)}</span>
      </p>
    </div>
  );
}
