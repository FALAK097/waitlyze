# Workspace expansion and subscriber authorization

Revamp slice 03, stacked on the UI foundation. Product navigation remains **Waitlists · Settings**; workspace infrastructure does not add another destination. See [the roadmap](WAITLYZE_REVAMP.md).

## Compatibility and adoption

The additive migration creates Workspace and WorkspaceMember, and adds nullable WaitList.workspaceId. Existing waitlist and signup IDs, ownership columns, API success payloads and public signup routes remain intact. Existing null-workspace records are accessible only to their historical owner. Once a record is linked, current membership is authoritative; historical ownership cannot bypass revocation.

This slice adopts the shared predicate in authenticated subscriber GET and DELETE routes. GET allows OWNER, ADMIN and MEMBER; DELETE allows OWNER and ADMIN. Anonymous callers receive 401, while inaccessible and missing resources both receive 404. The predicate is included in the resource query, including nested reads/deletes.

The service also defines campaign editing, email sending, connection management and ownership permissions for subsequent route adoption. It does not expose team management or automatically convert every legacy server action. Legacy page/media/email actions must adopt fresh session checks and scoped queries before collaborative workspace controls are exposed. Shell/login/create integration is the next slice.

| Permission | Owner | Admin | Member |
| --- | --- | --- | --- |
| View waitlists and subscribers | Yes | Yes | Yes |
| Edit waitlists | Yes | Yes | Yes |
| Delete waitlists or subscribers | Yes | Yes | No |
| Send emails / manage connections | Yes | Yes | No |
| Manage ownership | Yes | No | No |

Personal initialization uses a serializable transaction and bounded conflict retries. New personal workspaces create their OWNER membership atomically. Existing missing or reduced membership fails closed rather than silently restoring privileges. Workspace/user deletion is restricted where ownership or waitlist references remain; an explicit lifecycle/transfer flow must precede any future account deletion feature.

## Backfill operation

No production backfill has been run. Apply the additive migration through the existing deployment workflow before using this script. The script never loads .env and requires an explicitly selected DATABASE_URL. Use an operator-controlled connection, take and verify a backup, then run report mode first:

```sh
node --experimental-strip-types scripts/backfill-workspaces.mjs
node --experimental-strip-types scripts/backfill-workspaces.mjs --apply
node --experimental-strip-types scripts/backfill-workspaces.mjs
```

The operator supplies DATABASE_URL securely in the environment; do not put credentials in commands or logs. Default mode only reports unlinked waitlists, missing personal workspaces and invalid personal ownership. Apply processes users in stable-ID batches of 100, with one transaction per user. It is repeatable, preserves record IDs and exits unsuccessfully if final invariants fail. A revoked personal membership requires operator review; apply never promotes it. Stop legacy writes before the final convergence check when adopting mandatory workspace writes in a later slice.

Keep the nullable column and owner fallback until all private reads/writes adopt the new model and the backfill report is clean. No contract migration is included. Application rollback can retain these additive tables; do not drop workspace data as an automatic rollback.

## Evidence

Local validation: additive migrations applied to a disposable PostgreSQL 17 database; 19 database/HTTP tests pass; 17 browser foundation/public smoke tests pass; fixture production compilation and lint pass. Database tests exercise roles, forged IDs, anonymous and invalid sessions, nested queries, revoked ownership, concurrent initialization and repeated CLI batches over 205 accounts. HTTP tests use real persisted Better Auth sessions against the built Next server; Google OAuth and production cookies are not covered by this fixture.

Quality CI provisions its own PostgreSQL 17 service, applies migrations, builds, runs browser smoke checks and then database tests. Test commands accept only an explicitly named loopback fixture database and reject PostgreSQL query overrides. Fixture credentials are dummy values. No Neon, production data, R2 or email service was used. CI status is recorded in the pull request after publication.
