# PR #89 security review

Reviewed: October 11, 2026. This is a source review and targeted regression suite, not a penetration test or a claim that production configuration has been verified.

## Coverage

Reviewed authenticated API routes and Server Actions, workspace access and invitations, public legacy and structured forms, signup/referral verification, API-key authorization, subscriber exports, email rendering/consent/suppression/outbox, integrations and secret encryption, outgoing webhooks, upload handling, custom-domain provider and routing, auth/cookies, and environment exposure. The review applied Vercel's `server-auth-actions` rule: authentication and resource permissions must be enforced inside each callable mutation, not solely by a protected layout or proxy.

## Fixed in this PR

| Issue | Change | Evidence |
| --- | --- | --- |
| Uploaded MIME and filename were trusted; SVG or disguised active content could be published | Decode actual raster bytes with Sharp, reject active SVG/invalid data and excessive pixels, strip metadata and publish a bounded WebP with a generated fixed extension | Actual PNG normalization, SVG/HTML/malformed/oversize rejection, and 16-million-pixel limit tests |
| API keys survived removal or demotion of the issuing workspace member | Published campaign query includes current issuer OWNER/ADMIN permission; legacy keys also pass this predicate and enforce expiration. Bound inputs before DB/bcrypt work; legacy search is limited to the relevant published owner's campaign | Authorized/revoked-membership tests and oversized key rejection |
| An idempotent browser signup could reverse an unsubscribe or silently grant marketing consent | Existing signup retries return the prior subscriber unchanged. Browser/referral identifiers cannot update preferences | Existing unsubscribed subscriber regression with forbidden consent writes |
| Public impression response exposed IP, geographic and device records; public signup lookup exposed browser identifier | Public responses contain only the required ID/waitlist/rank fields; public input shape and identifier lengths validated before querying | Route source review and lint; production response checks remain an integration gate |
| Legacy hosted form serialized the entire campaign, including internal owner/workspace identifiers and draft properties | Explicit public visual-field selection; no complete campaign object is sent to the browser | Source review; authenticated/browser smoke test remains an integration gate |
| Public legacy welcome action could email unverified addresses and race multiple sends | Validate bounded recipient input, require a verified subscriber, and use a stable Resend idempotency key | Source review; real-provider replay test remains external |
| Auth explicitly disabled secure-cookie mode in production | Production uses secure-cookie mode and secure cookie attributes; local development uses local-compatible cookies | Source review; deployed OAuth/cookie check remains external |
| Malformed hexadecimal signatures could decode as an otherwise valid signature | Require exact 64-character hex before timing-safe comparison | Exact signature, payload modification and malformed signature tests |
| Crashed webhook deliveries remained PROCESSING indefinitely | Dispatcher now discovers expired processing leases, using the existing claim mechanism | Dispatcher lease-selection regression |
| Internal dispatcher auth could throw on equal-character-length but unequal-byte-length input | Require Bearer format and compare byte lengths before timing-safe comparison | Source review and lint |
| Public signup/impression/email requests lacked shared abuse and recipient budgets | Atomic PostgreSQL global/campaign/client/recipient counters, fail-closed admission, TTL cleanup and trusted edge identity only | Real concurrent PostgreSQL test plus fail-closed, spoofing and key privacy tests |
| Later broadcast and automation bounces/complaints failed to suppress the original recipient | Resolve persisted delivery/recipient evidence, retain signed-event recipients for webhook races, and match the original address before suppression | Four suppression regression cases |
| Invitation token rotation could race acceptance | Claim the exact token hash with the one-use state update | Concurrent token-rotation regression |
| Authenticated mail sending lacked recipient and actor delivery limits | Require one bounded email address; enforce shared global/workspace/actor/recipient budgets | Authenticated admission identity and recipient-array regressions |

The API-key change intentionally invalidates keys issued by members who have lost connection-management privileges. Duplicate signup retries intentionally preserve opt-outs; a future re-subscribe flow must verify address ownership explicitly.

## Existing protections confirmed in source

- Resource queries use workspace membership predicates. Legacy owner fallback applies only while the campaign has no workspace. Admin mutations use role checks; accepting an invitation checks verified account email and one-use token state.
- Signup creation checks publication while holding a transaction share lock. Email normalization and uniqueness are database-backed. Verification tokens are random, hashed for lookup, expire and are claimed once. Referral ranking requires both addresses verified and approved/clear relationships within one campaign.
- Outgoing webhook URLs require public HTTPS/standard port. All DNS answers must be public; delivery pins the validated IP with the original hostname/TLS verification. Redirects are not followed, response bytes and request time are bounded.
- Integration/webhook secrets use AES-256-GCM with random IVs and are excluded from safe API selections. Environment secrets are server-only; the only public environment value is the asset URL.
- Broadcast/automation dispatch rechecks verified consent, unsubscribe status and suppression. Provider events are signature-verified before processing. Emails escape plain text or sanitize Markdown; public page text is rendered through React's escaping.
- Subscriber CSV export neutralizes formula-leading cell contents; exports require workspace audience access and use private/no-store cache headers. Account export selects data explicitly and excludes key/secret material.
- Custom domains use a fixed authenticated Vercel API host, normalized hostnames, provider ownership verification and ACTIVE status before rendering.

## Remaining production gates and improvements

| Priority | Requirement | Status |
| --- | --- | --- |
| P2 | Add edge WAF/challenge protection and tune conservative signup quotas using actual launch traffic | Application admission now uses shared PostgreSQL counters. IP/campaign/recipient budgets limit public verification enqueue and legacy welcome sends. Edge DDoS protection and challenge UX remain defense in depth; application quotas do not prevent a deliberate attacker exhausting shared quotas |
| P1 before promotion | Verify OAuth redirect ownership, secure cookies/session revocation, issuer membership removal and cross-workspace denial in the deployed environment | Source checks and mocks do not prove real provider/browser behavior |
| P1 before promotion | Validate dispatcher scheduling/auth, Resend signed webhook events, verified sender, unsubscribe and suppression replay end-to-end | Requires provider configuration and real runtime validation. Local secrets alone do not establish these gates |
| P1 before promotion | Verify deployment migration history and database connectivity | Fresh/repeat migrations, legacy data preservation, rollback and schema parity passed locally. Latest Vercel Preview build successfully applied the consolidated migration; earlier downloaded-URL checks returned `3D000` |
| P2 | Test DNS pinning and timeout behavior against controlled public webhook receivers, including redirects/rebinding attempts and lease recovery after termination | Pure regression suite covers validation/signing; live network behavior is unverified |
| P2 | Add delivery audit logs and tune administrator quotas | Invitation and test-email sending now have global, workspace, actor and recipient admission budgets |
| P2 | Add restrictive security response headers and a measured CSP compatible with Next.js, auth and embedded signup flows | Requires runtime/script inventory rather than a guessed policy |
| P2 | Define asset lifecycle and uploads per workspace, with orphan cleanup and server/platform request-body limits | Uploads are user-owned and normalized; cross-member ownership and cleanup remain product decisions |
| P2 | Test sender/provider idempotency after the provider retention window; monitor failed/stalled queues and suppression lag | At-least-once external delivery needs operational monitoring |

## Validation

- Security unit tests: 22/22 passing. PostgreSQL integration: 1/1 passing against an isolated local schema; the fixture schema was dropped afterward. The concurrency run admitted exactly 3 of 20 parallel requests for one address, then exactly 17 more unique addresses before the shared client cap of 20; denied admissions did not consume counters. TTL cleanup and expiry reset also passed.
- ESLint on all files changed by this security review: passing.
- `git diff --check`: passing at the review checkpoint.
- Quality workflow includes unit regressions and the PostgreSQL integration in its database-enabled migration job (coordinated with the repository/migration agent).
- Full application build and broader browser/database checks are run by the orchestrator after integrating all agents' edits. No production deployment, real OAuth login, customer mailbox test, DNS change or authenticated cross-tenant browser session was performed by this reviewer.

## Persistent public admission budgets

`src/lib/security/public-rate-limit.mjs` guards both signup POST APIs, impression creation and the legacy public welcome action. The underlying `rate_limit_buckets` table is part of this PR's consolidated migration. Counters are updated under a database transaction/advisory lock and atomic UPSERT; an exceeded bucket rolls back every counter. Storage failure returns 503 and does not create a signup or send welcome email. Signup admission takes place before public database validation/key hashing, protecting those costs as well as the verification outbox.

| Action | Global | Per campaign | Per client | Per email across campaigns |
| --- | --- | --- | --- | --- |
| Signup / verification enqueue | 5,000 / 24h | 1,000 / 24h | 20 / hour | 3 / 24h |
| Impression | 20,000 / hour | 5,000 / hour | 120 / hour | — |
| Legacy welcome email | 1,000 / 24h | 250 / 24h | 10 / hour | 1 / 24h |

These are fixed windows starting at the first admitted request; requests can consume a budget even when later product validation fails. This conservative choice protects database/hash work. Denied counter admission itself allocates no new identity buckets. Global admission limits bound bucket creation; each transaction deletes at most 200 expired records, and no window exceeds 24 hours. Keys use HMAC with the server auth secret so raw email/client addresses are not stored in this table.

Only Vercel deployments (`VERCEL=1`) use the validated, single-IP `x-vercel-forwarded-for` edge header. Vercel documents its [overwritten request headers](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for). Other hosts ignore forwarding headers and share the stricter `untrusted-client` bucket until an explicitly trusted proxy integration is implemented. Do not set `VERCEL=1` manually on a publicly reachable non-Vercel server. Verify the actual deployment's headers and NAT traffic before raising limits.

Authentication, membership enforcement and provider idempotency remain independent of rate-limit admission. The local PostgreSQL test proves counter atomicity, not provider deliverability or deployed proxy ownership.

Final independent review: approved after verifying suppression recipient/workspace evidence, token rotation claims, authenticated delivery quotas, migration schema, publication origins, login links, removed imports and tour guards. The reviewer reran 22 unit regressions; PostgreSQL integration was verified separately by the orchestrator.

Post-push evidence: Quality run 38148833213 passed build, lint/security regressions and PostgreSQL migrations. GitGuardian passed. Vercel deployment dpl_9cRG3ZzAUhSuwtkwLepisjVCXtrx reached Ready and its build log confirms the consolidated migration applied successfully. CodeRabbit skipped its automated review because the full PR exceeds its file limit; the independent agent review is recorded separately.
