# Waitlist starters and private drafts

Phase 05 adds the first creation path after the authenticated shell. The seven starter cards are SaaS, Mobile app, AI tool, Community, Consumer product, Newsletter and Blank. Each has one short purpose, structured placeholder sections and a versioned manifest; selecting a card renders its copy directly as a local preview. The preview has no remote image dependency, invented customer proof, generated avatar, or live signup behavior.

## State and trust boundary

The browser sends a starter ID and editable waitlist details. The server resolves the ID against the versioned catalog, validates bounded copy and a UUID creation key, rechecks workspace membership inside a serializable transaction, and records a private `DRAFT` with a server-owned snapshot. A workspace-scoped key makes retries idempotent. Reusing that key with changed details fails; address collisions are reported without changing an existing waitlist. Email delivery, referrals, verification, social proof and logo display start disabled.

The additive migration backfills no starter content. Existing rows remain `PUBLISHED` with null slug and snapshot so their public IDs, URLs and behavior remain compatible; only newly created rows default to `DRAFT`. This was verified by applying the migration in the local fixture and by executing the migration SQL against isolated preexisting-row fixture tables. No production migration or backfill was run.

Public form rendering and metadata, signup/impression validation and services, signup lookup, API-key signup, and signup email rendering reject nonpublished waitlists. The database checks at several request boundaries are not a transactional publishing protocol; publication, durable revision history, atomic publish/signup coordination, and the new public-slug renderer belong to phases 06–08. The legacy public signup email action remains part of the preexisting flow and needs the later unified signup/outbox work before it can be considered production-complete.

## Creation interaction

| Before | After | Why |
| --- | --- | --- |
| One legacy form created a waitlist directly with no explicit lifecycle or starter choice. | Three steps: choose a starter, add a name/description/address, review and create a private draft. | The selected layout and consequences stay clear without growing global navigation. |
| Starter choice had no preview or recoverable selection. | Each card updates an in-page preview; Back and session reload retain entered details. | People can compare real starter structure while the flow stays local and reversible. |
| A newly created empty waitlist could be confused with a live page. | The list shows its state; draft Overview explains privacy and links directly to the existing page editor. | A draft never looks like zero-performance analytics or an active launch. |
| Signup form actions were exposed to any known waitlist ID. | Public loaders, ingestion checks and email rendering require `PUBLISHED`. | Unpublished records cannot be discovered or receive ordinary public traffic. |

The starter sections are stored snapshots; mapping those sections into editable builder controls and rendering their saved design is phase 06. Slugs are reserved in this phase but become shareable only when phase 07 ships the public route and publication action. The previous editor has not been certified to render every structured starter yet; the review must keep this dependency explicit.

## Verification

The focused local suite covers schema validation, catalog immutability, existing-row migration preservation, concurrent idempotent creation, retry mismatch, slug collision, forged workspace and revoked membership. Authenticated Chromium checks the selection/details/review flow, reload and Back recovery, private form 404, signup/impression rejection, compact navigation, and 320 px layout. CI repeats lint, unit, migration, build, real PostgreSQL, and browser checks. The database fixture is disposable and loopback-only.
