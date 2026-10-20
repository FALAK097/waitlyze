// Cloudflare Worker: on a Cron Trigger, drain Waitlyze's email outbox and
// pending webhook deliveries by calling the app's internal dispatch route.
//
// Required worker secrets (set with `wrangler secret put`, never commit):
//   APP_URL                  e.g. https://app.waitlyze.com (no trailing slash)
//   OUTBOX_DISPATCH_SECRET   same value as the Next.js app's OUTBOX_DISPATCH_SECRET
//
// Cadence is configured in wrangler.toml [triggers].

export default {
  async scheduled(event, env) {
    const base = (env.APP_URL || "").replace(/\/$/, "");
    if (!base) throw new Error("APP_URL secret is not set on this worker.");
    if (!env.OUTBOX_DISPATCH_SECRET)
      throw new Error("OUTBOX_DISPATCH_SECRET secret is not set on this worker.");
    const started = Date.now();
    const response = await fetch(`${base}/api/internal/email-outbox`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.OUTBOX_DISPATCH_SECRET}` },
    });
    await response.text();
    console.log(
      `outbox dispatch cron=${event.cron} status=${response.status} ms=${Date.now() - started}`,
    );
    if (!response.ok) throw new Error(`Outbox dispatch failed with status ${response.status}.`);
  },
};
