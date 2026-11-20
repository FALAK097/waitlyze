import { PostHog } from "posthog-node";

import { env } from "../env.mjs";

const globalForPostHog = globalThis;

function createServerPostHog() {
  const token = env.POSTHOG_PROJECT_TOKEN || env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = env.POSTHOG_HOST || env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!token) return null;

  try {
    return new PostHog(token, {
      host,
      flushAt: 1,
      flushInterval: 0,
    });
  } catch (error) {
    console.error("Failed to initialize server-side PostHog:", error?.message || error);
    return null;
  }
}

/**
 * Returns a singleton instance of the PostHog Node SDK for server-side event tracking.
 * Safe to call in Node.js runtime environments (API routes, server actions, webhooks).
 */
export function getServerPostHog() {
  const cfContext = globalThis[Symbol.for("__cloudflare-context__")];
  if (cfContext) {
    if (!("__postHog" in cfContext)) cfContext.__postHog = createServerPostHog();
    return cfContext.__postHog;
  }

  if (!("postHog" in globalForPostHog)) globalForPostHog.postHog = createServerPostHog();
  return globalForPostHog.postHog;
}

async function flushPostHog(client) {
  if (typeof client.flush !== "function") return;
  const flush = client.flush().catch(() => {});
  const cfContext = globalThis[Symbol.for("__cloudflare-context__")];
  if (cfContext?.ctx?.waitUntil) {
    cfContext.ctx.waitUntil(flush);
    return;
  }
  await flush;
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
    await flushPostHog(client);
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
    await flushPostHog(client);
  } catch (error) {
    console.warn("PostHog server groupIdentify failed:", error?.message || error);
  }
}
