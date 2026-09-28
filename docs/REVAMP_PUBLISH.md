# Waitlyze publishing slice

## Decision

The product has two global destinations: Waitlists and Settings. Work stays inside each waitlist, with a short contextual strip for Overview, Page, Subscribers, Emails (once available), and Waitlist Settings. Workspace Settings uses a section index on desktop and a collapsible index on narrow screens. The live GetWaitlist dashboard confirms the value of this hierarchy: the waitlist owns its operational sections, while tabs are reserved for peer views within a section. Waitlyze starts with fewer local sections and adds them only when working capabilities exist.

## Publication contract

- Editing writes a validated, versioned page draft. It never changes the currently published snapshot.
- Publish is owner/admin-only, requires the expected saved page revision, validates the snapshot, stores an immutable publication revision, and atomically updates the public pointer and status.
- `/w/[slug]` only renders a valid immutable revision when the waitlist is published. Drafts return not found and do not disclose their content or metadata.
- Pausing keeps the public URL but renders a generic paused message and the existing signup API rejects new signups because campaign status is no longer `PUBLISHED`.
- Rollback repoints to an earlier immutable publication revision and restores that content into the editable draft with a new draft revision. It preserves a paused state; resuming remains a separate explicit publish action. Future publishes use a new monotonically increasing revision.
- `/forms/[id]` remains the legacy page for old records; structured campaigns redirect there to their canonical slug after publication or pause.

## UI review

| Before | After | Why |
| --- | --- | --- |
| A structured campaign stayed in private-draft mode and had no public renderer. | The same builder follows the waitlist through draft, published, and paused states. | Keep editing and release in one contextual Page destination. |
| Published edits would have had to replace live content directly. | Autosaved edits remain a draft until an explicit publish action creates a frozen revision. | Prevent accidental changes to a live launch page. |
| Legacy ID page was the only hosted-rendering path. | New campaigns use `/w/[slug]`; legacy IDs remain compatible. | Give campaigns shareable stable addresses without breaking older pages. |
| No release recovery action existed. | Owners/admins can pause and restore an earlier immutable revision. | Make release changes recoverable and keep pause reversible. |

## Validation

The Prisma migration is additive. The lifecycle integration test uses the local disposable PostgreSQL fixture and checks permission denial, immutable content after edits, stale revision rejection, pause, rollback, and monotonic republish. The production deployment and external preview remain separate checks.
