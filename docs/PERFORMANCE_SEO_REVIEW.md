# Performance, architecture and search review

Reviewed 11 October 2026 for PR #89. This records scoped code evidence, not a claim that every provider or production user journey has passed.

## Applied changes

| Area | Evidence and change | Applicable Vercel rule |
| --- | --- | --- |
| Public metadata | Removed keyword stuffing and competitor names. Shared production origin/title/description live in `src/lib/site-metadata.js`; previews do not become canonical URLs. Added application name, light color scheme and theme color. | server-hoist-static-io |
| Social image | Replaced stale raster with Next `ImageResponse` metadata route: 1200 × 630, current lime bars, white background, clear product headline and alt text. Does not fetch fonts or remote images. | server-hoist-static-io |
| Indexing | Private product route group explicitly noindex/nofollow. Robots exclude API, private app and token flows. Embedded legacy forms noindex. Public sitemap includes homepage/privacy/terms with actual editorial date, omits unavailable refund draft. Published hosted pages declare their own canonical. Robots is crawl guidance, not authentication. | server-auth-actions considered separately in security review |
| AEO | Reusable server-only JSON-LD component describes Organization, WebSite, SoftwareApplication and optionally exact visible FAQs. Escapes `<` before script serialization. No invented reviews, prices or product guarantees. FAQ markup does not guarantee rich results. | server-serialization |
| Manifest | Stable identity, start URL and scope added; existing refreshed lime icons and white theme preserved. | metadata conventions |
| Public page data | Hosted and custom-domain lookup memoized per request using React.cache so metadata and page reuse database results. Does not create a cross-user global cache. | server-cache-react, server-no-shared-module-state |
| Overview | Publication revision, membership role and rehearsal history queried concurrently after the authorized waitlist lookup. Authorization remains before dependent reads. | async-parallel |
| Analytics | Dynamically import the Recharts component when its chart branch renders rather than eagerly bundling it with all analytics controls. Preserve loading placeholder and accessible data table. | bundle-dynamic-imports, bundle-conditional |
| Publishing | Reusable `PublicationOptions` in product builder provides actual hosted link and copyable script/container. Only published revision exposes these controls. Paused/draft explain publication requirement. | rerender-move-effect-to-event |
| Embed script | Uses executing script origin, URI-encodes campaign id, titles iframe, allows scrolling for longer published pages, prevents duplicate mounting, forwards only referral and UTM keys rather than unrelated host query data. | js-early-exit, client-event-listeners |

## Publication behavior

For structured templates, `/forms/[id]` redirects to the current hosted `/w/[slug]` publication. The snippet therefore embeds the **published page**, including its signup form. It is not a separately styled inline form component. Height defaults to 720px and is adjustable; the iframe scrolls for longer pages. Draft changes remain private until publish; pausing stops accepting signups. Copy controls gracefully explain manual copy if browser clipboard access is unavailable.

## Architecture audit

- Route responsibilities remain in `src/app`, domain data/services in `src/lib`, product UI in `src/components/product`, public landing/legal UI in `src/components/landing`, foundational primitives in `src/components/ui`.
- New modules follow existing lower-case hyphenated component names; publication styles use colocated CSS modules. Metadata helpers are centralized rather than duplicating the deployment origin.
- The existing legacy `wait-lists`, `dashboard`, and `utils/server` directories remain compatibility adapters. Renaming all established API paths and Prisma model names would create migration/API risks without improving behavior. New code uses current product/domain boundaries; incremental consolidation belongs in a separate reviewed change.
- Current workspace lookup already uses request-scoped `cache`. Settings and broadcast pages already start independent requests concurrently; do not add redundant cache layers or replace existing fetch cancellation with another framework solely to satisfy a checklist.
- Client boundaries exist for interactive builders, dialogs, analytics and form controls. Static metadata/structured data stay on the server. Existing analytics/webhook/domain effects use AbortController and cleanup; authorization remains in route handlers/server actions.
- No blanket `useMemo`/`memo` additions, forced dynamic imports for tiny primitives, or arbitrary JSX rewrites: these would add complexity without demonstrated value. Barrel imports from icon/chart libraries are assessed through Next's package optimization and a measured bundle before proposing dependency churn.

## Validation and proof boundaries

- Targeted ESLint passed for metadata, hosted pages, overview, chart loading and publication components.
- `git diff --check` passed after changes.
- Embed script executed in a VM smoke check: localhost script origin, campaign id URI encoding, referral/UTM forwarding, private token/email exclusion, configured height, scroll behavior and idempotent mounting passed.
- Root orchestrator owns combined production build, browser responsive/manual/auto tour verification, metadata route rendering, and independent security review after all parallel edits land. Those results must be recorded separately; lint alone does not prove production behavior.
- Authenticated runtime, custom domain ownership, real provider deliveries and deployed crawl/social cache behavior require configured environments. No performance score or measured bundle saving is asserted by this review.

## Final local flow verification (October 11, 2026)

- Real authenticated local session with dummy accounts: empty workspace → starter selection → details → review → create private draft → page editor → autosave → publication review → published page controls → overview analytics → subscriber empty state → email templates → broadcasts → automations → waitlist settings → account settings.
- All seven waitlist routes and account settings returned HTTP 200. A different tenant's waitlist returned 404. Signed-out Waitlists and Settings redirected to the public home.
- Login callbacks and public authenticated actions now go directly to `/wait-lists`; `/dashboard` and `/api-keys` remain compatibility redirects only. Removed design-system/capture fixtures and obsolete refund route return 404.
- Removed eight unreferenced old landing components. Legacy form editing remains because pre-revamp waitlists still use it.
- Sharing links and embed script use the configured current environment URL, including Vercel Preview, instead of sending local/preview users to production. Email page metadata no longer repeats the product name.
- Final Node 24 production build, whole-repository ESLint, 22 security unit tests, separate real PostgreSQL admission test, fresh/repeat migrations, legacy preservation and schema parity passed locally.
- Tour clips are encoded captures of actual builder, publication controls and analytics component states with dummy data. They are composed walkthroughs, not continuous user-session recordings.
- Google OAuth callback ownership, real email delivery, scheduler execution and deployed secure-cookie/cross-tenant behavior remain external checks. Preview database currently returns PostgreSQL `3D000`.

- Signed out through the real Settings control and returned to the public landing. Inert demo accepts arbitrary text with an enabled Join button and no native validation. Exclusive FAQ and no horizontal overflow were verified at 320, 390, 768 and 1280 pixels.
