# Phase 17: consent-aware waitlist automations

Automations stay inside a waitlist’s **Emails** area. This slice adds three plain, editable recipes with a readable trigger → condition → timing → email summary. Recipes are off by default; there is no workflow canvas or new global destination.

## Recipes and trigger rules

- **Welcome after confirmation** runs once after a subscriber verifies their email and has explicitly opted into launch updates.
- **Referral reminder** schedules once after verification. At delivery time it is skipped if the subscriber already has an eligible verified referral.
- **Referral milestone** can send once when a confirmed referral causes the referrer to reach the configured number of eligible verified referrals. `CLEAR` and `APPROVED` reviews count; referrals held for review do not.

Verification writes a durable automation trigger to the outbox in the same transaction as the verified state. The dispatcher creates a run only for recipes that are enabled when that event is handled. A run stores the immutable recipe version, recipient, trigger key, due time and ordered step state. A stable uniqueness key prevents a retried trigger or multiple referrals from scheduling a duplicate run for the same recipe, signup or milestone.

## Consent, edits and pause

All three messages are marketing email. A recipient must be verified, opted in, still subscribed and not workspace-suppressed both when a run is scheduled and immediately before sending. The reminder and milestone conditions are checked again at delivery. Every message includes the visible unsubscribe link and one-click unsubscribe headers used by broadcasts.

Saving creates a new recipe version. Existing runs continue with the version they recorded. Pausing prevents new runs, cancels pending and retry-waiting steps, and records them as canceled. A step already claimed by the provider worker may still arrive. Enabling affects future verification/referral events only; it does not backfill past activity.

The dispatcher uses a stable provider idempotency key, bounded retry/backoff, and the existing outbox status. Run history shows masked recipients and the delivery or skip reason. Provider acceptance is not proof of inbox delivery, and exactly-once external delivery is not promised.

## Operations and limits

Enabling requires the Resend key and protected outbox dispatcher to be configured. Production still requires a live scheduler, sender identity, unsubscribe signing secret, and controlled end-to-end verification before claiming delivery is active. There are no test sends from this console. Recipes do not support branching, segmentation, campaign-specific timezone rules or arbitrary multi-step workflows. Delays are stored in minutes and dispatched by the existing UTC outbox schedule.

## Verification

The unit suite bounds delays, milestone counts and message copy. The disposable PostgreSQL suite covers version snapshots, verification triggers, milestone deduplication, delayed unsubscribe rechecks, delivery headers, cancellation and idempotency. The authenticated browser suite checks the nested navigation, recipe editing/enabling/pausing, cancellation state, accessibility and 320 px layout. No production email credentials or external messages are used by tests.
