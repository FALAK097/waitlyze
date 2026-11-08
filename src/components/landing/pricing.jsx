"use client";

import { Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { useState } from "react";

import SignupButton from "@/components/landing/signup-button";
import { Button } from "@/components/ui/button";

// Better Auth's React hooks are browser-only in this app, so the checkout CTA
// loads as a client-only island while the plan copy stays server-rendered.
const PricingCheckoutButton = dynamic(() => import("./pricing-checkout-button"), {
  ssr: false,
  loading: () => (
    <div className="h-9 w-full animate-pulse rounded-lg bg-product-bg-inset" aria-hidden="true" />
  ),
});

const freeFeatures = [
  "1 active waitlist",
  "100 cumulative signups per workspace",
  "Hosted page and embeddable form",
  "Page builder and launch templates",
  "Referral links and queue position",
  "Connected sender for confirmation email",
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
}) {
  const [interval, setInterval] = useState("annual");
  const isPro = currentPlan === "PRO";

  const sectionClass = isModal
    ? "px-1 py-2"
    : "wl-section wl-pricing bg-product-bg-page px-4 sm:px-5 md:px-8 lg:px-12";

  return (
    <section className={sectionClass} id={isModal ? undefined : "pricing"}>
      <div className="mx-auto w-full max-w-7xl">
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
              Annual <span className="ml-1 text-product-success-text">Save 72%</span>
            </Button>
          </div>
        </header>

        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2 md:gap-6">
          <article className="flex flex-col rounded-2xl border border-product-border-subtle bg-product-bg-surface p-6 sm:p-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-product-text-secondary uppercase">
                Free
              </p>
              <h3 className="mt-3 font-product-display text-2xl tracking-tight">
                A real place to start
              </h3>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-product-display text-4xl font-semibold tracking-tight">
                  $0
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
            <span className="absolute top-4 right-4 rounded-full bg-product-accent-solid px-3 py-1 text-xs font-semibold text-product-accent-label">
              Pro
            </span>
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-product-text-secondary uppercase">
                For growing launches
              </p>
              <h3 className="mt-3 font-product-display text-2xl tracking-tight">
                More room to grow
              </h3>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-product-display text-4xl font-semibold tracking-tight">
                  {regionalPricing?.[interval]?.formatted ||
                    (interval === "annual" ? "$50" : "$15")}
                </span>
                <span className="text-sm text-product-text-secondary">
                  / {interval === "annual" ? "year" : "month"}
                </span>
              </p>
              {regionalPricing?.country ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-product-bg-inset px-2.5 py-1 text-xs font-medium text-product-text-secondary">
                  <span aria-hidden="true">{regionalPricing.flag}</span>
                  {regionalPricing.country} · {regionalPricing.currency}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-product-text-secondary">Taxes at checkout</p>
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
            <div className="mt-auto pt-8">
              <PricingCheckoutButton
                interval={interval}
                isPro={isPro}
                currentInterval={currentInterval}
                canManageBilling={canManageBilling}
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
