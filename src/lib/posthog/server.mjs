import { PostHog } from "posthog-node";

import { env } from "../env.mjs";

let serverPostHogClient = null;

/**
 * Returns a singleton instance of the PostHog Node SDK for server-side event tracking.
 * Safe to call in Node.js runtime environments (API routes, server actions, webhooks).
 */
export function getServerPostHog() {
  if (serverPostHogClient) return serverPostHogClient;

  const token = env.POSTHOG_PROJECT_TOKEN || env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = env.POSTHOG_HOST || env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!token) return null;

  try {
    serverPostHogClient = new PostHog(token, {
      host,
      flushAt: 1,
      flushInterval: 0,
    });
    return serverPostHogClient;
  } catch (error) {
    console.error("Failed to initialize server-side PostHog:", error?.message || error);
    return null;
  }
}

/**
 * Capture a server-side PostHog event safely without throwing or blocking critical business logic.
 */
export async function trackServerEvent({ distinctId, event, properties = {}, groups = {} }) {
  const client = getServerPostHog();
  if (!client || !distinctId || !event) return;

  try {
    client.capture({
      distinctId: String(distinctId),
      event,
      properties: {
        $lib: "posthog-node",
        ...properties,
      },
      groups: Object.keys(groups).length > 0 ? groups : undefined,
    });
    if (typeof client.flush === "function") {
      await client.flush().catch(() => {});
    }
  } catch (error) {
    console.warn("PostHog server event capture failed:", error?.message || error);
  }
}

/**
 * Associate a user with a workspace company group in PostHog server-side.
 */
export async function setServerGroup({ groupType = "company", groupKey, properties = {} }) {
  const client = getServerPostHog();
  if (!client || !groupKey) return;

  try {
    client.groupIdentify({
      groupType,
      groupKey: String(groupKey),
      properties,
    });
    if (typeof client.flush === "function") {
      await client.flush().catch(() => {});
    }
  } catch (error) {
    console.warn("PostHog server groupIdentify failed:", error?.message || error);
  }
}
