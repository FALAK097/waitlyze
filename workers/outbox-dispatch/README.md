# Outbox dispatch worker (Cloudflare Cron)

Fires every minute and calls the app's `POST /api/internal/email-outbox`
route, which drains the **email outbox** and pending **webhook deliveries**.
This replaces a Vercel Cron — no framework changes needed on the Next.js side.

## One-time setup

From this directory (`workers/outbox-dispatch`):

```bash
wrangler login
wrangler secret put APP_URL
# paste the production app origin, e.g. https://app.waitlyze.com

wrangler secret put OUTBOX_DISPATCH_SECRET
# paste the SAME value as the Next.js app's OUTBOX_DISPATCH_SECRET
# (local .env, plus Vercel → Settings → Environment Variables for production)

wrangler deploy
```

## How it maps to the app

| Piece           | Where it lives                                                                    |
| --------------- | --------------------------------------------------------------------------------- |
| Dispatch logic  | `src/app/api/internal/email-outbox/route.js` (emails + `dispatchPendingWebhooks`) |
| Signing/retries | `src/lib/webhooks/delivery.mjs`                                                   |
| Cadence         | `[triggers] crons` in `wrangler.toml` (currently every minute)                    |

## Verify it works

1. In Waitlyze: waitlist **Settings → Webhooks → Send test** on an endpoint.
2. Cloudflare dashboard → Workers → `waitlyze-outbox-dispatch` → **Monitoring**: the next cron run should log `status=200`.
3. Back in Waitlyze, the delivery row flips to `delivered`. If the run logs non-200, the cron is marked failed — check that `APP_URL` is reachable and the secret matches the app env exactly.

## Change the cadence

Edit `crons` in `wrangler.toml` (e.g. `*/5 * * * *` for every five minutes) and `wrangler deploy` again.

## Local development

The worker is not needed locally — signups and deliveries just queue in the database. To drain manually:

```bash
curl -X POST http://localhost:3000/api/internal/email-outbox \
  -H "Authorization: Bearer $OUTBOX_DISPATCH_SECRET"
```
