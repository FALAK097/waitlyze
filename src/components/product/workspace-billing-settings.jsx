"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createBillingPortal } from "@/app/actions/billing";
import Pricing from "@/components/landing/pricing";
import { Button } from "@/components/ui/button";

// Intl formatters are expensive to build; hoist a single shared instance.
const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
const numberFormat = new Intl.NumberFormat("en");

function dateLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : dateFormat.format(date);
}

function planStatusText({ interval, status, cancelAtPeriodEnd, periodEnd }) {
  const cadence = interval === "ANNUAL" ? "Annual" : "Monthly";
  const state =
    status === "PAST_DUE"
      ? "Payment needs attention"
      : cancelAtPeriodEnd
        ? "Cancels at period end"
        : "Active";
  const period = periodEnd
    ? ` · ${cancelAtPeriodEnd ? "access through" : "renews"} ${periodEnd}`
    : "";
  return `${cadence} billing · ${state}${period}`;
}

function CheckoutReturnBanner({ onRefresh }) {
  return (
    <div
      className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-product-border-subtle bg-product-bg-surface p-4 text-sm"
      role="status"
    >
      <span>Confirming your subscription with Dodo Payments.</span>
      <Button type="button" variant="ghost" size="sm" onClick={onRefresh}>
        Refresh status
      </Button>
    </div>
  );
}

function CurrentPlanCard({
  plan,
  interval,
  status,
  periodEnd,
  cancelAtPeriodEnd,
  canManageBilling,
  hasBillingCustomer,
  waitlistCount,
  signupCount,
  memberCount,
  portalPending,
  portalError,
  onOpenPortal,
}) {
  const pro = plan === "PRO";
  return (
    <section
      className="rounded-xl border border-product-border-subtle bg-product-bg-surface p-5 sm:p-6"
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
              ? planStatusText({ interval, status, cancelAtPeriodEnd, periodEnd })
              : hasBillingCustomer
                ? status === "PAST_DUE" || status === "ON_HOLD"
                  ? "Subscription needs attention"
                  : "Subscription ended"
                : "Free forever"}
          </p>
        </div>
        {canManageBilling && hasBillingCustomer && (
          <Button
            type="button"
            variant="product-outline"
            onClick={onOpenPortal}
            disabled={portalPending}
          >
            {portalPending ? "Opening…" : "Manage subscription"}
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-product-border-subtle pt-4 sm:gap-4">
        <Usage label="Waitlists" value={waitlistCount} limit={pro ? null : 1} />
        <Usage label="Signups used" value={signupCount} limit={pro ? null : 100} />
        <Usage label="Members" value={memberCount} limit={pro ? null : 1} />
      </div>
      {!canManageBilling && (
        <p className="mt-4 text-xs text-product-text-secondary">
          Only this workspace’s owner can change its plan or billing details.
        </p>
      )}
      {portalError && (
        <p className="mt-3 text-sm text-product-danger-text" role="alert">
          {portalError}
        </p>
      )}
    </section>
  );
}

export function WorkspaceBillingSettings({
  workspaceId,
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
  hasBillingCustomer,
  checkoutReturn = false,
}) {
  const router = useRouter();
  const [portalPending, setPortalPending] = useState(false);
  const [error, setError] = useState("");
  const periodEnd = dateLabel(currentPeriodEnd);

  useEffect(() => {
    if (!checkoutReturn || plan === "PRO") return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      router.refresh();
      attempts += 1;
      if (attempts >= 20) window.clearInterval(timer);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [checkoutReturn, plan, router]);

  async function openPortal() {
    setPortalPending(true);
    setError("");
    try {
      const result = await createBillingPortal(workspaceId);
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

      {checkoutReturn && plan !== "PRO" && (
        <CheckoutReturnBanner onRefresh={() => router.refresh()} />
      )}

      <CurrentPlanCard
        plan={plan}
        interval={interval}
        status={status}
        periodEnd={periodEnd}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
        canManageBilling={canManageBilling}
        hasBillingCustomer={hasBillingCustomer}
        waitlistCount={waitlistCount}
        signupCount={signupCount}
        memberCount={memberCount}
        portalPending={portalPending}
        portalError={error}
        onOpenPortal={openPortal}
      />

      <div className="mt-8">
        <Pricing
          currentPlan={plan}
          currentInterval={interval}
          canManageBilling={canManageBilling}
          workspaceId={workspaceId}
          hasBillingCustomer={hasBillingCustomer}
        />
      </div>
    </div>
  );
}

function Usage({ label, value, limit }) {
  const atLimit = limit !== null && value >= limit;
  return (
    <div className="min-w-0">
      <p className="text-xs text-product-text-secondary">{label}</p>
      <p
        className={`mt-1 truncate text-sm font-semibold ${atLimit ? "text-product-danger-text" : "text-product-text-primary"}`}
      >
        {numberFormat.format(value)}{" "}
        {limit === null ? (
          <span className="font-normal text-product-text-secondary">· unlimited</span>
        ) : (
          <span className="font-normal text-product-text-secondary">
            / {numberFormat.format(limit)}
          </span>
        )}
      </p>
    </div>
  );
}
