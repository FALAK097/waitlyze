"use client";

import { useEffect, useState } from "react";

import { isBfcmPromoActive, WAITLYZE_BFCM_PROMO } from "@/lib/billing/pricing.mjs";

const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Tracks whether the BFCM promo is live, re-checking at the promo's start and
 * expiry boundaries so long-lived open tabs drop the offer on time.
 */
export function useBfcmPromoActive() {
  // Seed from the clock at render time so the server-rendered HTML already
  // contains the banner when the campaign is running. Without this, the banner
  // only appears after hydration and pushes the whole page down (layout shift).
  // The initial render is consistent between server and hydration unless the
  // boundary is crossed mid-session, which the effect below corrects.
  const [active, setActive] = useState(() => isBfcmPromoActive(Date.now()));

  useEffect(() => {
    let timer = null;

    function sync() {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }

      const now = Date.now();
      const startsAt = Date.parse(WAITLYZE_BFCM_PROMO.startsAt);
      const expiresAt = Date.parse(WAITLYZE_BFCM_PROMO.expiresAt);
      setActive(isBfcmPromoActive(now));

      const nextBoundary = now < startsAt ? startsAt : expiresAt;
      const delay = nextBoundary - now;
      if (delay > 0 && delay <= MAX_TIMEOUT_MS) {
        timer = window.setTimeout(sync, delay + 1000);
      }
    }

    sync();

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return active;
}
