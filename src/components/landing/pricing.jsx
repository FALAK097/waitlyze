"use client";

import { Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import SignupButton from "@/components/landing/signup-button";
import { Button } from "@/components/ui/button";
import { WAITLYZE_PRICING } from "@/lib/billing/pricing.mjs";

// Better Auth's React hooks are browser-only in this app, so the checkout CTA
// loads as a client-only island while the plan copy stays server-rendered.
const PricingCheckoutButton = dynamic(() => import("./pricing-checkout-button"), {
  ssr: false,
  loading: () => (
    <div className="h-9 w-full animate-pulse rounded-lg bg-product-bg-inset" aria-hidden="true" />
  ),
});

const freeFeatures = [
  "1 waitlist, drafts included",
  "100 cumulative signups per workspace",
  "Hosted page and embeddable form",
  "Page builder and launch templates",
  "Referral links and queue position",
  "Confirmation email through your connected Resend sender",
  "CSV export and full data ownership",
];

const proFeatures = [
  "Unlimited waitlists and signups",
  "Everything in Free",
  "Advanced analytics with trends and sources",
  "Referral milestones and reward tiers",
  "Email broadcasts and automations via your connected sender",
  "Remove Waitlyze branding and connect a custom domain",
  "Unlimited workspace members",
];

export default function Pricing({
  isModal = false,
  currentPlan = "FREE",
  currentInterval = null,
  canManageBilling = true,
  feature = null,
  regionalPricing = null,
  workspaceId = null,
  billingNeedsAttention = false,
}) {
  const [interval, setInterval] = useState("annual");
  const [clientRegionalPricing, setClientRegionalPricing] = useState(null);
  const isPro = currentPlan === "PRO";
  const displayedRegionalPricing = regionalPricing || clientRegionalPricing;

  useEffect(() => {
    if (regionalPricing) return;
    const controller = new AbortController();
    fetch("/api/billing/regional-pricing", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (!controller.signal.aborted) setClientRegionalPricing(result?.pricing || null);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [regionalPricing]);

  const sectionClass = isModal
    ? "px-1 py-2"
    : "wl-section wl-pricing bg-product-bg-page px-4 sm:px-5 md:px-8 lg:px-12";

  return (
    <section className={sectionClass} id={isModal ? undefined : "pricing"}>
      <div className="@container mx-auto w-full max-w-7xl">
        <header className="mx-auto mb-9 max-w-2xl text-center sm:mb-12">
          {!isModal && <p className="wl-eyebrow">SIMPLE, WORKSPACE-LEVEL PRICING</p>}
          <h2 className="font-product-display text-3xl leading-tight tracking-tight sm:text-4xl">
            {feature ? `Unlock ${feature}` : "Start free. Upgrade when you need more."}
          </h2>
          <div
            className="mx-auto mt-6 inline-flex rounded-full border border-product-border-subtle bg-product-bg-surface p-1"
            aria-label="Billing interval"
            role="group"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={interval === "monthly"}
              className={
                interval === "monthly" ? "rounded-full bg-product-bg-inset" : "rounded-full"
              }
              onClick={() => setInterval("monthly")}
            >
              Monthly
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={interval === "annual"}
              className={
                interval === "annual" ? "rounded-full bg-product-bg-inset" : "rounded-full"
              }
              onClick={() => setInterval("annual")}
            >
              Annual{" "}
              <span className="ml-1 text-product-success-text">
                Save {WAITLYZE_PRICING.pro.annualSavingsPercent}%
              </span>
            </Button>
          </div>
        </header>

        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 md:gap-6 @min-[56rem]:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-product-border-subtle bg-product-bg-surface p-6 sm:p-8">
            <div>
              <p className="flex min-h-6 items-center text-xs font-semibold tracking-[0.14em] text-product-text-secondary uppercase">
                Free
              </p>
              <h3 className="mt-3 font-product-display text-2xl tracking-tight">
                A real place to start
              </h3>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-product-display text-4xl font-semibold tracking-tight">
                  {displayedRegionalPricing?.zeroFormatted || WAITLYZE_PRICING.free.formatted}
                </span>
                <span className="text-sm text-product-text-secondary">forever</span>
              </p>
            </div>
            <ul className="mt-6 grid gap-3 text-sm text-product-text-secondary">
              {freeFeatures.map((item) => (
                <li className="flex items-start gap-2.5" key={item}>
                  <HugeiconsIcon
                    icon={Tick01Icon}
                    size={17}
                    className="mt-0.5 shrink-0 text-product-success-text"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <SignupButton className="w-full rounded-full">Start for free</SignupButton>
            </div>
          </article>

          <article className="relative flex flex-col rounded-2xl border border-product-text-primary bg-product-bg-surface p-6 shadow-lg sm:p-8">
            <div className="flex min-h-6 items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-[0.14em] text-product-success-text uppercase">
                PRO
              </p>
              {displayedRegionalPricing?.country && (
                <p className="inline-flex items-center gap-1.5 rounded-full bg-product-bg-inset px-2.5 py-1 text-xs font-medium text-product-text-secondary">
                  <span aria-hidden="true">{displayedRegionalPricing.flag}</span>
                  {displayedRegionalPricing.country} · {displayedRegionalPricing.currency}
                </p>
              )}
            </div>
            <div>
              <h3 className="mt-3 font-product-display text-2xl tracking-tight">
                More room to grow
              </h3>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-product-display text-4xl font-semibold tracking-tight">
                  {displayedRegionalPricing?.[interval]?.formatted ||
                    WAITLYZE_PRICING.pro[interval].formatted}
                </span>
                <span className="text-sm text-product-text-secondary">
                  / {interval === "annual" ? "year" : "month"}{" "}
                  {displayedRegionalPricing ? "" : "USD"}
                </span>
              </p>
            </div>
            <ul className="mt-6 grid gap-3 text-sm text-product-text-secondary">
              {proFeatures.map((item) => (
                <li className="flex items-start gap-2.5" key={item}>
                  <HugeiconsIcon
                    icon={Tick01Icon}
                    size={17}
                    className="mt-0.5 shrink-0 text-product-success-text"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {interval === "annual" && (
              <p className="mt-5 text-sm leading-relaxed text-product-text-secondary">
                <strong className="font-semibold text-product-text-primary">
                  Need help with email?
                </strong>{" "}
                Annual Pro includes one-time assisted Resend setup using your account and verified
                domain.
              </p>
            )}
            <div className="mt-auto pt-8">
              <PricingCheckoutButton
                interval={interval}
                isPro={isPro}
                currentInterval={currentInterval}
                canManageBilling={canManageBilling}
                workspaceId={workspaceId}
                billingNeedsAttention={billingNeedsAttention}
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
