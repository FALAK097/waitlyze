# Local setup and release configuration

Updated October 11, 2026.

This checkout is linked with Vercel CLI to the existing `falaks-projects/waitlyze` project. `vercel env pull --environment development` returned no application variables; its temporary OIDC credential was discarded instead of copied into application configuration.

The ignored `.env` now uses a fresh local PostgreSQL database (`waitlyze_revamp_local_20261011_v3`), the app origin `http://localhost:3011`, and freshly generated cryptographically random Better Auth, marketing unsubscribe, dispatcher, and 32-byte base64 encryption secrets. Existing OAuth, R2 and Resend credentials were preserved. Vercel project/team identifiers are populated. The env file is mode600, ignored, and is never committed. Other checkouts and existing databases are untouched.

## Local verification

- `pnpm dev --port 3011`
- `pnpm build`
- `pnpm lint`
- `node --test tests/security/*.test.mjs`
- Set `MIGRATION_TEST_ADMIN_URL` to a localhost PostgreSQL administrator connection, then run `node scripts/check-migration.mjs`. It creates and removes its own disposable databases.

## Release configuration

- Keep auth, unsubscribe and encryption secrets stable in each deployed environment; rotating encryption keys without re-encrypting stored credentials makes them unreadable. Local secrets are intentionally separate from production.
- Provision `VERCEL_TOKEN` with the required project-domain permissions to enable domain management. Project/team IDs alone are insufficient.
- Create the real Resend delivery webhook and copy its provider-issued `RESEND_WEBHOOK_SECRET`; a random locally generated string cannot validate provider signatures. Configure `/api/webhooks/resend` and test signed delivery/bounce events.
- Configure an authenticated scheduler calling `/api/internal/email-outbox` with the dispatcher secret; local generation does not configure the external scheduler.
- Register the local and deployed Better Auth Google callback URLs in the OAuth provider.
- Apply the consolidated migration only to a database containing main's migration history. Any environment that previously applied the PR's old migrations requires explicit reconciliation, as described in MIGRATION_CONSOLIDATION.md.
- Verify production email/domain permissions and webhook delivery separately from build, unit and local database tests. No production deployment or provider send was performed by local setup.

## Deployment verification

Earlier read-only checks of the downloaded Preview PostgreSQL URLs returned `3D000` (database does not exist). The subsequent deployment `dpl_9cRG3ZzAUhSuwtkwLepisjVCXtrx` reached Ready, and its build log confirms `prisma migrate deploy` successfully applied `20261011000000_campaign_product_revamp`. This supersedes the earlier deployment blocker. The deployment applied the migration to its Preview database; the local review did not directly mutate remote provider configuration. Temporary downloaded provider environment files were removed. OAuth, mailbox/webhook delivery, scheduler execution and deployed access checks remain separate runtime gates.
