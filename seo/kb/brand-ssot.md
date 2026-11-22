# Brand SSOT: Waitlyze (waitlyze.com)

Last verified: 2026-11-22

## Product mechanics

- Open-source waitlist and pre-launch audience builder (`https://github.com/FALAK097/waitlyze`).
- Hosted waitlist pages (`/w/[slug]`), 14 industry templates (`/templates/[id]`), optional custom domains (Pro), and 2-line embeddable signup widget (`/js/embed.js`).
- Double opt-in email verification (`Needs confirmation` expires in 24 hours; only confirmed subscribers earn referral credit, queue position, and marketing sends).
- Fraud controls: IP-velocity limits, self-referral and duplicate blocking, optional Cloudflare Turnstile per waitlist, and manual referral review queue.
- Subscriber emails: BYO verified Resend sender for confirmation emails on Free and Pro; Pro unlocks broadcasts and automated welcome, referral-reminder, and milestone sequences.
- Developer stack: server-side Public Signup API (`POST /api/waitlist`, `GET /api/waitlist`, `POST /api/waitlist/points`), OpenAPI spec (`/openapi.json`), signed webhooks (`referral.completed`, milestones), CSV export, and Streamable HTTP MCP server (`/mcp`).

## Pricing tiers (verified from `src/lib/billing/pricing.mjs`)

- **Free:** `$0` for 1 workspace, 1 waitlist, 1 member, and 100 cumulative signups per Free workspace (does not reset monthly or when deleting a waitlist). Includes hosted pages, embed forms, verified referrals, and API access.
- **Pro:** `$15/month` or `$119/year` (`$9.92/month` equivalent) flat per workspace for unlimited workspaces, waitlists, signups, and workspace members, plus broadcasts, automations, advanced analytics, branding removal, and 1 custom domain per waitlist.
- **Promotional pricing:** BFCM 2026 promo (`BFCM2026`, 40% off Pro Annual) active 2026-11-22 through 2026-12-03.

## Boundaries (what Waitlyze does NOT do)

- Does not ship physical products, issue gift cards, or automatically fulfill referral rewards.
- Does not provide a built-in shared email sender for subscriber broadcasts without connecting a verified Resend sender.
- Open-source codebase does not imply managed self-hosting support.
