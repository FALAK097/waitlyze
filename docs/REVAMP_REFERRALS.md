# Phase 10: verified referrals and waitlist position

This phase replaces the legacy rank rewrite in the signup transaction with a campaign-scoped read query. It preserves the existing public response fields and changes rank to reflect the verified-referral contract.

## Eligibility and ordering

- A referral is eligible only when the waitlist has its referral system enabled, the referrer and referred signup belong to that same waitlist, and both email addresses are verified.
- A signup cannot refer itself. A referred signup contributes at most once because `Referral.signUpId` is unique.
- Being referred does not increase a signup's own score. Score is the number of eligible signups it referred.
- All accepted signups keep a position. Unverified signups have a referral score of zero until verification; verifying either side can immediately change positions.
- Order is eligible referral score descending, `createdAt` ascending, then stable signup ID ascending.
- Disabled, self, unknown, and cross-waitlist referral codes do not create an eligible edge.

## Implementation and compatibility

The position query aggregates eligible edges for one waitlist and counts rows ahead of the requested signup. It uses indexes for campaign chronology and `referredById`; it does not read the whole audience into the application or write ranks for every signup. The historical `SignUp.rank` column remains for migration compatibility but is no longer a source of truth. Legacy API fields, duplicate responses, and the welcome-email position placeholder stay intact and use the current calculated position.

Audience profiles show eligible referral counts, so pending/unverified referrals are not reported as confirmed growth. Referral creation obeys the waitlist's existing `showReferrals` setting; new drafts already default that setting off. No production migration or referral sending was performed.

## Validation

Disposable-PostgreSQL tests cover a referral before/after verification, the referrer's changing position, disabled and cross-waitlist referral codes, missing signup IDs, join-time and stable-ID ties, and the absence of stored rank fanout. Existing signup concurrency, replay, outbox, API response and CSV tests remain required.
