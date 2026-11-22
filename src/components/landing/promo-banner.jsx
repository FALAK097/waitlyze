"use client";

import {
  Cancel01Icon,
  Copy01Icon,
  DiscountTag01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { isBfcmPromoActive, WAITLYZE_BFCM_PROMO } from "@/lib/billing/pricing.mjs";
import { trackClientEvent } from "@/lib/posthog/client";
import { POSTHOG_EVENTS } from "@/lib/posthog/events.mjs";
import { cn } from "@/lib/utils";

const TOP_DISMISS_STORAGE_KEY = `wl_promo_dismissed_${WAITLYZE_BFCM_PROMO.id}`;
const APP_DISMISS_STORAGE_KEY = `wl_app_promo_dismissed_${WAITLYZE_BFCM_PROMO.id}`;
export const REDEEM_PROMO_EVENT = "waitlyze:redeem-promo";

async function copyPromoCodeToClipboard(code) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
      return true;
    }
  } catch {
    // Clipboard access can be denied in restricted contexts; fall back silently.
  }
  return false;
}

export default function PromoBanner({
  variant = "top",
  onRedeem,
  isAnnualSelected = false,
  className,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [redeemedInline, setRedeemedInline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const copyTimerRef = useRef(null);
  const redeemTimerRef = useRef(null);

  const storageKey =
    variant === "top"
      ? TOP_DISMISS_STORAGE_KEY
      : variant === "app"
        ? APP_DISMISS_STORAGE_KEY
        : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      if (window.localStorage.getItem(storageKey) === "1") {
        setDismissed(true);
      }
    } catch {
      // Ignore storage access errors in private browsing modes.
    }
  }, [storageKey]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      if (redeemTimerRef.current) window.clearTimeout(redeemTimerRef.current);
    };
  }, []);

  if (!isBfcmPromoActive() || dismissed) return null;

  async function handleCopyCode() {
    const ok = await copyPromoCodeToClipboard(WAITLYZE_BFCM_PROMO.code);
    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 2200);
    if (ok) {
      toast.success(`Copied ${WAITLYZE_BFCM_PROMO.code} to clipboard`);
    }
  }

  async function handleRedeem() {
    const ok = await copyPromoCodeToClipboard(WAITLYZE_BFCM_PROMO.code);
    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 2400);

    trackClientEvent(POSTHOG_EVENTS.BILLING_UPGRADE_CLICKED, {
      promo_id: WAITLYZE_BFCM_PROMO.id,
      promo_code: WAITLYZE_BFCM_PROMO.code,
      banner_variant: variant,
      pathname,
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(REDEEM_PROMO_EVENT, {
          detail: {
            interval: WAITLYZE_BFCM_PROMO.applicableInterval,
            code: WAITLYZE_BFCM_PROMO.code,
          },
        }),
      );
    }

    if (typeof onRedeem === "function") {
      onRedeem();
      setRedeemedInline(true);
      if (redeemTimerRef.current) window.clearTimeout(redeemTimerRef.current);
      redeemTimerRef.current = window.setTimeout(() => setRedeemedInline(false), 2400);
      if (ok) {
        toast.success(
          `Code ${WAITLYZE_BFCM_PROMO.code} copied — apply it at checkout for 40% off Pro Annual`,
        );
      }
      return;
    }

    const pricingSection =
      typeof document !== "undefined" ? document.getElementById("pricing") : null;
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: "smooth", block: "start" });
      if (ok) {
        toast.success(
          `Code ${WAITLYZE_BFCM_PROMO.code} copied — apply it at checkout for 40% off Pro Annual`,
        );
      }
      return;
    }

    if (ok) {
      toast.success(
        `Code ${WAITLYZE_BFCM_PROMO.code} copied — apply it at checkout for 40% off Pro Annual`,
      );
    }
    router.push("/#pricing");
  }

  function handleDismiss() {
    setDismissed(true);
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // Ignore storage write errors.
    }
  }

  const isInline = variant === "inline";
  const isApp = variant === "app";

  return (
    <aside
      aria-label="Black Friday promotion"
      className={cn(
        "text-product-text-primary",
        isInline
          ? "rounded-2xl border border-product-border-subtle bg-product-bg-surface px-4 py-3.5 shadow-2xs sm:px-6"
          : "border-b border-product-border-subtle bg-product-bg-surface",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2.5",
          isInline
            ? "max-w-none"
            : isApp
              ? "max-w-288 px-8 py-2.5 max-[359px]:px-4 max-md:px-5"
              : "max-w-[1120px] px-5 py-2.5 sm:px-6",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13.5px] leading-snug">
          <span className="inline-flex items-center gap-2 text-product-text-primary">
            <HugeiconsIcon
              icon={DiscountTag01Icon}
              size={17}
              className="shrink-0 text-product-text-primary"
              aria-hidden="true"
            />
            <span>
              <strong className="font-semibold text-product-text-primary">
                {WAITLYZE_BFCM_PROMO.percentOff}% off Pro Annual
              </strong>{" "}
              <span className="text-product-text-secondary">
                for Black Friday week only. Use code at checkout:
              </span>
            </span>
          </span>

          <button
            type="button"
            onClick={handleCopyCode}
            aria-label={`Copy discount code ${WAITLYZE_BFCM_PROMO.code}`}
            title="Click to copy discount code"
            className="inline-flex min-h-7 cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-product-border-control bg-product-bg-inset px-2.5 py-0.5 font-product-mono text-xs font-semibold tracking-wider text-product-text-primary transition-colors hover:border-product-text-primary hover:bg-product-border-subtle/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            <span>{WAITLYZE_BFCM_PROMO.code}</span>
            <HugeiconsIcon
              icon={copied ? Tick01Icon : Copy01Icon}
              size={13}
              className={cn(
                "shrink-0 transition-colors",
                copied ? "text-product-success-text" : "text-product-text-secondary",
              )}
              aria-hidden="true"
            />
            <span className="sr-only" aria-live="polite">
              {copied ? "Discount code copied to clipboard" : ""}
            </span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleRedeem}
            className="inline-flex min-h-8 cursor-pointer items-center justify-center rounded-full bg-product-text-primary px-4 py-1.5 text-xs font-semibold text-product-bg-page transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            {isInline && (redeemedInline || isAnnualSelected) ? "Copy & redeem" : "Redeem now"}
          </button>

          {!isInline && (
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss Black Friday banner"
              className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-product-text-secondary transition-colors hover:bg-product-bg-inset hover:text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
