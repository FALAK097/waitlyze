"use client";

import posthog from "posthog-js";

import { env } from "../env.mjs";
import { POSTHOG_RELAY_PREFIX } from "./proxy.mjs";

let clientInitialized = false;

export function isExcludedPostHogPath(pathname) {
  if (!pathname) return false;
  return pathname.startsWith("/w/") || pathname.startsWith("/domain");
}

export function isPublicPostHogPath(pathname) {
  if (!pathname) return false;
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
    pathname.startsWith("/alternatives") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/refund-policy")
  );
}

function resolveUiHost(configuredHost) {
  const normalized = String(configuredHost || "")
    .trim()
    .toLowerCase();
  if (normalized.includes("eu.i.posthog.com") || normalized.includes("eu.posthog.com")) {
    return "https://eu.posthog.com";
  }
  return "https://us.posthog.com";
}

/**
 * Initializes the PostHog browser SDK through the first-party `/api/t` relay:
 * - Preserves anonymous session & distinct IDs across OAuth redirects so pre-signup
 *   attribution, UTMs, and session replays link cleanly to authenticated users.
 * - Keeps `person_profiles: "identified_only"` so anonymous browsing does not create
 *   identified person profiles until sign-in.
 * - Masks all inputs, passwords, emails, and marked sensitive elements in Session Replay.
 * - Automatically tags localhost/loopback traffic with `$internal_or_test_user` for
 *   PostHog's internal/test account filter cohort.
 * - Strictly excludes customer-hosted waitlist pages (`/w/*` and `/domain`).
 */
export function initClientPostHog() {
  if (typeof window === "undefined" || clientInitialized) return posthog;

  const token = env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const configuredHost = env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!token) return posthog;

  const pathname = window.location.pathname;
  // Never run or track on hosted customer waitlist pages (/w/* or custom domains)
  if (isExcludedPostHogPath(pathname)) {
    return posthog;
  }

  try {
    clientInitialized = true;
    posthog.init(token, {
      api_host: POSTHOG_RELAY_PREFIX,
      ui_host: resolveUiHost(configuredHost),
      person_profiles: "identified_only",
      persistence: "localStorage+cookie",
      capture_pageview: false, // Handled explicitly on navigation
      capture_pageleave: true,
      capture_exceptions: {
        capture_unhandled_errors: true,
        capture_unhandled_rejections: true,
        capture_console_errors: false,
      },
      autocapture: false, // Strict explicit business event tracking
      disable_session_recording: false,
      internal_or_test_user_hostname: /^(localhost|127\.0\.0\.1|\[::1\])$/i,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "[data-ph-mask], [data-mask], .sensitive-data",
        blockSelector: "[data-ph-no-capture], .ph-no-capture",
        maskInputOptions: {
          password: true,
          email: true,
        },
      },
      before_send: (event) => {
        if (event?.properties?.$current_url) {
          try {
            const urlObj = new URL(event.properties.$current_url);
            const cleanParams = new URLSearchParams();
            const allowed = new Set([
              "utm_source",
              "utm_medium",
              "utm_campaign",
              "utm_term",
              "utm_content",
              "ref",
              "source",
            ]);
            for (const [key, value] of urlObj.searchParams.entries()) {
              if (allowed.has(key.toLowerCase())) {
                cleanParams.set(key, value);
              }
            }
            urlObj.search = cleanParams.toString();
            event.properties.$current_url = urlObj.toString();
          } catch {
            // Keep unmodified if parsing fails
          }
        }
        return event;
      },
    });
  } catch (error) {
    clientInitialized = false;
    console.warn("PostHog browser init failed:", error?.message || error);
  }

  return posthog;
}

/**
 * Safe client-side event tracking helper.
 */
export function trackClientEvent(eventName, properties = {}, options = undefined) {
  if (typeof window === "undefined") return;
  try {
    if (!clientInitialized) initClientPostHog();
    posthog.capture(eventName, properties, options);
  } catch {
    // Fail open: analytics failures must never break UI
  }
}

/**
 * Identify authenticated user in PostHog.
 * Uses internal CUID/UUID (never raw emails as distinctId).
 */
export function identifyClientUser(userId, userProperties = {}) {
  if (typeof window === "undefined" || !userId) return;
  try {
    if (!clientInitialized) initClientPostHog();
    posthog.identify(String(userId), userProperties);
  } catch {
    // Fail open
  }
}

/**
 * Associate active session with a workspace group in PostHog.
 */
export function setClientGroup(workspaceId, groupProperties = {}) {
  if (typeof window === "undefined" || !workspaceId) return;
  try {
    if (!clientInitialized) initClientPostHog();
    posthog.group("company", String(workspaceId), groupProperties);
  } catch {
    // Fail open
  }
}

/**
 * Reset PostHog identity on logout.
 */
export function resetClientUser() {
  if (typeof window === "undefined") return;
  try {
    if (clientInitialized) posthog.reset();
  } catch {
    // Fail open
  }
}

export { posthog };
