"use client";

import { trackClientEvent } from "@/lib/posthog/client";
import { POSTHOG_EVENTS } from "@/lib/posthog/events.mjs";

const ALLOWED_TOOL_PROPERTIES = new Set([
  "tool_slug",
  "tool_version",
  "entry_surface",
  "result_band",
  "template_id",
  "authenticated",
  "blueprint_id",
  "export_format",
  "action",
]);

/**
 * Strips any unallowlisted fields so raw URLs, copy, emails, or CSV contents
 * can never be emitted to PostHog from Launch Lab tools.
 */
export function sanitizeToolAnalyticsProps(rawProps = {}) {
  const safe = {};
  for (const [key, value] of Object.entries(rawProps)) {
    if (!ALLOWED_TOOL_PROPERTIES.has(key)) continue;
    if (value === undefined || value === null) continue;
    if (typeof value === "boolean" || typeof value === "number") {
      safe[key] = value;
    } else if (typeof value === "string") {
      safe[key] = value.slice(0, 120);
    }
  }
  return safe;
}

export function trackToolEvent(eventKey, props = {}) {
  const eventName = POSTHOG_EVENTS[eventKey] || eventKey;
  trackClientEvent(eventName, sanitizeToolAnalyticsProps(props));
}
