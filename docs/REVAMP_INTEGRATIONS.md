# Waitlyze integrations and developer access

## Phase 18A: scoped signup API keys

Developer access lives under Settings → Developers. Creating a key requires owner/admin connection-management access to one waitlist. The key receives only `waitlist:write` for creating signups on that exact waitlist; this API slice does not expose read access. Choose a 30-day, 90-day, one-year, or no-expiry key. Show the token once, store only a SHA-256 digest of its high-entropy secret, and keep a random public identifier so validation reads one row rather than comparing every hash. A revoked or expired token fails closed. Update `lastUsedAt` only after the digest, scope, exact waitlist, expiry, revocation state, and publication state pass.

Existing `wl_` tokens retain their owner-level behavior for compatibility. The Settings list labels those tokens as legacy account-wide access so an owner can replace them with waitlist-bound keys; revocation is soft so credentials remain auditable. The old `/api-keys` page redirects to the Developers section in Settings. Do not show stored hashes through management APIs.

## Phase 18B: outbound webhooks

Each subscription is waitlist-bound and selects signup-created or signup-verified events. Stable event IDs, timestamped HMAC signatures, encrypted signing secrets, bounded retries, test deliveries, pause/resume and explicit replay use a durable database queue dispatched by the authenticated internal scheduler. Event payloads omit subscriber email. Destination checks reject private, link-local and reserved IP ranges, resolve all A/AAAA records, pin a public address, and refuse redirects. Delivery logs keep only status, response code and a sanitized error code. See the Phase 18B PR for source, migration and test details.

Before calling production delivery live, configure the shared base64-encoded 32-byte `WEBHOOK_SECRET_ENCRYPTION_KEY` and the existing internal outbox scheduler. It encrypts webhook signing secrets and later workspace provider credentials. A green preview build does not prove that production jobs or provider credentials are configured.

## Phase 19A: workspace Resend connection

The workspace Integrations section accepts a Resend sending-only key and a sender address. Secret material is encrypted with the shared integration key and never returned to the browser. A workspace owner/admin explicitly sends a test email to their own signed-in address; until that succeeds, the deployment sender remains active. A successful test activates the workspace sender for transactional verification, broadcasts, and automation email within that workspace. Disconnecting removes the saved credential and returns delivery to the deployment sender. Errors preserve form input and redact provider details.

Keep the section short and operational: connection state, sender address, save/test/disconnect, and last test result. Resend credentials are workspace-level. Do not expose API keys in Settings APIs or logs. Validate key access by sending a user-requested test email rather than by requiring a full-access domain listing call. See [Resend send email](https://resend.com/docs/api-reference/emails/send-email) and [API-key permissions](https://resend.com/changelog/new-api-key-permissions).

## Phase 19B: Slack notifications

Add the Slack connection only after the shared workspace credential store ships. Use Slack OAuth or the official Incoming Webhook install flow; if storing an incoming-webhook URL, restrict it to the documented Slack host and path, encrypt it, and send only explicitly requested test messages. Event selection belongs to the relevant waitlist, not to a new global destination. Deliver selected events through a durable queue with stable IDs, pause/revoke, redacted status, and tenant/concurrency tests. Do not send subscriber email or other unnecessary personal data to Slack.

## Phase 19C: optional analytics setup

Offer only if tracking consent and the configured providers are implemented end to end. Keep provider IDs and scripts scoped to the workspace/waitlist, avoid silently injecting third-party scripts, and explain that external analytics receives visitor data. Do not show a connect card without a working test and revoke path.
