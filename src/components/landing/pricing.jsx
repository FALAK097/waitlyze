"use client";

import { Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import PromoBanner, { REDEEM_PROMO_EVENT } from "@/components/landing/promo-banner";
import SignupButton from "@/components/landing/signup-button";
import { Button } from "@/components/ui/button";
import { WAITLYZE_BFCM_PROMO, WAITLYZE_PRICING } from "@/lib/billing/pricing.mjs";
import { useBfcmPromoActive } from "@/lib/billing/use-bfcm-promo-active";

// Better Auth's React hooks are browser-only in this app, so the checkout CTA
// loads as a client-only island while the plan copy stays server-rendered.
const PricingCheckoutButton = dynamic(() => import("./pricing-checkout-button"), {
  ssr: false,
  loading: () => (
    <div className="h-9 w-full animate-pulse rounded-lg bg-product-bg-inset" aria-hidden="true" />
  ),
});

const freeFeatures = [
  "1 workspace with 1 waitlist",
  "100 cumulative signups",
  "Hosted page and embeddable form",
  "Page builder and launch templates",
  "Referral links and queue position",
  "Confirmation email through your connected Resend sender",
  "CSV export and full data ownership",
];

const proFeatures = [
  "Unlimited workspaces",
  "Unlimited waitlists and signups",
  "Unlimited workspace members",
  "Everything in Free",
  "Advanced analytics with trends and sources",
  "Referral milestones and reward tiers",
  "Email broadcasts and automations via your connected sender",
  "Remove Waitlyze branding and connect a custom domain",
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
  const proCardRef = useRef(null);
  const isPro = currentPlan === "PRO";
  const promoActive = useBfcmPromoActive();
  const displayedRegionalPricing = regionalPricing || clientRegionalPricing;

  useEffect(() => {
    function handleRedeemPromo(event) {
      const nextInterval = event?.detail?.interval || "annual";
      setInterval(nextInterval);
    }
    window.addEventListener(REDEEM_PROMO_EVENT, handleRedeemPromo);
    return () => window.removeEventListener(REDEEM_PROMO_EVENT, handleRedeemPromo);
  }, []);

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

  const title = feature ? `Unlock ${feature}` : "Start free. Upgrade when you need more.";
  const annualRegularPrice =
    displayedRegionalPricing?.annual?.formatted || WAITLYZE_PRICING.pro.annual.formatted;
  const annualPromoPrice =
    displayedRegionalPricing?.annual?.promo?.formatted ||
    WAITLYZE_PRICING.pro.annual.promo.formatted;
  const annualRegularMonthlyEquivalent =
    displayedRegionalPricing?.annual?.monthlyEquivalentFormatted ||
    WAITLYZE_PRICING.pro.annual.monthlyEquivalentFormatted;
  const annualPromoMonthlyEquivalent =
    displayedRegionalPricing?.annual?.promo?.monthlyEquivalentFormatted ||
    WAITLYZE_PRICING.pro.annual.promo.monthlyEquivalentFormatted;
  const showAnnualPromo = promoActive && interval === "annual";

  const intervalToggle = (
    <div
      className="inline-flex rounded-full border border-product-border-subtle bg-product-bg-surface p-1"
      aria-label="Billing interval"
      role="group"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-pressed={interval === "monthly"}
        className={interval === "monthly" ? "rounded-full bg-product-bg-inset" : "rounded-full"}
        onClick={() => setInterval("monthly")}
      >
        Monthly
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-pressed={interval === "annual"}
        className={interval === "annual" ? "rounded-full bg-product-bg-inset" : "rounded-full"}
        onClick={() => setInterval("annual")}
      >
        Annual{" "}
        <span className="ml-1 text-product-success-text">
          {promoActive
            ? `Black Friday · ${WAITLYZE_BFCM_PROMO.percentOff}% off`
            : `Save ${WAITLYZE_PRICING.pro.annualSavingsPercent}%`}
        </span>
      </Button>
    </div>
  );

  const sectionClass = isModal ? "px-1 py-2" : "wl-section wl-pricing";

  return (
    <section
      className={sectionClass}
      id={isModal ? undefined : "pricing"}
      data-pricing-section={isModal ? undefined : "true"}
      aria-labelledby={isModal ? undefined : "pricing-title"}
    >
      <div
        className={isModal ? "@container mx-auto w-full max-w-7xl" : "@container mx-auto w-full"}
      >
        {isModal ? (
          <header className="mx-auto mb-9 max-w-2xl text-center sm:mb-12">
            <h2 className="font-product-display text-3xl leading-tight tracking-tight sm:text-4xl">
              {title}
            </h2>
            <div className="mt-6">{intervalToggle}</div>
          </header>
        ) : (
          <div className="wl-section-heading wl-heading-with-link">
            <div>
              <p className="wl-eyebrow">SIMPLE, WORKSPACE-LEVEL PRICING</p>
              <h2 id="pricing-title">{title}</h2>
              <p>
                Free covers your first launch, from page to signups. Pro is there when you need
                unlimited lists, deeper analytics, and your own domain.
              </p>
            </div>
            {intervalToggle}
          </div>
        )}

        {promoActive && !isPro && (
          <div className={isModal ? "mb-6" : "mt-8"}>
            <PromoBanner
              variant="inline"
              isAnnualSelected={interval === "annual"}
              onRedeem={() => {
                setInterval("annual");
                const ctaButton = proCardRef.current?.querySelector("button:not(:disabled)");
                ctaButton?.focus();
              }}
            />
          </div>
        )}

        <div className="wl-pricing-grid grid w-full max-w-5xl grid-cols-1 gap-5 md:gap-6 @min-[56rem]:grid-cols-2">
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

          <article
            ref={proCardRef}
            className="relative flex flex-col rounded-2xl border border-product-text-primary bg-product-bg-surface p-6 shadow-lg sm:p-8"
          >
            <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold tracking-[0.14em] text-product-success-text uppercase">
                  PRO
                </p>
                {showAnnualPromo && (
                  <span className="inline-flex items-center rounded-full bg-product-accent-solid px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-product-accent-label">
                    {WAITLYZE_BFCM_PROMO.percentOff}% OFF · {WAITLYZE_BFCM_PROMO.code}
                  </span>
                )}
              </div>
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
              <p className="mt-6 flex flex-wrap items-baseline gap-2">
                {showAnnualPromo && (
                  <span className="font-product-display text-2xl font-medium text-product-text-muted line-through">
                    {annualRegularPrice}
                  </span>
                )}
                <span className="font-product-display text-4xl font-semibold tracking-tight">
                  {showAnnualPromo
                    ? annualPromoPrice
                    : displayedRegionalPricing?.[interval]?.formatted ||
                      WAITLYZE_PRICING.pro[interval].formatted}
                </span>
                <span className="text-sm text-product-text-secondary">
                  / {interval === "annual" ? "year" : "month"}{" "}
                  {displayedRegionalPricing ? "" : "USD"}
                </span>
              </p>
              {interval === "annual" && (
                <p className="mt-2 text-sm text-product-text-secondary">
                  {showAnnualPromo ? (
                    <>
                      Equivalent to{" "}
                      <strong className="font-semibold text-product-text-primary">
                        {annualPromoMonthlyEquivalent}/month
                      </strong>{" "}
                      <span className="line-through">{annualRegularMonthlyEquivalent}/month</span> ·
                      1st year with code{" "}
                      <span className="font-product-mono text-xs font-semibold text-product-text-primary">
                        {WAITLYZE_BFCM_PROMO.code}
                      </span>
                      , then {annualRegularPrice}/year
                    </>
                  ) : (
                    <>Equivalent to {annualRegularMonthlyEquivalent}/month</>
                  )}
                </p>
              )}
              {promoActive && interval === "monthly" && (
                <p className="mt-2 text-sm text-product-text-secondary">
                  <button
                    type="button"
                    onClick={() => setInterval("annual")}
                    className="cursor-pointer text-left font-medium text-product-success-text underline decoration-product-success-text/40 underline-offset-4 hover:decoration-product-success-text"
                  >
                    Black Friday: Switch to Annual for {WAITLYZE_BFCM_PROMO.percentOff}% off (
                    {annualPromoPrice}/year) with code {WAITLYZE_BFCM_PROMO.code}
                  </button>
                </p>
              )}
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
                <strong className="font-semibold text-product-text-primary">Need a hand?</strong>{" "}
                Annual Pro includes priority support from the founder, hands-on setup help, and
                personalized recommendations for your launch.
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
