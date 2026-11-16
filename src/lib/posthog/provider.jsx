"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

import { initClientPostHog, posthog } from "./client";
import { POSTHOG_EVENTS } from "./events.mjs";

function PostHogPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    // Skip hosted customer waitlist pages
    if (pathname.startsWith("/w/") || pathname.startsWith("/domain")) return;

    initClientPostHog();

    const url =
      window.location.origin +
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    const utmSource = searchParams?.get("utm_source") || undefined;
    const utmMedium = searchParams?.get("utm_medium") || undefined;
    const utmCampaign = searchParams?.get("utm_campaign") || undefined;

    posthog.capture("$pageview", {
      $current_url: url,
      page_path: pathname,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    });

    if (
      pathname === "/" ||
      pathname.startsWith("/templates") ||
      pathname.startsWith("/blog") ||
      pathname.startsWith("/pricing")
    ) {
      posthog.capture(POSTHOG_EVENTS.MARKETING_PAGE_VIEWED, {
        page_path: pathname,
        page_type: pathname === "/" ? "landing" : pathname.slice(1).split("/")[0],
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        referrer_domain: document.referrer ? new URL(document.referrer).hostname : undefined,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }) {
  useEffect(() => {
    initClientPostHog();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageViewTracker />
      </Suspense>
      {children}
    </>
  );
}
