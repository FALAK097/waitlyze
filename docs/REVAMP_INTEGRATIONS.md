# Waitlyze integrations and developer access

## Phase 18A: scoped signup API keys

Developer access lives under Settings → Developers. Creating a key requires owner/admin connection-management access to one waitlist. The key receives only `waitlist:write` for creating signups on that exact waitlist; this API slice does not expose read access. Choose a 30-day, 90-day, one-year, or no-expiry key. Show the token once, store only a SHA-256 digest of its high-entropy secret, and keep a random public identifier so validation reads one row rather than comparing every hash. A revoked or expired token fails closed. Update `lastUsedAt` only after the digest, scope, exact waitlist, expiry, revocation state, and publication state pass.

Existing `wl_` tokens retain their owner-level behavior for compatibility. The Settings list labels those tokens as legacy account-wide access so an owner can replace them with waitlist-bound keys; revocation is soft so credentials remain auditable. The old `/api-keys` page redirects to the Developers section in Settings. Do not show stored hashes through management APIs.

## Phase 18B: outbound webhooks

Webhooks remain a separate follow-up slice. Bind each subscription to a workspace and selected waitlist events. Deliver stable event IDs with timestamped signatures, bounded retry/backoff, deduplication, dead-letter visibility, and explicit replay. Validate destination addresses against private, link-local, and metadata ranges on every resolution; reject redirects and protect against DNS rebinding. Keep delivery logs redacted and distinguish test deliveries. Implement durable delivery through an owned worker or managed queue; do not create detached request promises.

Acceptance requires tenant-boundary tests, expired/revoked/scope-denial tests, secret-rotation behavior, signature verification, replay/idempotency, SSRF defenses, and keyboard/mobile/a11y coverage of Settings → Developers and delivery controls. A green preview build does not prove that production jobs or provider credentials are configured.
