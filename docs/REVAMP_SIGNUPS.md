# Signup service and verification queue

Phase 08 moves both public signup routes through one transactional service. It preserves the established response shapes and duplicate status codes while protecting signup against concurrent submissions and replayed requests.

## Contract

- Only a currently published waitlist accepts new signups. A row-level share lock makes the publication check and insert serialize with a concurrent pause.
- Email addresses are trimmed and normalized to lowercase for a per-waitlist unique constraint. The earliest historical record retains the canonical key when old case-insensitive duplicates are found; other records remain intact with a null normalized key.
- Replaying the same normalized email from the same `hypeSession` returns the existing signup. A different session gets the legacy duplicate response. The API-key route retains its legacy `409` response and rank/date fields.
- Signup, optional referral, recalculated legacy rank, single-use verification token, and outbox event are committed or rolled back together. A unique-index conflict resolves as a duplicate, including concurrent requests.
- Verification tokens are 256-bit random values. Only a SHA-256 digest is stored in the verification table; verification expires after 24 hours and atomically consumes the token once.
- Verification request events are durable and carry the token for the future delivery worker. Do not log or expose outbox payloads. This phase does not send email or claim verification succeeded; delivery and diagnostics ship in Phase 14.

## Referral position follow-up

Phase 10 replaces the old campaign-wide rank rewrite with a verified-referral position query. The accepted signup and outbox transaction remains unchanged; rank is calculated after commit and when legacy endpoints read it. The exact eligibility, tie-break order, indexes, compatibility behavior, and test coverage are recorded in [`REVAMP_REFERRALS.md`](./REVAMP_REFERRALS.md). Phase 09 keeps unverified records visible with an explicit status. Do not treat queued verification as proof that a subscriber received an email.

Validation covers an additive migration on empty PostgreSQL, normalized uniqueness, concurrent case variants, same-request replay, duplicate rejection, verification expiry/replay, and atomic outbox creation. An HTTP regression test checks the existing public response shape, duplicate status, hidden internal columns, and token consumption. The production Resend workflow is not exercised here.
