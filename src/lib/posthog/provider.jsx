"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

import { initClientPostHog, isExcludedPostHogPath, posthog } from "./client";
import { POSTHOG_EVENTS } from "./events.mjs";

const ALLOWED_QUERY_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "source",
]);

function buildSanitizedUrl(origin, pathname, searchParams) {
  if (!searchParams) return `${origin}${pathname}`;
  const cleanParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (ALLOWED_QUERY_PARAMS.has(key.toLowerCase())) {
      cleanParams.set(key, value);
    }
  }
  const queryString = cleanParams.toString();
  return queryString ? `${origin}${pathname}?${queryString}` : `${origin}${pathname}`;
}

function isMarketingAcquisitionPath(pathname) {
  return (
    pathname === "/" ||
    pathname.startsWith("/features") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/tools") ||
    pathname.startsWith("/research") ||
    pathname.startsWith("/templates") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/compare") ||
    pathname.startsWith("/alternatives")
  );
}

function safeReferrerDomain() {
  if (typeof document === "undefined" || !document.referrer) return undefined;
  try {
    return new URL(document.referrer).hostname || undefined;
  } catch {
    return undefined;
  }
}

function PostHogPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    // Route policy: immediately disable recording and tracking on customer waitlist routes
    if (isExcludedPostHogPath(pathname)) {
      if (typeof posthog.stopSessionRecording === "function") {
        posthog.stopSessionRecording();
      }
      if (typeof posthog.set_config === "function") {
        posthog.set_config({
          disable_session_recording: true,
          opt_out_capturing_by_default: true,
        });
      }
      return;
    }

    initClientPostHog();

    if (typeof posthog.set_config === "function") {
      posthog.set_config({
        opt_out_capturing_by_default: false,
        persistence: "localStorage+cookie",
        disable_session_recording: false,
      });
    }
    if (
      typeof posthog.sessionRecordingStarted === "function" &&
      !posthog.sessionRecordingStarted() &&
      typeof posthog.startSessionRecording === "function"
    ) {
      posthog.startSessionRecording();
    }

    const sanitizedUrl = buildSanitizedUrl(window.location.origin, pathname, searchParams);
    const utmSource = searchParams?.get("utm_source") || undefined;
    const utmMedium = searchParams?.get("utm_medium") || undefined;
    const utmCampaign = searchParams?.get("utm_campaign") || undefined;

    posthog.capture("$pageview", {
      $current_url: sanitizedUrl,
      page_path: pathname,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    });

    if (isMarketingAcquisitionPath(pathname)) {
      posthog.capture(POSTHOG_EVENTS.MARKETING_PAGE_VIEWED, {
        page_path: pathname,
        page_type: pathname === "/" ? "landing" : pathname.slice(1).split("/")[0],
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        referrer_domain: safeReferrerDomain(),
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageViewTracker />
      </Suspense>
      {children}
    </>
  );
}
