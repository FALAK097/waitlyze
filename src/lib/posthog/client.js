"use client";

import posthog from "posthog-js";

import { env } from "../env.mjs";

let clientInitialized = false;

/**
 * Initializes the PostHog browser SDK with privacy-conscious defaults:
 * - Cookieless persistence ('memory') on public pages to avoid requiring a cookie banner.
 * - Masks text inputs, passwords, and sensitive fields during session replay.
 * - Disables autocapture by default to avoid accidental PII ingestion.
 * - Does NOT track public waitlist forms (/w/[slug]).
 */
export function initClientPostHog() {
  if (typeof window === "undefined" || clientInitialized) return posthog;

  const token = env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!token) return posthog;

  const pathname = window.location.pathname;
  // Never run or track on hosted customer waitlist pages (/w/*)
  if (pathname.startsWith("/w/") || pathname.startsWith("/domain")) {
    return posthog;
  }

  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/templates") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/compare") ||
    pathname.startsWith("/alternatives") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms");

  try {
    posthog.init(token, {
      api_host: host,
      person_profiles: "identified_only",
      capture_pageview: false, // Handled explicitly on navigation
      capture_pageleave: true,
      autocapture: false, // Strict explicit business event tracking
      // On public marketing pages, use memory persistence to eliminate cookie banner requirements
      persistence: isPublicPage ? "memory" : "localStorage+cookie",
      disable_session_recording: isPublicPage,
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: {
          password: true,
          email: true,
        },
      },
      loaded: () => {
        clientInitialized = true;
      },
    });
  } catch (error) {
    console.warn("PostHog browser init failed:", error?.message || error);
  }

  return posthog;
}

/**
 * Safe client-side event tracking helper.
 */
export function trackClientEvent(eventName, properties = {}) {
  if (typeof window === "undefined") return;
  try {
    if (!clientInitialized) initClientPostHog();
    posthog.capture(eventName, properties);
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
