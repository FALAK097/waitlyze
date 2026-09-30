# Phase 16: opted-in broadcasts

This slice adds a one-time update flow inside a waitlist’s existing **Emails** area. It adds no global email, audience, or automation destination.

## Audience and consent

The hosted signup form offers an unchecked, optional “Email me occasional updates about this launch” choice. The signup service records the current timestamp and an immutable preference event with the exact displayed consent text only when the person checks it. Verification and marketing consent remain separate; legacy signups and API clients that omit the field are never opted in. A repeated signup can explicitly opt in again, while an unchecked repeat never silently changes an existing preference.

Broadcast previews and queue snapshots include only subscribers who are verified, opted in, still subscribed, and not suppressed for their workspace. The send transaction re-counts the preview, compares it with the count the operator reviewed, snapshots eligible addresses, and writes one uniquely keyed outbox event per recipient. Delivery checks verification, consent, unsubscribe state, current address, campaign publication, and workspace suppression again immediately before calling Resend.

The email includes a visible unsubscribe link and RFC 8058 `List-Unsubscribe` headers. Opening the link is read-only; the public page requires a deliberate POST. The one-click POST endpoint is also supported. Preference updates are idempotent and each change is recorded in the immutable consent-event ledger. Unsubscribe tokens are HMAC-derived and only their hash is stored on the subscriber. Set `MARKETING_UNSUBSCRIBE_SECRET` to a stable, dedicated random secret before sending; keep it stable while those messages can still be used.

## Draft and delivery behavior

An email operator can create and save a plain-text draft, review a masked sample and the current eligible count, then take a second explicit action to queue the exact count they reviewed. Content is escaped into a simple responsive message; line breaks are preserved. Sending is unavailable until the existing Resend key and outbox dispatch secret are configured. No recipient addresses appear in the preview UI.

Recipient snapshots are immutable for each queued broadcast. Provider calls use the event key as the idempotency key; transient failures retry through the existing bounded outbox. Operators can cancel queued recipients. A message already claimed by the worker can still finish, and the delivery counts show delivered, failed, skipped, and canceled recipients. Verification and completed outbox payloads do not retain unsubscribe tokens.

This first slice does not add segmentation, scheduled sends, reusable marketing templates, automation recipes, workspace sender-domain setup, or production email credentials. Do not claim production delivery until the scheduler, sender identity, and unsubscribe secret are configured and a controlled end-to-end send is verified.

## Verification

The database suite covers explicit opt-in, non-mutating invalid preference checks, repeated unsubscribe, transient broadcast retry, stable idempotency, escaped message content, RFC unsubscribe headers, token-free completed outbox payloads, and final delivery state. The hosted signup browser flow checks the unchecked default, explicit opt-in, accessible preference controls, scanner-safe GET behavior, and the unsubscribe POST. GitHub Quality remains the authoritative migration/database/browser gate for this branch.
