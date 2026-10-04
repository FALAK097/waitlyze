# Phase 09: Subscribers

The Subscribers tab is a waitlist-scoped workspace for finding and exporting signups. The app shell stays at two destinations (Waitlists and Settings); subscriber operations stay inside the selected waitlist.

## Behavior

- Search email addresses and filter by all, verified, or needs confirmation.
- Fetch 25 records at a time using a stable `createdAt DESC, id DESC` cursor. The cursor must belong to the same active workspace, waitlist, and filter result.
- Open a compact profile with email, verification state, signup time, coarse location, device, and eligible referral count. Referrals count only after both signups verify and only when the waitlist's referral system is enabled. Internal identifiers and IP addresses are never returned.
- Export the full filtered set as a streamed CSV. Every field is quoted, and formula-like input after whitespace/control characters is prefixed with an apostrophe.
- The existing `/api/signups` endpoint keeps its legacy response contract. New UI reads use `/api/wait-lists/[id]/subscribers`; CSV export uses POST on that route to keep download generation explicit.

## Authorization and validation

The route resolves the active workspace and applies `campaignScope(..., "viewAudience", workspace.id)` to both the waitlist and every signup query. Missing or inaccessible campaigns return the same not-found response. Search is capped at 120 characters, status has a fixed enum, and cursors are checked against the fully scoped/filtering query before use.

## Validation

Unit tests cover filter bounds, workspace predicate composition, CSV quoting, and spreadsheet formula injection. Database HTTP tests cover 25-row cursor pagination, filters, authorization boundaries, internal-field exclusion, and complete filtered exports. The local managed worktree uses a dependency symlink outside its project root, which Turbopack rejects; the normal CI checkout is required for the production fixture build and database HTTP suite.
