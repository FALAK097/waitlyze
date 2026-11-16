"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { completeOnboarding } from "@/app/actions/onboarding";
import { trackClientEvent } from "@/lib/posthog/client";
import { POSTHOG_EVENTS } from "@/lib/posthog/events.mjs";

const ProductTour = dynamic(() =>
  import("@/components/onboarding/product-tour").then((module) => module.ProductTour),
);

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children, initialOpen, userName }) {
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState(initialOpen ? "first_run" : "account_menu");

  useEffect(() => {
    if (!initialOpen) return;
    const timer = window.setTimeout(() => setOpen(true), 350);
    return () => window.clearTimeout(timer);
  }, [initialOpen]);

  const openTour = useCallback(() => {
    setEntry("account_menu");
    setOpen(true);
  }, []);

  const closeTour = useCallback(
    async ({ outcome, stepId, stepIndex }) => {
      setOpen(false);
      trackClientEvent(POSTHOG_EVENTS.ONBOARDING_TOUR_FINISHED, {
        entry,
        outcome,
        step_id: stepId,
        step_number: stepIndex + 1,
      });

      try {
        const result = await completeOnboarding();
        if (!result?.ok) toast.error(result?.message || "Could not save your tour progress.");
      } catch {
        toast.error("Could not save your tour progress.");
      }
    },
    [entry],
  );

  const value = useMemo(() => ({ openTour }), [openTour]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {open && <ProductTour open={open} entry={entry} userName={userName} onClose={closeTour} />}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return context;
}
