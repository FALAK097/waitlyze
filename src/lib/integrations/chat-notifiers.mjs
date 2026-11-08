import { decryptIntegrationSecret } from "./secrets.mjs";

export const CHAT_PROVIDERS = Object.freeze(["SLACK", "DISCORD"]);
export const CHAT_TRIGGERS = Object.freeze([
  "MILESTONE_COUNTS",
  "VERIFIED_SIGNUP",
  "REWARD_TIER_UNLOCKED",
]);

export function validChatTriggers(triggers) {
  return (
    Array.isArray(triggers) &&
    triggers.length > 0 &&
    triggers.length <= CHAT_TRIGGERS.length &&
    new Set(triggers).size === triggers.length &&
    triggers.every((trigger) => CHAT_TRIGGERS.includes(trigger))
  );
}

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
  return postJson(
    webhookUrl,
    { content: String(text).slice(0, 2000), allowed_mentions: { parse: [] } },
    options,
  );
}

const postByProvider = { SLACK: postSlackMessage, DISCORD: postDiscordMessage };

/**
 * Best-effort fan-out of a milestone line to every CONNECTED chat channel on
 * the waitlist. Failures mark the channel NEEDS_ATTENTION but never throw -
 * callers treat chat as a courtesy copy, not a delivery guarantee.
 */
export async function notifyChatChannels(db, waitListId, text, trigger = "MILESTONE_COUNTS") {
  if (!waitListId || !text || !CHAT_TRIGGERS.includes(trigger)) return { sent: 0, eligible: 0 };
  const channels = await db.waitlistNotificationChannel.findMany({
    where: { waitListId, status: "CONNECTED", triggers: { has: trigger } },
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
      try {
        const url = decryptIntegrationSecret(record);
        const validated = validateChatWebhookUrl(record.provider, url);
        if (validated.error)
          throw Object.assign(new Error("Invalid chat webhook"), { code: "INVALID_WEBHOOK" });
        const sanitized = text.replaceAll("@", "＠");
        const message =
          record.provider === "SLACK"
            ? sanitized.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
            : sanitized;
        await post(validated.url, message);
        return true;
      } catch (error) {
        await db.waitlistNotificationChannel
          .updateMany({
            where: {
              id: record.id,
              status: "CONNECTED",
              secretCiphertext: record.secretCiphertext,
              secretIv: record.secretIv,
              secretTag: record.secretTag,
            },
            data: {
              status: "NEEDS_ATTENTION",
              lastErrorCode: error?.code || "DELIVERY_FAILED",
            },
          })
          .catch(() => null);
      }
      return false;
    }),
  );
  return { sent: deliveries.filter(Boolean).length, eligible: channels.length };
}

// Queue only when a connected channel has opted into this trigger. Callers
// enqueue after their core transaction commits: chat failures never roll back
// verified signups, referral points, or rewards.
export async function queueChatNotification(db, { waitListId, trigger, eventKey, payload }) {
  if (!CHAT_TRIGGERS.includes(trigger)) throw new TypeError("Unknown chat trigger.");
  const channels = await db.waitlistNotificationChannel.count({
    where: { waitListId, status: "CONNECTED", triggers: { has: trigger } },
  });
  if (!channels) return false;
  const created = await db.outboxEvent.createMany({
    data: [
      {
        eventKey: `chat:${eventKey}`,
        type: "CHAT_NOTIFICATION_REQUESTED",
        waitListId,
        payload: { ...payload, trigger },
      },
    ],
    skipDuplicates: true,
  });
  return created.count > 0;
}

export async function queueVerifiedChatNotifications(db, { waitListId, signUpId, unlocks = [] }) {
  const notifications = [
    ...(signUpId
      ? [
          {
            waitListId,
            trigger: "VERIFIED_SIGNUP",
            eventKey: `verified:${signUpId}`,
            payload: { signUpId },
          },
        ]
      : []),
    ...unlocks.map(({ referrerId, count, reward }) => ({
      waitListId,
      trigger: "REWARD_TIER_UNLOCKED",
      eventKey: `reward:${waitListId}:${referrerId}:${count}`,
      payload: { signUpId: referrerId, count, reward },
    })),
  ];
  // Each enqueue is independent and courtesy-only. An outage must not change
  // the result of an already committed signup.
  await Promise.all(
    notifications.map(async (notification) => {
      try {
        await queueChatNotification(db, notification);
      } catch (error) {
        console.error("Chat notification enqueue failed", error?.message || "unknown error");
      }
    }),
  );
}

export async function deliverChatNotification(db, event) {
  const { trigger, signUpId, count, reward } = event.payload || {};
  if (!CHAT_TRIGGERS.includes(trigger)) throw new TypeError("Unknown chat trigger.");
  const waitList = await db.waitList.findUnique({
    where: { id: event.waitListId },
    select: { name: true, status: true },
  });
  if (!waitList || waitList.status !== "PUBLISHED") return { sent: 0, eligible: 0 };
  const name = String(waitList.name || "Your waitlist")
    .replace(/[\r\n]+/g, " ")
    .slice(0, 100);
  let text;
  if (trigger === "MILESTONE_COUNTS" && [1, 10, 100, 1000].includes(count))
    text = `${name} just hit ${count} signup${count === 1 ? "" : "s"}.`;
  if (trigger === "VERIFIED_SIGNUP" && typeof signUpId === "string") {
    const signup = await db.signUp.findFirst({
      where: { id: signUpId, waitListId: event.waitListId, verifiedAt: { not: null } },
      select: { id: true },
    });
    if (signup) text = `A subscriber confirmed their spot on ${name}.`;
  }
  if (
    trigger === "REWARD_TIER_UNLOCKED" &&
    typeof signUpId === "string" &&
    Number.isInteger(count) &&
    typeof reward === "string"
  ) {
    text = `A subscriber unlocked ${reward.replace(/[\r\n]+/g, " ").slice(0, 120)} on ${name} with ${count} verified referrals.`;
  }
  return text ? notifyChatChannels(db, event.waitListId, text, trigger) : { sent: 0, eligible: 0 };
}
