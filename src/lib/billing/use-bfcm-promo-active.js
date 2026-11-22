"use client";

import { useEffect, useState } from "react";

import { isBfcmPromoActive, WAITLYZE_BFCM_PROMO } from "@/lib/billing/pricing.mjs";

const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Tracks whether the BFCM promo is live, re-checking at the promo's start and
 * expiry boundaries so long-lived open tabs drop the offer on time.
 */
export function useBfcmPromoActive() {
  const [active, setActive] = useState(() => isBfcmPromoActive());

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
      setActive(now >= startsAt && now <= expiresAt);

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
