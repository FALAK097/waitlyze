# Task: Implement Complete PostHog Product Analytics for Waitlyze

Act as a senior full-stack engineer specializing in Next.js, TypeScript, SaaS analytics, product instrumentation, and privacy-conscious analytics architecture.

Your task is to implement a complete, production-ready PostHog analytics system throughout the existing Waitlyze application.

This is an implementation task, not a planning or documentation-only task. Inspect the existing codebase, understand its architecture, and implement the solution following the project's established conventions.

Do not blindly follow assumptions in this prompt if the existing architecture suggests a better approach. Preserve existing functionality and avoid unnecessary refactoring.

---

# 1. Project Context

Waitlyze is a SaaS platform for creating and managing waitlists, landing pages, referral campaigns, and pre-launch marketing campaigns.

Target customers:

- Indie hackers and solo founders.
- SaaS startups.
- Agencies.
- Businesses and marketing teams.

Existing technology preferences and architecture:

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- PostgreSQL
- Neon
- Cloudflare
- Dodo Payments
- Plunk for transactional emails
- pnpm

Important architectural requirements:

- Multi-tenant SaaS architecture.
- Users can belong to workspaces.
- Workspaces contain waitlists and other resources.
- Workspaces can have subscriptions.
- Free and Pro plans have different entitlements.
- Referral tracking and verified referral conversions are important product features.
- Customers can have public hosted waitlist pages and embedded waitlist forms.

First inspect the repository to identify the actual implementation of these systems.

Do not assume database models, routes, authentication providers, or component locations. Discover them from the codebase.

# 2. Main Objective

Implement PostHog as Waitlyze's central product analytics platform.

We want to understand:

1. How visitors discover Waitlyze.
2. How visitors become registered users.
3. How users create their first workspace.
4. How users create and publish their first waitlist.
5. How many visitors register through customer waitlists.
6. Which product features are used most.
7. Which onboarding steps cause abandonment.
8. How free users convert to paid customers.
9. How subscriptions are retained or cancelled.
10. Which acquisition channels generate valuable customers.

The implementation should be reliable, maintainable, privacy-conscious, and production-ready.

# 3. Initial Codebase Audit

Before making changes:

1. Inspect the package.json and identify Next.js and React versions.
2. Inspect the app directory and routing structure.
3. Identify the authentication system.
4. Identify user and workspace Prisma models.
5. Identify waitlist and referral models.
6. Identify subscription and Dodo Payments integration.
7. Identify the existing API architecture.
8. Identify public landing pages, dashboard routes, and embedded/public waitlist pages.
9. Identify existing analytics or tracking integrations.
10. Identify deployment and environment configuration.

Prepare a short implementation plan based on the actual codebase.

Then proceed with implementation without waiting for approval unless there is a genuinely blocking architectural ambiguity.

Do not replace existing infrastructure or introduce duplicate analytics systems.

# 4. Install and Configure PostHog

Use the official PostHog SDKs:

- posthog-js
- posthog-node

Use pnpm.

Implement the official recommended integration for the installed Next.js version.

For App Router applications, prefer the appropriate PostHog initialization mechanism, such as instrumentation-client.ts where supported.

Required environment variables:

NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=
NEXT_PUBLIC_POSTHOG_HOST=
POSTHOG_PROJECT_TOKEN=
POSTHOG_HOST=

Requirements:

- Public project token must only be used in browser code.
- Private server configuration must never be exposed to the browser.
- Support EU and US PostHog hosting through configuration.
- Avoid initializing PostHog multiple times.
- Avoid duplicate pageview events.
- Handle client-side navigation correctly.
- Ensure analytics do not break if PostHog is unavailable.
- Disable or isolate analytics in local development by default, while allowing explicit testing.
- Keep development and production environments distinguishable.

Use the current official PostHog SDK and Next.js documentation rather than outdated integration examples.

# 5. Analytics Architecture

Create a centralized analytics module.

Suggested structure (adapt to existing project conventions):

src/
lib/
analytics/
index.ts
client.ts
server.ts
events.ts
properties.ts
identity.ts
types.ts

The exact structure may differ if the repository already has a suitable architecture.

Requirements:

- Centralized event definitions.
- Strongly typed event properties.
- Reusable client tracking helpers.
- Reusable server tracking helpers.
- Consistent event naming.
- Shared property definitions.
- No arbitrary duplicated event names throughout components.
- No unnecessary direct PostHog calls scattered throughout the application.
- Graceful handling of analytics failures.

Use namespaced event names:

marketing:signup_completed
workspace:created
waitlist:created
waitlist:published
referral:campaign_created
billing:subscription_created

Prefer type-safe event helpers.

# 6. Event Tracking Implementation

Instrument actual business operations, not just button clicks.

Implement the following event taxonomy.

## A. Acquisition Events

- marketing:page_viewed
- marketing:signup_started
- marketing:signup_completed
- marketing:login_completed
- marketing:pricing_viewed
- marketing:checkout_started_from_pricing

Useful properties:

- page_path
- page_type
- app_surface
- signup_method
- utm_source
- utm_medium
- utm_campaign
- referrer_domain
- landing_page

Preserve appropriate UTM attribution through the signup process.

Do not overwrite original acquisition attribution on every subsequent pageview.

## B. Workspace Events

- workspace:created
- workspace:updated
- workspace:member_invited
- workspace:member_joined
- workspace:member_removed

Properties:

- workspace_id
- member_count
- creation_method

## C. Waitlist Events

- waitlist:created
- waitlist:updated
- waitlist:published
- waitlist:unpublished
- waitlist:deleted
- waitlist:signup_received
- waitlist:milestone_reached

Properties:

- waitlist_id
- workspace_id
- template_id
- creation_method
- signup_source
- has_custom_domain
- signup_count_bucket

For signup events, avoid capturing personally identifiable information belonging to the customer's waitlist subscribers.

Use aggregated counts or non-identifying properties where possible.

## D. Referral Events

- referral:campaign_created
- referral:campaign_updated
- referral:link_shared
- referral:conversion_received
- referral:reward_unlocked
- referral:reward_claimed

Properties:

- campaign_id
- workspace_id
- referral_source
- reward_type
- conversion_type

Only record verified referral conversions as successful conversions.

Do not expose referral tokens, personal details, or private campaign information in analytics properties.

## E. Feature Engagement Events

Track important features that exist in the actual product:

- analytics:report_viewed
- integration:connected
- integration:disconnected
- webhook:created
- webhook:delivery_failed
- export:downloaded
- domain:connected
- domain:verified
- email:delivery_failed
- api:request_failed

Do not implement events for features that do not exist.

## F. Billing Events

- billing:upgrade_clicked
- billing:checkout_started
- billing:subscription_created
- billing:subscription_updated
- billing:subscription_cancelled
- billing:payment_failed
- billing:refund_processed

Properties:

- plan
- billing_interval
- currency
- country
- workspace_id
- subscription_id
- amount_bucket

Do not transmit payment card information, billing addresses, or other sensitive payment information.

Capture successful subscription and payment events from verified backend webhook processing, not from frontend success-page visits.

# 7. User Identity and Workspace Group Analytics

Implement correct user identification.

Use the stable internal database user ID as PostHog's distinct ID.

Requirements:

- Identify authenticated users after successful authentication.
- Associate anonymous activity with the authenticated account where supported.
- Reset PostHog identity on logout.
- Avoid duplicate identification calls.
- Handle account switching correctly.
- Handle multiple tabs and session transitions safely.

Do not use email as the primary distinct ID.

For user properties, use only appropriate non-sensitive attributes:

- plan
- role
- created_at
- account_status

Do not transmit names, passwords, authentication tokens, private workspace content, or unnecessary personal data.

## Workspace Group Analytics

Waitlyze is a multi-tenant SaaS, so implement PostHog group analytics where appropriate.

Use:

group type: company

group key: stable workspace ID

Useful group properties:

- workspace plan
- workspace creation date
- workspace member count
- workspace status

Associate authenticated workspace members with the appropriate workspace context.

Avoid incorrectly treating every workspace member as a separate company.

Do not identify public waitlist subscribers as Waitlyze application users.

They are the customer's leads, not Waitlyze accounts.

# 8. Server-Side Analytics

Implement a reusable server-side PostHog client using posthog-node.

Important:

- Reuse the client where appropriate.
- Avoid creating a new client for every request.
- Support the server runtime used by the application.
- Handle flushing and shutdown correctly.
- Avoid blocking important application operations on analytics.
- Do not let PostHog outages break core product functionality.

Use server-side events for:

- Verified signup completion where appropriate.
- Waitlist creation.
- Waitlist publishing.
- Verified referral conversions.
- Payment and subscription events.
- Webhook delivery failures.
- Email delivery failures.

Where both frontend and backend events could describe the same operation, establish one canonical event source.

Avoid duplicate event counting.

# 9. Dodo Payments Integration

Inspect the existing Dodo Payments integration.

Instrument the existing verified webhook flow.

Requirements:

1. Verify webhook signatures.
2. Process events idempotently.
3. Update the database and subscription entitlements correctly.
4. Capture analytics only after the business operation has been successfully processed.
5. Use Dodo event IDs or equivalent identifiers for deduplication.
6. Handle retries safely.
7. Handle cancellations, upgrades, downgrades, refunds, and failed payments.

Track:

- billing:checkout_started
- billing:subscription_created
- billing:subscription_updated
- billing:subscription_cancelled
- billing:payment_failed
- billing:refund_processed

Distinguish:

- Free users.
- Pro monthly users.
- Pro annual users.

Capture currency and billing interval.

Never treat a checkout button click as a completed subscription.

Do not use PostHog as the financial source of truth.

Dodo Payments and the Waitlyze billing database remain authoritative for subscription and financial records.

# 10. Session Replay and Autocapture

Configure PostHog session replay.

Use a privacy-conscious setup.

Suggested settings:

- Dashboard: enable recordings.
- Marketing website: selective recording.
- Public waitlist pages: selective sampling.
- Checkout: disable or mask sensitive areas.
- Development: disable by default.

Requirements:

- Mask email inputs.
- Mask password inputs.
- Mask payment-related fields.
- Never record credentials or payment information.
- Avoid recording private workspace content unnecessarily.
- Respect consent requirements.
- Configure privacy controls for public waitlist forms.
- Avoid collecting unnecessary PII through autocapture.

Enable autocapture only where it provides meaningful value.

Prefer explicit custom events for core product actions.

# 11. Privacy and Consent

Implement analytics in accordance with applicable privacy requirements.

Inspect existing cookie consent or privacy mechanisms before adding another system.

Requirements:

- Respect consent choices where required.
- Provide a clear analytics opt-out mechanism.
- Avoid collecting sensitive user information.
- Configure session replay masking.
- Avoid capturing customer waitlist subscriber PII.
- Do not include emails or names in event properties.
- Review autocapture and URL capture for accidental data leakage.
- Avoid exposing internal identifiers unnecessarily in public URLs.

Do not assume PostHog's default settings automatically satisfy all privacy obligations.

Document any required consent configuration that must be completed outside the codebase.

# 12. Acquisition Attribution

Implement reliable acquisition attribution.

Capture appropriate UTM parameters:

- utm_source
- utm_medium
- utm_campaign
- utm_content
- utm_term

Preserve first-touch attribution through signup.

Where useful, also retain last-touch attribution separately.

Track referral domains and landing pages.

Avoid storing unnecessary personal information in attribution data.

Ensure attribution survives the transition from anonymous visitor to registered user where technically supported.

# 13. Dashboards to Create or Document

Create the following PostHog dashboards if supported by the available API or UI automation.

If dashboard creation cannot be performed programmatically, provide exact setup instructions and saved report definitions.

## Dashboard A: Acquisition

Metrics:

- Unique visitors.
- New visitors.
- Signup starts.
- Completed signups.
- Visitor-to-signup conversion.
- Traffic source breakdown.
- Landing page performance.
- UTM campaign performance.

## Dashboard B: Activation

Create a funnel:

1. marketing:page_viewed
2. marketing:signup_completed
3. workspace:created
4. waitlist:created
5. waitlist:published
6. waitlist:signup_received

Measure conversion and abandonment between steps.

## Dashboard C: Product Engagement

Metrics:

- Active workspaces.
- Active users.
- Waitlists created.
- Waitlists published.
- Signup registrations.
- Referral campaigns created.
- Verified referral conversions.
- Integrations connected.
- API usage.
- Feature usage by plan.

## Dashboard D: Revenue

Metrics:

- Active subscriptions.
- New paid subscriptions.
- Free-to-paid conversion.
- Monthly versus annual subscriptions.
- MRR.
- ARR.
- Cancellations.
- Payment failures.
- Refunds.

Clearly document the limitations of calculating financial metrics from analytics events alone.

Use the billing database as the financial source of truth.

## Dashboard E: Retention

Metrics:

- Day 1 retention.
- Day 7 retention.
- Day 30 retention.
- Weekly active workspaces.
- Monthly active workspaces.
- Paid customer retention.

Use meaningful product activity rather than just dashboard pageviews.

# 14. Cohorts

Create or document these cohorts:

- New signups: registered within the last 7 days.
- Activated users: published at least one waitlist.
- Unactivated users: registered but never published a waitlist.
- Free users.
- Paid users.
- Power users: multiple waitlists or substantial product activity.
- At-risk workspaces: previously active but inactive for 14 days.
- Churned customers.

Use stable, meaningful definitions.

# 15. Feature Flags

Set up the PostHog feature flag integration.

Do not unnecessarily replace existing feature-flag or entitlement systems.

Demonstrate usage for:

- New waitlist builder.
- New onboarding flow.
- Advanced analytics.
- New referral reward system.

Requirements:

- Server-side authorization must remain authoritative.
- Paid feature access must never rely solely on frontend feature flags.
- Flags should have sensible fallback behavior.
- Document how to configure and roll out flags.
- Avoid introducing flags for every small UI component.

# 16. Error and Reliability Tracking

PostHog is not a replacement for Sentry.

Keep responsibilities separate:

- PostHog: product behavior and user analytics.
- Sentry: exceptions, stack traces and application performance.

Capture only useful business-level failure events in PostHog.

Do not send raw stack traces, secrets, request bodies or sensitive error information.

# 17. Performance and Reliability Requirements

Ensure:

- Analytics never block core user interactions.
- No duplicate pageviews.
- No duplicate business events.
- No analytics-related application crashes.
- No excessive event volume.
- No excessive database queries solely for analytics.
- No analytics event loops.
- Server events are safely flushed.
- PostHog failures do not interrupt payment or signup operations.

Use event sampling where appropriate for high-volume events.

For high-volume public waitlist signup events, evaluate whether aggregate tracking is more appropriate than recording every individual signup.

Do not sample critical conversion or payment events without explicitly documenting the trade-off.

# 18. Testing

Add tests for the analytics implementation.

Test:

- Client initialization.
- Server initialization.
- Event name consistency.
- Event property validation.
- User identification.
- User logout and reset.
- Workspace group association.
- Duplicate event prevention.
- Dodo webhook idempotency.
- Subscription event tracking.
- Analytics failure handling.
- Privacy and PII filtering.

Mock PostHog in automated tests.

Do not send test events to the production PostHog project.

Verify that the build, linting, TypeScript checks and existing tests continue to pass.

# 19. Documentation

Create a dedicated document:

docs/posthog-analytics.md

Include:

1. PostHog account and project setup.
2. Environment variables.
3. SDK initialization.
4. Analytics architecture.
5. Event taxonomy.
6. Event properties.
7. User identification.
8. Workspace group analytics.
9. Dodo Payments integration.
10. Session replay privacy configuration.
11. UTM attribution.
12. Dashboard setup.
13. Cohort definitions.
14. Feature flag configuration.
15. Testing procedures.
16. Production deployment checklist.
17. How to add new events.
18. How to troubleshoot missing or duplicate events.

Also document which configurations require manual action inside the PostHog dashboard.

# 20. Acceptance Criteria

The implementation is complete only when:

- PostHog initializes correctly.
- Pageviews work across Next.js navigation.
- Authenticated users are identified correctly.
- Logout resets identity.
- Workspace group analytics work.
- Core signup and activation events are tracked.
- Waitlist creation and publishing are tracked.
- Referral events are tracked accurately.
- Verified Dodo subscription events are tracked.
- Duplicate webhook events do not create duplicate conversions.
- Session replay is configured with privacy controls.
- UTM attribution is preserved.
- Event properties are typed and consistent.
- Analytics failures do not break the application.
- Automated tests pass.
- TypeScript checks pass.
- Production build passes.
- Documentation is complete.

# 21. Execution Instructions

Work in the following order:

1. Audit the existing repository.
2. Design the integration around the actual architecture.
3. Install dependencies.
4. Implement centralized analytics infrastructure.
5. Implement client initialization.
6. Implement user identity and workspace groups.
7. Instrument acquisition and activation.
8. Instrument waitlist and referral functionality.
9. Integrate server-side analytics.
10. Instrument Dodo Payments.
11. Configure privacy and session replay.
12. Add tests.
13. Run linting, type checks and production build.
14. Write documentation.
15. Provide a final implementation report.

Do not stop after writing a plan.

Do not leave placeholder implementations for important functionality.

Do not invent database fields or API routes.

Do not refactor unrelated parts of the application.

Do not silently modify existing business logic.

If a requested feature depends on missing infrastructure, explain the dependency and implement everything else that can be completed safely.

At the end, provide:

- Files created.
- Files modified.
- Dependencies added.
- Events implemented.
- Dashboard setup instructions.
- Environment variables required.
- Manual PostHog configuration still needed.
- Tests and build results.
- Any remaining limitations.

The final result should be a maintainable, production-ready PostHog integration that gives Waitlyze meaningful product analytics from its first real customers.
