## v0.13.0 · Nov 23, 2026

### Launch Lab 14 free tools, faster waitlist creation, and new pricing pages

Plan, grade, and benchmark your launch with 14 free interactive tools and send your setup straight into a new waitlist draft. This release also adds dedicated pricing, features, and about pages alongside seasonal annual discounts and smoother account reliability.

#### Features

- **Waitlyze Launch Lab (14 free tools).** Plan launch timelines, estimate viral growth, simulate queue movement, design rewards, grade landing pages, check email domain setup, build tracking links, and explore waitlist benchmarks in one place.
- **One-click draft handoff.** Send your Launch Lab copy, template choice, and campaign settings straight into a prefilled waitlist draft when you sign in.
- **Redesigned tools experience.** Browse all 14 tools in grid or list view with cleaner workspaces, mobile-friendly controls, and brand channel icons.
- **Pricing, features, and Black Friday offer.** Explore plans and product capabilities on dedicated pricing, features, and about pages, including a 40% off annual Black Friday promotion.

#### Fixes

- **Account sign-out and sign-in flow.** Fixed sign-out errors and streamlined the sign-in flow when connecting AI integrations.
- **Published pages and templates.** Preserved older saved page layouts when loading templates and handled empty drafts and paused pages cleanly.
- **Pricing banner and signup form polish.** Prevented expired promotion banners from flashing on load and added Escape-key dismissal for embedded signup overlays.
- **Stronger account and waitlist protection.** Tightened workspace permissions, spam protection, and link checks across public forms and team settings.

## v0.12.0 · Nov 18, 2026

### Product release emails and changelog updates

Stay up to date with new Waitlyze features and fixes through release announcement emails delivered straight to your inbox and cleaner release notes on the changelog page.

#### Features

- **Product release email announcements.** Receive a summary email whenever a new Waitlyze version launches so you never miss new features or fixes.
- **Complete release history.** Browse release notes across all past Waitlyze versions from v0.1.0 onward on the changelog page.

#### Fixes

- **Release notes readability.** Improved changelog email formatting with version badges, highlight cards, and direct links to each release.

## v0.11.0 · Nov 11, 2026

### Flexible API key management and smoother rotation

Manage your waitlist keys in a structured workspace table with quick modal creation and clear revocation warnings. Teams can now rotate active keys without disruption, review billing activity, and follow direct guides for custom domains.

#### Features

- **Guided API key creation.** Generate API keys in a clean dialog with one-click copying and visibility toggles.
- **API key management table.** Manage active workspace keys, linked waitlists, creation dates, and expirations in a unified table.
- **Billing activity in audit logs.** Track plan subscriptions, upgrades, and billing events directly in workspace audit logs.
- **Custom domain guides.** Direct links to domain setup and verification guides from domain settings.

#### Fixes

- **Mobile waitlists table scrolling.** Fixed an issue where waitlists data tables did not scroll smoothly horizontally on mobile screens.
- **Notification drawer polish.** Cleaned up Slack and Discord notification drawers and removed unnecessary status badges.
- **Automation notice spacing.** Fixed vertical layout spacing below email delivery notices in the automation manager.

## v0.10.0 · Oct 26, 2026

### The full campaign loop: cockpit, rewards, and workspace billing

Launches now run end-to-end with referral cockpits, point tiers, and built-in spam protections. Teams can upgrade with flexible workspace billing plans and display live momentum with embeddable public widgets.

#### Features

- **Referral campaign cockpit.** Manage social share channels, referral points, and masked leaderboards from a single control center.
- **Point rewards and subscriber progress.** Award verified points for successful referrals with real-time participant position tracking.
- **Anti-fraud verification.** Guard waitlists against automated bot signups and sudden spam bursts.
- **Public widgets.** Embed live waitlist counters and participant leaderboards on external marketing sites.
- **Workspace billing tiers.** Support for Free and Pro workspace plans with regional pricing.

#### Fixes

- **Mobile responsive overflow.** Prevented horizontal overflow on mobile comparison and pricing tables.
- **Email template formatting.** Fixed formatting glitches when writing and previewing emails in the composer.
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
- **Location accuracy.** Improved country and city accuracy for visitor and signup locations.
- **Leaderboard score recalculation.** Resolved a delay when recalculating leaderboard positions following point grants.

## v0.8.0 · Oct 12, 2026

### A fairer referral engine with point ledgers and safeguards

Referral campaigns are now easier to trust and harder to manipulate. Subscribers can view their exact position and milestones, while organizers get transparent point audit ledgers.

#### Features

- **Transparent point ledgers.** Every point award is logged with timestamped attribution and verifiable referral source tracking.
- **Subscriber milestone progress.** Display progress bars and next-tier goals directly on participant confirmation screens.
- **Suspicious signup protection.** Catch duplicate submissions and suspicious signup spikes before they distort leaderboards.

#### Fixes

- **Duplicate signup protection.** Prevented rapid double-clicks from recording duplicate signup entries.
- **Verification failure messaging.** Clearer user feedback when bot verification challenges fail or expire.
- **Position display accuracy.** Corrected referral position calculations when deleted signups are removed from a waitlist.

## v0.7.0 · Oct 05, 2026

### Email broadcasts, automated welcome flows, and custom senders

Keep waitlist subscribers engaged from signup to launch with branded emails. Compose updates using reusable templates, automate welcome messages, and send from your own custom domain.

#### Features

- **Automated welcome sequences.** Automatically send personalized confirmation emails when subscribers join a waitlist.
- **Reusable email templates.** Compose and save formatted email templates with live variable previews.
- **Custom email sender integration.** Connect Resend or custom email providers to send messages directly from your brand's domain.

#### Fixes

- **Variable preview rendering.** Fixed custom template variable previews in the email composer.
- **Reply-To address handling.** Ensured your configured Reply-To email address is applied to all outgoing emails.
- **Duplicate broadcast prevention.** Prevented sending duplicate emails when triggering a broadcast manually.

## v0.6.0 · Sep 28, 2026

### Integrations, real-time webhooks, and dependable delivery

Connect your waitlists to your existing tools and automation platforms with real-time webhooks. Inspect delivery attempts, monitor delivery status, and retry failed events centrally.

#### Features

- **Real-time webhook notifications.** Send real-time notifications to your external tools for new signups, referral updates, and status changes.
- **Delivery logs and payload inspection.** Inspect delivery status, response details, and error messages for every attempt.
- **Centralized integration management.** Configure webhook destinations and manage secrets in workspace settings.

#### Fixes

- **Webhook secret refresh.** Fixed an issue where regenerating a webhook secret could leave the previous secret active.
- **Slow endpoint reliability.** Improved delivery reliability when connected endpoints take longer to respond.
- **Retry button state.** Corrected retry button responsiveness during in-flight delivery attempts.

## v0.5.0 · Sep 21, 2026

### A more useful subscriber workspace with import and export

Scale subscriber operations with deep search, multi-attribute filtering, and profile views. Import existing contact lists and export campaign data with a single click.

#### Features

- **Audience search and filtering.** Filter subscribers by signup date, referral count, verification status, and acquisition source.
- **Subscriber profile inspector.** Inspect an individual subscriber's referral link, verification status, and activity timeline.
- **CSV import and export.** Seamlessly import existing subscriber lists and export audience segments for external tools.

#### Fixes

- **International CSV export.** Fixed CSV export formatting for international characters and email addresses.
- **Faster subscriber search.** Improved responsiveness when typing quickly in large subscriber lists.
- **Keyboard navigation in dialogs.** Kept keyboard focus inside confirmation dialogs when deleting subscribers.

## v0.4.0 · Sep 14, 2026

### Know where signups come from with analytics

Measure launch growth directly within your workspace. Visualize visitors turning into subscribers with real-time conversion rates, geographic heatmaps, and device metrics.

#### Features

- **Signup funnel and conversion rates.** Real-time tracking of page impressions, total signups, and conversion percentages.
- **Geographic distribution map.** Visualize where your audience is discovering your waitlist across countries and regions.
- **Device and platform breakdown.** Understand whether your subscribers are signing up via mobile, tablet, or desktop.

#### Fixes

- **Chart tooltip clipping.** Fixed tooltip clipping along the outer boundaries of small mobile screens.
- **Daily count timezones.** Fixed date boundary mismatches in daily signup counts across timezones.
- **Device classification accuracy.** Corrected device detection for in-app browsers and mobile browsers.

## v0.3.0 · Sep 07, 2026

### Make the waitlist feel like yours with the page builder

Turn generic signup forms into branded launch experiences. Use the visual page builder to select palettes, customize typography, upload brand assets, and connect custom domains.

#### Features

- **Visual page builder.** Real-time visual designer for waitlist landing pages with instant live previews.
- **Brand customization presets.** Customize color palettes, upload custom logos, and apply consistent branding.
- **Custom domain publishing.** Host waitlists on your own custom domain or use Waitlyze-hosted subdomains.

#### Fixes

- **Color picker sync.** Fixed color input syncing across template color pickers.
- **Domain verification updates.** Improved automatic status checks when verifying a custom domain.
- **Mobile builder preview.** Resolved layout scaling issues when previewing pages on small mobile screens.

## v0.2.0 · Aug 31, 2026

### Sharing that brings in the next signup with referrals

Turn your waitlist into an organic referral engine. Give every subscriber a unique sharing link with live position updates, social share buttons, and milestone incentives.

#### Features

- **Unique referral links.** Automatically generate trackable referral links for each subscriber upon signup.
- **Live queue position rankings.** Display real-time queue position and milestone rankings to incentivize sharing.
- **Social sharing shortcuts.** One-click sharing buttons for X/Twitter, WhatsApp, LinkedIn, and direct link copying.

#### Fixes

- **Social share URL tagging.** Fixed missing referral tracking parameters when sharing directly to X/Twitter.
- **Instant position updates.** Corrected real-time queue position recalculation when signups are removed.
- **Clipboard feedback.** Added instant visual feedback when copying referral links to the clipboard.

## v0.1.0 · Aug 24, 2026

### The first Waitlyze waitlist launch

The inaugural release of Waitlyze. Launch a hosted waitlist in minutes, capture early interest, and manage subscribers from a centralized workspace.

#### Features

- **Instant waitlist creation.** Set up and publish a hosted waitlist signup page in minutes without writing code.
- **Centralized subscriber management.** View, manage, and organize waitlist signups in a unified workspace dashboard.
- **Secure authentication.** Simple, secure sign-in with Google authentication for workspace owners and collaborators.

#### Fixes

- **Waitlist URL availability.** Added instant URL availability checks so waitlists never share conflicting links.
- **Email validation messaging.** Improved form validation error messaging for malformed email submissions.
- **Reliable sign-in persistence.** Fixed session persistence on mobile Safari and Chrome browsers.
