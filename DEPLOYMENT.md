# Cloudflare Workers production deployment

Waitlyze runs as the `waitlyze` OpenNext Worker. Cloudflare serves the canonical
site at `https://waitlyze.com`; `https://www.waitlyze.com` redirects to the
apex, and the former app hostname is retained only as a permanent redirect.

## Build and deploy

Use Node.js 24 and pnpm 11.5.0:

```sh
pnpm install --frozen-lockfile
pnpm build:worker
pnpm exec wrangler dev
pnpm deploy:worker
```

`pnpm deploy:worker` uses Wrangler and requires Wrangler authentication. The
repo's `wrangler.jsonc` declares the production Worker, custom domains, static
asset binding, R2-backed Next.js cache, and Durable Object cache coordination.
`cloudflare-worker.js` wraps OpenNext to keep host routing, markdown negotiation,
and public R2 asset delivery in the Workers runtime rather than relying on
Next.js Node middleware.
The existing `waitlyze` uploads bucket is kept separate from the cache bucket.

Run database migrations from a trusted environment before deploying a Worker
that uses the new `custom_domains.providerId` column:

```sh
pnpm migrate:deploy
```

## Production secrets and settings

Copy the existing production application secrets from Vercel to the Cloudflare
Worker without committing or printing their values. At minimum, configure:

- `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and
  `GOOGLE_CLIENT_SECRET` (if Google sign-in is enabled)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and
  `R2_BUCKET_NAME=waitlyze`
- `OUTBOX_DISPATCH_SECRET`, `WEBHOOK_SECRET_ENCRYPTION_KEY`, and
  `MARKETING_UNSUBSCRIBE_SECRET`
- `TURNSTILE_SECRET_KEY` and `TURNSTILE_SITE_KEY`, if Turnstile is enabled

Resend API credentials remain encrypted per workspace or waitlist; no global
Resend key is required by the Worker. The canonical `BETTER_AUTH_URL`,
`APP_ROOT_DOMAIN`, and `CLOUDFLARE_CUSTOM_HOSTNAME_TARGET` are declared in
`wrangler.jsonc`. The public R2 URL defaults to `https://assets.waitlyze.com`.
`NEXT_PUBLIC_*` values are embedded at build time, so keep the public R2 URL set
in the build environment too.

The `EMAIL` Worker binding sends Waitlyze-owned transactional mail from
`noreply@waitlyze.com`, with replies directed to `support@waitlyze.com`.
`waitlyze.com` is onboarded for Email Sending and its DNS is ready. Workspace
Cloudflare connections use a customer-provided Account ID and Email Sending:
Edit token for transactional signup verification only. Resend remains the
provider for broadcasts and marketing automations because Cloudflare Email
Service does not permit marketing or bulk campaigns.

For custom waitlist domains, configure Cloudflare for SaaS on the
`waitlyze.com` zone and provide a zone-scoped `CLOUDFLARE_API_TOKEN` with SSL
and Certificates read/write access. Set `CLOUDFLARE_ZONE_ID` and
`CLOUDFLARE_CUSTOM_HOSTNAME_TARGET=customers.waitlyze.com`. The target needs a
proxied fallback-origin record and the zone needs the wildcard Worker route.
The Worker serves `assets.waitlyze.com` directly from the existing R2 bucket
binding, so keep `WAITLYZE_UPLOADS` bound to the `waitlyze` bucket when enabling
the wildcard route.

Existing customer domains currently registered with the former provider need
to be re-verified with Cloudflare for SaaS and their CNAME/validation records
updated before they are considered active. The migration stores the Cloudflare
hostname ID and does not delete customer data or waitlists.

## DNS, email, OAuth, and cutover checks

- Keep the root MX, SPF, and DKIM records managed by Cloudflare Email Routing.
  The `support@waitlyze.com` rule forwards to the already-verified
  `falakgala09@gmail.com` destination.
- `assets.waitlyze.com` is a custom domain on the existing `waitlyze` R2 bucket.
  Keep the old R2 hostname until existing saved page images have been audited.
- The separate `waitlyze-next-cache` bucket expires cache objects after 30 days;
  Next.js regenerates expired cache entries when needed.
- A path- and query-preserving 301 Redirect Rule is configured for the old app
  hostname. Keep its DNS proxied through Cloudflare for the rule to take effect;
  do not change it until the Worker is live.
- Add `https://waitlyze.com/api/auth/callback/google` to the Google OAuth
  client's authorized redirect URIs before cutover.
- Verify sign-in, signup, email delivery/webhooks, uploads, public waitlists,
  sitemap/robots/OG images, API endpoints, and custom domains on the Worker
  before removing the Vercel project domain or its environment variables.

## Cost safety

The Workers Paid plan is active on this account at its $5/month base price.
Cloudflare does not offer a hard account-wide spend cap: Workers, R2, and Email
Sending usage can create additional charges, and budget alerts are notifications
only. The Worker limits CPU to 10 seconds per invocation, platform Email
Sending is capped in application code at 2,500 messages per rolling 31 days
(below its 3,000/month included allowance), and uploads are limited to 4 MB per
image. These are product-level safeguards, not an account billing ceiling; R2
storage/operations and Worker request overages remain usage-billed. Do not cut
over production while a strict $5 maximum is required.
