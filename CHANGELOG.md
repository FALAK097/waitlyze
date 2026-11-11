## v0.11.0 · Nov 11, 2026

### Flexible API key management and zero-downtime rotation

Manage server credentials in a structured workspace table with modal generation and safe revocation warnings. Teams can now rotate active API keys without downtime, audit billing events, and follow direct guides for custom domains.

#### Features

- **Modal-based API key creation.** Generate API keys in a modal dialog with one-click secret copying and visibility toggles.
- **Table view for API credentials.** Manage active workspace keys, waitlist bindings, creation dates, and expirations in a unified table.
- **Billing activity in audit logs.** Track plan subscriptions, upgrades, and billing events directly in workspace audit logs.
- **Custom domain documentation.** Direct links to DNS configuration and verification documentation from domain settings.

#### Fixes

- **Mobile waitlists table scrolling.** Fixed an issue where waitlists data tables did not scroll smoothly horizontally on mobile screens.
- **Notification drawer polish.** Cleaned up Slack and Discord notification drawers and removed unnecessary status badges.
- **Automation notice spacing.** Fixed vertical layout spacing below email delivery notices in the automation manager.

## v0.10.0 · Oct 26, 2026

### The full campaign loop: cockpit, rewards, and workspace billing

Launches now run end-to-end with referral cockpits, point tiers, and transparent fraud protections. Teams can monetize with flexible workspace billing plans and display live momentum with embeddable public widgets.

#### Features

- **Referral campaign cockpit.** Manage social share channels, referral points, and masked leaderboards from a single control center.
- **Point rewards and subscriber progress.** Award verified points for successful referrals with real-time participant position tracking.
- **Anti-fraud verification.** Guard waitlists against automated bursts using Cloudflare Turnstile verification and IP velocity limits.
- **Public widgets.** Embed live waitlist counters and participant leaderboards on external marketing sites.
- **Workspace billing tiers.** Support for Free and Pro workspace plans with localized purchasing power parity (PPP) pricing.

#### Fixes

- **Mobile responsive overflow.** Prevented horizontal overflow on mobile comparison and pricing tables.
- **Email template formatting.** Sanitized Markdown parsing in email composers to prevent escaped syntax errors.
- **Domain reservation cleanup.** Fixed reservation state handling when deleting waitlists linked to custom domains.

## v0.9.0 · Oct 19, 2026

### Analytics, with more signal and date comparisons

Understand launch performance with granular audience acquisition signals and time-period comparisons. Identify which referral channels bring the highest-converting subscribers without leaving the dashboard.

#### Features

- **Acquisition channel breakdowns.** Track signups by referral sources, geographic locations, and device types.
- **Date range comparisons.** Compare signup and conversion velocity across customizable time windows.
- **Referral performance attribution.** Identify top advocates and word-of-mouth contributors beside conversion funnels.

#### Fixes

- **Date comparison filter persistence.** Fixed an issue where active date comparison filters reset upon changing workspace tabs.
- **Geographic IP resolution.** Improved country and city attribution accuracy for proxied traffic.
- **Leaderboard score recalculation.** Resolved a delay when recalculating leaderboard positions following point grants.

## v0.8.0 · Oct 12, 2026

### A fairer referral engine with point ledgers and safeguards

Referral campaigns are now easier to trust and harder to manipulate. Subscribers can view their exact position and milestones, while organizers get transparent point audit ledgers.

#### Features

- **Transparent point ledgers.** Every point award is logged with timestamped attribution and verifiable referral source tracking.
- **Subscriber milestone progress.** Display progress bars and next-tier goals directly on participant confirmation screens.
- **Suspicious signup protection.** Catch duplicate submissions and suspicious velocity spikes before they distort leaderboards.

#### Fixes

- **Rapid duplicate submission gating.** Fixed a race condition where rapid double-clicks could record duplicate signup entries.
- **Verification failure messaging.** Clearer user feedback when bot verification challenges fail or expire.
- **Position display accuracy.** Corrected referral position calculations when deleted signups are removed from a waitlist.

## v0.7.0 · Oct 05, 2026

### Email broadcasts, automated welcome flows, and custom senders

Keep waitlist subscribers engaged from signup to launch with branded emails. Compose updates using Markdown templates, automate welcome messages, and route through custom domains.

#### Features

- **Automated welcome sequences.** Automatically dispatch personalized confirmation emails when subscribers join a waitlist.
- **Reusable Markdown email templates.** Compose and save formatted email templates with real-time variable previews.
- **Custom email sender integration.** Connect Resend or custom email providers to send messages directly from your brand's domain.

#### Fixes

- **Variable preview rendering.** Fixed custom template variable interpolation in the email composer preview.
- **Reply-To header configuration.** Ensured sender Reply-To addresses are properly applied to all outbound emails.
- **Broadcast delivery deduplication.** Prevented inadvertent duplicate email dispatches during manual broadcast triggers.

## v0.6.0 · Sep 28, 2026

### Integrations, real-time webhooks, and dependable delivery

Connect your waitlists to downstream databases and automation platforms with real-time webhooks. Inspect delivery attempts, monitor payload status, and retry failed events centrally.

#### Features

- **Real-time webhook notifications.** Dispatch event webhooks for new signups, referral updates, and status changes.
- **Delivery logs and payload inspection.** Inspect HTTP status codes, request headers, and error logs for every delivery attempt.
- **Centralized integration management.** Configure webhook endpoints and secure signing secrets in workspace settings.

#### Fixes

- **Webhook secret regeneration.** Fixed an issue where regenerating signing secrets could fail to invalidate cached tokens.
- **Timeout handling.** Extended delivery timeout limits for slower webhook consumer endpoints.
- **Retry button state.** Corrected retry button responsiveness during in-flight delivery attempts.

## v0.5.0 · Sep 21, 2026

### A more useful subscriber workspace with import and export

Scale subscriber operations with deep search, multi-attribute filtering, and profile views. Import existing contact lists and export campaign data with a single click.

#### Features

- **Audience search and filtering.** Filter subscribers by signup date, referral count, verification status, and acquisition source.
- **Subscriber profile inspector.** Inspect an individual subscriber's referral link, verification status, and activity timeline.
- **CSV import and export.** Seamlessly import existing subscriber lists and export audience segments for external tools.

#### Fixes

- **Unicode CSV export.** Fixed CSV export formatting for non-Latin character sets and international email addresses.
- **Search query debouncing.** Improved list filtering performance when typing rapid queries in large subscriber lists.
- **Modal focus traps.** Ensured keyboard focus remains trapped within confirmation dialogs when deleting subscribers.

## v0.4.0 · Sep 14, 2026

### Know where signups come from with analytics

Measure launch growth directly within your workspace. Visualize visitors turning into subscribers with real-time conversion rates, geographic heatmaps, and device metrics.

#### Features

- **Signup funnel and conversion rates.** Real-time tracking of page impressions, total signups, and conversion percentages.
- **Geographic distribution map.** Visualize where your audience is discovering your waitlist across countries and regions.
- **Device and platform breakdown.** Understand whether your subscribers are signing up via mobile, tablet, or desktop.

#### Fixes

- **Chart tooltip clipping.** Fixed tooltip clipping along the outer boundaries of small mobile screens.
- **Timezone offset calculations.** Resolved date boundary discrepancies in daily signup count calculations.
- **Device classification accuracy.** Corrected platform classification for embedded webviews and mobile browsers.

## v0.3.0 · Sep 07, 2026

### Make the waitlist feel like yours with the page builder

Turn generic signup forms into branded launch experiences. Use the visual page builder to select palettes, customize typography, upload brand assets, and connect custom domains.

#### Features

- **Visual page builder.** Real-time visual designer for waitlist landing pages with instant live previews.
- **Brand customization presets.** Customize color palettes, upload custom logos, and apply consistent branding.
- **Custom domain publishing.** Host waitlists on your own custom domain or use Waitlyze-hosted subdomains.

#### Fixes

- **Color picker synchronization.** Fixed hex code input synchronization across template color pickers.
- **Domain DNS verification polling.** Corrected verification status polling intervals on custom domain settings.
- **Mobile builder preview.** Resolved layout scaling issues when previewing pages on small viewport sizes.

## v0.2.0 · Aug 31, 2026

### Sharing that brings in the next signup with referrals

Turn your waitlist into an organic referral engine. Give every subscriber a unique sharing link with live position updates, social share buttons, and milestone incentives.

#### Features

- **Unique referral links.** Automatically generate trackable referral links for each subscriber upon signup.
- **Live queue position rankings.** Display real-time queue position and milestone rankings to incentivize sharing.
- **Social sharing shortcuts.** One-click sharing buttons for X/Twitter, WhatsApp, LinkedIn, and direct link copying.

#### Fixes

- **Social share URL tagging.** Fixed missing campaign query parameters when sharing directly to X/Twitter.
- **Position update latency.** Corrected real-time queue position recalculation when signups are removed.
- **Clipboard feedback.** Added instant visual feedback when copying referral links to the clipboard.

## v0.1.0 · Aug 24, 2026

### The first Waitlyze waitlist launch

The inaugural release of Waitlyze. Launch a hosted waitlist in minutes, capture early interest, and manage subscribers from a centralized workspace.

#### Features

- **Instant waitlist creation.** Set up and publish a hosted waitlist signup page in minutes without writing code.
- **Centralized subscriber management.** View, manage, and organize waitlist signups in a unified workspace dashboard.
- **Secure authentication.** Simple, secure sign-in with Google authentication for workspace owners and collaborators.

#### Fixes

- **Slug collision handling.** Added real-time slug availability validation to prevent conflicting waitlist URLs.
- **Email validation messaging.** Improved form validation error messaging for malformed email submissions.
- **Session persistence.** Fixed session state persistence on mobile Safari and Chrome browsers.
