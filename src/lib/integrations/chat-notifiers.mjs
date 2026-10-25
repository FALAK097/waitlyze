import { decryptIntegrationSecret } from "./secrets.mjs";

export const CHAT_PROVIDERS = Object.freeze(["SLACK", "DISCORD"]);

// Incoming-webhook hosts we will POST to. Anything else is rejected at save
// time so a misconfigured channel can never exfiltrate milestone text to an
// arbitrary URL.
const ALLOWED_HOSTS = Object.freeze({
  SLACK: new Set(["hooks.slack.com"]),
  DISCORD: new Set(["discord.com", "discordapp.com", "ptb.discord.com"]),
});

export function isSupportedChatProvider(value) {
  return CHAT_PROVIDERS.includes(value);
}

export function validateChatWebhookUrl(provider, value) {
  if (typeof value !== "string" || !value.trim() || value.length > 2048 || /[\r\n\s]/.test(value))
    return { error: "Enter the incoming-webhook URL." };
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return { error: "Enter a valid https webhook URL." };
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS[provider]?.has(url.hostname))
    return {
      error: `Enter an official ${provider === "SLACK" ? "Slack" : "Discord"} webhook URL.`,
    };
  return { url: url.toString() };
}

async function postJson(url, payload, { fetchFn = fetch } = {}) {
  const response = await fetchFn(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw Object.assign(new Error(`Chat webhook rejected the message (HTTP ${response.status}).`), {
      code: `HTTP_${response.status}`,
    });
  }
  return true;
}

/** Posts plain text to a Slack incoming webhook. The URL is never logged. */
export function postSlackMessage(webhookUrl, text, options) {
  return postJson(webhookUrl, { text: String(text).slice(0, 2000) }, options);
}

/** Posts plain text to a Discord webhook. The URL is never logged. */
export function postDiscordMessage(webhookUrl, text, options) {
  return postJson(webhookUrl, { content: String(text).slice(0, 2000) }, options);
}

const postByProvider = { SLACK: postSlackMessage, DISCORD: postDiscordMessage };

/**
 * Best-effort fan-out of a milestone line to every CONNECTED chat channel on
 * the waitlist. Failures mark the channel NEEDS_ATTENTION but never throw —
 * callers treat chat as a courtesy copy, not a delivery guarantee.
 */
export async function notifyChatChannels(db, waitListId, text) {
  if (!waitListId || !text) return 0;
  const channels = await db.waitlistNotificationChannel.findMany({
    where: { waitListId, status: "CONNECTED" },
    select: {
      id: true,
      provider: true,
      status: true,
      secretCiphertext: true,
      secretIv: true,
      secretTag: true,
    },
  });
  // The schema allows only one channel per provider, so this fans out to at
  // most two independent providers with no cross-channel ordering requirement.
  const deliveries = await Promise.all(
    channels.map(async (record) => {
      if (record.status !== "CONNECTED") return false;
      const post = postByProvider[record.provider];
      if (!post) return false;
      let sent = false;
      try {
        await post(decryptIntegrationSecret(record), text);
        sent = true;
        await db.waitlistNotificationChannel.update({
          where: { id: record.id },
          data: { lastTestedAt: new Date(), lastErrorCode: null },
        });
        return true;
      } catch (error) {
        await db.waitlistNotificationChannel
          .update({
            where: { id: record.id },
            data: {
              status: "NEEDS_ATTENTION",
              lastErrorCode: error?.code || "DELIVERY_FAILED",
            },
          })
          .catch(() => null);
      }
      return sent;
    }),
  );
  return deliveries.filter(Boolean).length;
}
