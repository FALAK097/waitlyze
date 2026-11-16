# Waitlyze PostHog Product Analytics Documentation

This document describes the complete PostHog product analytics integration for Waitlyze, including project setup, architecture, event taxonomy, user and group identification, privacy safeguards, dashboards, cohorts, feature flags, and troubleshooting procedures.

---

## 1. PostHog Account & Project Setup

- **Project ID**: `517033`
- **Region**: US Cloud (`https://us.i.posthog.com`)
- **Project Token**: `phc_vfaMAZVH3zqkvQmHiAbNij5CBFaXgWh4yB7HZYRJJk7p`
- **Target Environments**: Production, Staging, Local Development.

### PostHog MCP & Skills Configuration

PostHog Model Context Protocol (MCP) and agent skills are configured across AI coding assistants:

- **OpenCode**: `~/.config/opencode/opencode.json` configured with remote MCP `https://mcp.posthog.com/mcp` and skill at `~/.config/opencode/skills/posthog/SKILL.md`.
- **Antigravity / Gemini**: `~/.gemini/settings.json` configured with HTTP MCP `https://mcp.posthog.com/mcp` and skill at `.agents/skills/posthog/SKILL.md`.
- **Codex**: `~/.codex/config.toml` configured with `[mcp_servers.posthog]` and skill at `~/.codex/skills/posthog/SKILL.md`.

---

## 2. Environment Variables

The application relies on the following environment variables validated in `src/lib/env.mjs`:

```bash
# Public browser client
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_vfaMAZVH3zqkvQmHiAbNij5CBFaXgWh4yB7HZYRJJk7p
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Server-side (Node.js API routes, server actions, webhooks)
POSTHOG_PROJECT_TOKEN=phc_vfaMAZVH3zqkvQmHiAbNij5CBFaXgWh4yB7HZYRJJk7p
POSTHOG_HOST=https://us.i.posthog.com
```

Both `.env.example` and local `.env` have been updated with these configurations.

---

## 3. SDK Initialization

### Browser SDK (`src/lib/posthog/client.js`)

- Initialized on client via `initClientPostHog()`.
- **Persistence**:
  - `memory` persistence on public marketing pages (`/`, `/templates`, `/blog`, `/pricing`, `/compare`, `/alternatives`, `/privacy`, `/terms`). This guarantees **zero tracking cookies** are stored on public visitors, eliminating the need for an intrusive cookie consent banner.
  - `localStorage+cookie` for authenticated dashboard sessions (`/(app)/*`).
- **Autocapture**: Disabled (`autocapture: false`) to prevent accidental PII leakage and bloated event volumes.
- **Session Replay**: Disabled on public landing pages; enabled in dashboard with text/input masking (`maskAllInputs: true`).
- **Public Waitlists Excluded**: Never initializes or runs on customer waitlist URLs (`/w/*` and `/domain/*`).

### Server SDK (`src/lib/posthog/server.mjs`)

- Node.js SDK singleton initialized via `getServerPostHog()`.
- Configured with `flushAt: 1` and `flushInterval: 0` for serverless environments.
- Provides `trackServerEvent({ distinctId, event, properties, groups })` and `setServerGroup({ groupType, groupKey, properties })`.
- All methods are **non-blocking and fail-open** (wrapped in try/catch) so analytics blips never disrupt core user transactions.

---

## 4. Analytics Architecture

```
                       ┌─────────────────────────────────────┐
                       │        Waitlyze Application        │
                       └──────────────────┬──────────────────┘
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            ▼                                                           ▼
┌───────────────────────────────┐                       ┌───────────────────────────────┐
│     Client-Side (Browser)     │                       │     Server-Side (Node.js)     │
│   `src/lib/posthog/client.js`  │                       │   `src/lib/posthog/server.mjs`│
├───────────────────────────────┤                       ├───────────────────────────────┤
│ • Cookieless Memory Mode       │                       │ • Singleton Client            │
│ • App Router Pageviews        │                       │ • Server Action Tracking      │
│ • User & Group Sync Component  │                       │ • Outbox / Webhook Tracking   │
│ • Session Replay Masking      │                       │ • Fail-Open Error Handling    │
└───────────────┬───────────────┘                       └───────────────┬───────────────┘
                │                                                       │
                └──────────────────────────┬────────────────────────────┘
                                           ▼
                       ┌───────────────────────────────────────┐
                       │           PostHog Cloud (US)          │
                       │          Project ID: 517033           │
                       └───────────────────────────────────────┘
```

---

## 5. Event Taxonomy

All events use domain-prefixed namespaces defined in `src/lib/posthog/events.mjs`:

| Event Name                       | Domain      | Description                                      | Trigger Location                           |
| :------------------------------- | :---------- | :----------------------------------------------- | :----------------------------------------- |
| `marketing:page_viewed`          | Acquisition | Marketing/public page viewed                     | `src/lib/posthog/provider.jsx`             |
| `marketing:signup_started`       | Acquisition | User opened signup modal / initiated Google Auth | `src/components/auth/auth-modal.jsx`       |
| `marketing:signup_completed`     | Acquisition | User successfully created account                | `src/lib/auth.js` (`user.create.after`)    |
| `marketing:login_completed`      | Acquisition | User logged into dashboard                       | App shell / Auth hook                      |
| `marketing:pricing_viewed`       | Acquisition | Visitor viewed pricing table                     | `src/lib/posthog/provider.jsx`             |
| `workspace:created`              | Workspace   | User created a new workspace                     | `src/app/actions/settings.js`              |
| `waitlist:created`               | Waitlist    | Waitlist draft created                           | `src/app/actions/waitLists.js`             |
| `waitlist:published`             | Waitlist    | Waitlist published to public web                 | `src/app/actions/publication.js`           |
| `waitlist:milestone_reached`     | Waitlist    | Milestone reached (1, 10, 100, 1000 signups)     | `src/lib/emails/founder-notifications.mjs` |
| `referral:conversion_received`   | Referral    | Verified referral credit awarded                 | `src/lib/campaigns/signups.mjs`            |
| `referral:reward_unlocked`       | Referral    | Reward tier unlocked by referral count           | `src/lib/campaigns/signups.mjs`            |
| `billing:subscription_created`   | Billing     | Paid subscription created in Dodo                | `src/app/api/webhooks/dodo/route.js`       |
| `billing:subscription_updated`   | Billing     | Subscription plan changed / renewed              | `src/app/api/webhooks/dodo/route.js`       |
| `billing:subscription_cancelled` | Billing     | Subscription cancelled / expired                 | `src/app/api/webhooks/dodo/route.js`       |
| `billing:payment_failed`         | Billing     | Subscription renewal failed                      | `src/app/api/webhooks/dodo/route.js`       |
| `billing:refund_processed`       | Billing     | Refund processed via Dodo                        | `src/app/api/webhooks/dodo/route.js`       |

---

## 6. Event Properties

### Acquisition Properties

- `page_path`: Current route path (e.g., `/pricing`).
- `page_type`: Categorization (`landing`, `templates`, `blog`, `pricing`, `dashboard`).
- `signup_method`: Auth method (`google`, `email`).
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`: Campaign tags preserved across the session.
- `referrer_domain`: Document referrer domain.

### Workspace & Waitlist Properties

- `workspace_id`: ID of the workspace owning the resource.
- `waitlist_id`: ID of the waitlist.
- `template_id`: Template used during creation.
- `creation_method`: `modal_draft`, `quick_create`, `ai_prompt`.
- `has_custom_domain`: Boolean indicating whether a custom domain is attached.

### Billing Properties

- `workspace_id`: Group key.
- `subscription_id`: Dodo Payments subscription ID.
- `product_id`: Dodo product ID.
- `status`: Subscription status (`active`, `cancelled`, `on_hold`).
- `currency`: Currency code (e.g. `USD`).
- `interval`: Billing cycle (`month`, `year`).

---

## 7. User Identification & Group Analytics

### User Identification

- User identity is set via `identifyClientUser(userId, properties)` using internal CUIDs (`user.id`).
- Raw emails and passwords are **never** used as `distinctId`.
- On logout, `resetClientUser()` is invoked in `src/components/product/app-shell.jsx` to clear the distinct ID and prevent cross-session contamination.

### Multi-Tenant Group Tracking (`company`)

PostHog groups are utilized to track workspaces:

- Group Type: `company`
- Group Key: `workspace.id`
- Properties: `name`, `slug`, `plan`, `role`.
- Group synchronization is performed client-side by `<PostHogUserSync />` mounted in `src/app/(app)/layout.jsx`, and server-side via `setServerGroup()`.

---

## 8. Dodo Payments Webhook Integration

Billing event tracking is integrated into the official Dodo webhook handler (`src/app/api/webhooks/dodo/route.js`):

1. **Cryptographic Verification**: Webhook signature is validated using standard Dodo Webhook secrets before analytics processing.
2. **Idempotency**: Webhook idempotency is enforced by recording `DodoWebhookLog`. Duplicate deliveries are deduplicated and will not fire duplicate conversion events.
3. **Fail-Open Execution**: Analytics calls (`trackServerEvent`) are executed asynchronously and wrapped in error guards so payment processing always succeeds regardless of PostHog service availability.

---

## 9. Privacy & Session Replay Configuration

1. **Zero Cookie Banner**: On public marketing surfaces, memory persistence eliminates cookies and tracking identifiers.
2. **Form Masking**:
   - `maskAllInputs: true` ensures that inputs are masked by default.
   - Specific sensitive selectors (`[data-ph-mask]`, `.sensitive-data`, `input[type="password"]`, `input[type="email"]`) are scrubbed from replay recordings.
3. **Exclusion of Public Forms**: End-user subscriber visits to `/w/*` (hosted waitlists) and `/domain/*` are strictly excluded from tracking to respect customer privacy and GDPR compliance.

---

## 10. Dashboards Setup Guide

To create the recommended dashboards in PostHog:

### Dashboard A: Acquisition & Landing Page Performance

1. **Visitor-to-Signup Conversion Funnel**:
   - Step 1: `marketing:page_viewed` (filter: `page_type = landing`)
   - Step 2: `marketing:signup_started`
   - Step 3: `marketing:signup_completed`
2. **Traffic Sources**: Breakdown by `utm_source` and `referrer_domain`.
3. **Pricing Page Efficiency**: Funnel from `marketing:pricing_viewed` to `billing:subscription_created`.

### Dashboard B: Activation Funnel

1. Step 1: `marketing:signup_completed`
2. Step 2: `workspace:created`
3. Step 3: `waitlist:created`
4. Step 4: `waitlist:published`
5. Step 5: `waitlist:milestone_reached` (count = 1)

### Dashboard C: Product Engagement

- **Active Workspaces**: Weekly active workspaces (WAW) grouped by `company`.
- **Waitlists Published per Workspace**: Average number of active waitlists.
- **Referral Conversions**: Total `referral:conversion_received` events over time.

### Dashboard D: Revenue & Retention

- **New Paid Subscriptions**: Count of `billing:subscription_created`.
- **Churn Rate**: `billing:subscription_cancelled` relative to active subscriptions.
- **Retention**: Cohort retention analysis based on workspace activity at Day 1, Day 7, and Day 30.

---

## 11. Cohorts

Define the following cohorts in the PostHog UI:

1. **New Signups**: Users with `marketing:signup_completed` in the last 7 days.
2. **Activated Workspaces**: Workspaces where `waitlist:published` count > 0.
3. **Power Users**: Workspaces with > 3 waitlists or > 100 signups received.
4. **At-Risk Workspaces**: Workspaces active in the last 30 days but with no events in the last 14 days.
5. **Paid Workspaces**: Workspaces with `plan = pro`.

---

## 12. Feature Flags

Feature flags are configured in `src/lib/posthog/flags.js`:

- `new-waitlist-builder`
- `new-onboarding-flow`
- `advanced-analytics`
- `new-referral-reward-system`

Usage:

```javascript
import { FEATURE_FLAGS, isClientFeatureEnabled } from "@/lib/posthog/flags";

if (isClientFeatureEnabled(FEATURE_FLAGS.ADVANCED_ANALYTICS)) {
  // Render new analytics UI
}
```

_Note: Feature flags must only control UI/UX rollout. Server-side entitlements in `src/lib/billing/plans.mjs` remain authoritative for security and billing limits._

---

## 13. Testing & Verification

Automated unit tests are located in `tests/posthog.test.mjs`.

To run the test suite:

```bash
node --env-file=.env --test tests/posthog.test.mjs
```

Verification covers:

- Complete frozen namespaced taxonomy.
- Server SDK safe fail-open behavior and flush capability.
- Client SDK no-op behavior during SSR / headless testing.

---

## 14. Troubleshooting & FAQ

- **Events Not Appearing**:
  1. Ensure `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `POSTHOG_PROJECT_TOKEN` are set.
  2. Verify ad-blockers are disabled during testing or use a reverse proxy route.
  3. Verify whether you are testing on an excluded path (`/w/*`).
- **Duplicate Events**:
  - Webhooks enforce deduplication via `DodoWebhookLog`. Ensure idempotency keys are passed.
- **Group Analytics Incomplete**:
  - Group analytics requires PostHog Organization to have Group Analytics enabled. Workspace group events will automatically link once enabled.
