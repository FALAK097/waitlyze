import { posthog } from "./client";
import { getServerPostHog } from "./server.mjs";

/**
 * Known feature flags in Waitlyze
 */
export const FEATURE_FLAGS = Object.freeze({
  NEW_WAITLIST_BUILDER: "new-waitlist-builder",
  NEW_ONBOARDING_FLOW: "new-onboarding-flow",
  ADVANCED_ANALYTICS: "advanced-analytics",
  NEW_REFERRAL_REWARD_SYSTEM: "new-referral-reward-system",
});

/**
 * Client-side feature flag check.
 * Safely falls back to defaultValue if SDK is not ready or in SSR.
 */
export function isClientFeatureEnabled(flagKey, defaultValue = false) {
  if (typeof window === "undefined") return defaultValue;
  try {
    const isEnabled = posthog.isFeatureEnabled(flagKey);
    return typeof isEnabled === "boolean" ? isEnabled : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Server-side feature flag check.
 * NOTE: Server authorization and plan limits remain the ultimate source of truth.
 * Feature flags only control product feature gating/rollout.
 */
export async function isServerFeatureEnabled(distinctId, flagKey, defaultValue = false) {
  if (!distinctId || !flagKey) return defaultValue;
  const client = getServerPostHog();
  if (!client) return defaultValue;

  try {
    const isEnabled = await client.isFeatureEnabled(flagKey, String(distinctId));
    return typeof isEnabled === "boolean" ? isEnabled : defaultValue;
  } catch (error) {
    console.warn(`Feature flag check failed for ${flagKey}:`, error?.message || error);
    return defaultValue;
  }
}
