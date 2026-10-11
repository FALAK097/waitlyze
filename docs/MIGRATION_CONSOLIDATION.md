# PR #89 migration consolidation

The PR adds one migration, `20261011000000_campaign_product_revamp`. The two
migrations already on main remain byte-for-byte unchanged. Seventeen migrations
that existed only on this PR branch have been replaced with the combined SQL.
This is safe for databases that have applied only main's migration history.

The combined migration runs in a PostgreSQL transaction. It preserves the
original dependency order and also performs the formerly separate workspace
backfill:

- Every existing user receives a personal workspace and OWNER membership.
- Existing campaigns are linked to their owner's personal workspace.
- Existing campaigns remain PUBLISHED; future campaigns default to DRAFT.
- Historical signups retain their records and verified status; only the earliest
  record for a normalized address reserves its campaign-scoped unique address.
- Existing records receive referral codes and campaign timestamps.

`scripts/backfill-workspaces.mjs` was previously needed as an operator-run data
migration. Its work now happens atomically during `prisma migrate deploy`, so the
script has been removed. The application's guarded `ensurePersonal` path remains
necessary for users created after deployment.

## Validation

Run against a local PostgreSQL server with database-creation privileges:

```bash
node scripts/check-migration.mjs
```

The default admin connection is the local PostgreSQL `postgres` database using
the `postgres` role. If your local service uses a password or a different role,
set `MIGRATION_TEST_ADMIN_URL` explicitly. This script does not read `.env`, does
not consume `DATABASE_URL`, and rejects non-loopback hosts.

The check creates uniquely named databases, removes only those databases in its
cleanup, and covers:

1. A fresh Prisma deploy and repeat deploy.
2. An upgrade from main with representative users, campaigns, and duplicate
   signup addresses.
3. An injected migration failure and transaction rollback, retaining old data.
4. Workspace memberships, linking, publication defaults, normalization,
   verification preservation, and referral code backfill.
5. Prisma's schema diff after both fresh and legacy upgrades.

These checks passed on local PostgreSQL 17.10. The Quality workflow repeats them
in a separate PostgreSQL 17 job. CI results remain separate from local validation.

## Databases that ran earlier PR migrations

A database with the earlier seventeen PR migration names cannot use this
rewritten history as an ordinary upgrade. Preserve any valuable data and choose
an explicit migration-history reconciliation before deploying to that database.
Do not mark the new migration applied merely to bypass a mismatch.

For disposable local or preview databases, use a fresh database and update its
connection string before deploying. No existing local database was dropped in
this cleanup. A fresh local development database named
`waitlyze_revamp_local_20261011_v3` was created and all three migrations were applied, including the shared rate-limit
bucket table. The earlier local test development database was preserved.
Production and external databases were not modified.

## Structure and attribution

Migration directories retain Prisma's timestamp-and-description convention, and
runtime workspace initialization remains in `src/lib/workspaces/service.mjs`.
The local migration checker belongs in `scripts/` and has no runtime imports.
The Evil Charts adaptation is retained; its complete MIT attribution and license
have moved from `THIRD_PARTY_NOTICES.md` into the README.
