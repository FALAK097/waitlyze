# Waitlyze

[![Waitlyze MCP connector – tool definition quality and endpoint health on Glama](https://glama.ai/mcp/connectors/com.waitlyze/waitlyze/badges/score.svg)](https://glama.ai/mcp/connectors/com.waitlyze/waitlyze) [![Waitlyze on DodoLaunch](https://dodolaunch.com/badge/waitlyze?theme=light)](https://dodolaunch.com/p/waitlyze?ref=badge) [![Waitlyze on Science of Apps](https://launchpad.scienceofapps.com/badge/waitlyze?type=auto&theme=light)](https://launchpad.scienceofapps.com/p/waitlyze?ref=badge) [![Listed on mcpservers.org](https://mcpservers.org/badge.svg)](https://mcpservers.org/servers/falak097/waitlyze)

Waitlyze is a viral waitlist platform for founders and creators - launch page, referral loop, email automation, and analytics from a single list. Create a beautiful page in minutes, turn signups into referrers, and launch to a primed audience.

## Features

- No-code waitlist designer with templates and brand kit
- Referral system with ranks, points, rewards, and leaderboard
- Email builder with templates, broadcasts, and automations (Resend + BYOK)
- Real-time analytics: signups, sources, geo, devices, referrals
- Public API, API keys, and embeddable widgets for any site
- Custom share slugs and social sharing with OG cards

## Tech Stack

Next.js (App Router) · Cloudflare D1 (SQLite) + Prisma · Better Auth · Resend · Cloudflare R2 · Tailwind + shadcn/ui

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 24 (see `.nvmrc`, enforced via `engines`)
- [pnpm](https://pnpm.io/)
- Cloudflare Wrangler CLI (for local and remote D1 migrations)

### Clone and install

```bash
git clone git@github.com:FALAK097/waitlyze.git
cd waitlyze
pnpm install
```

### Environment variables

```bash
cp .env.example .env
```

Fill in the values in `.env`.

### Database

By default, `.env.example` sets `DATABASE_URL="file:./prisma/dev.db"` for local Next.js/Node development. Initialize (or reset with `-- --reset`) the local SQLite database from `migrations/*.sql`:

```bash
pnpm db:bootstrap
```

To apply migrations to the local Wrangler D1 emulator (`pnpm preview:worker`) or remote production D1 (`waitlyze-db`):

```bash
pnpm migrate:local   # local Wrangler D1 state
pnpm migrate:deploy  # remote Cloudflare D1 (production)
```

### Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Lint and format

Linting uses [Oxlint](https://oxc.rs/docs/guide/usage/linter) (`.oxlintrc.json`) and formatting uses [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) (`.oxfmtrc.json`). Both run in CI.

```bash
pnpm lint          # oxlint
pnpm lint:fix      # apply safe fixes
pnpm format        # format all files
pnpm check         # lint + format check, as run in CI
```

## Releasing

To cut a new release:

1. Bump `version` in `package.json`.
2. Add a new `## vX.Y.Z` entry to the top of `CHANGELOG.md`, following the format of the existing entries. Include only user-facing changes (features and fixes), without internal technical, infrastructure, or CI details.
3. Open a pull request. Once merged to `main`, the [Release workflow](.github/workflows/release.yml) automatically:
   - Creates the annotated Git tag `vX.Y.Z` and pushes it to GitHub.
   - Publishes an official GitHub Release with release notes.
   - Broadcasts the changelog release announcement email to all registered Waitlyze users.
4. Alternatively, preview or trigger releases locally:
   ```bash
   pnpm changelog:broadcast --dry-run     # Preview email and recipient list
   pnpm changelog:broadcast --test <mail> # Send single test email
   pnpm release                           # Create tag, GitHub release, and broadcast
   ```

## Attribution

Area-chart styling adapted from [Evil Charts](https://evilcharts.com) by Gurbinder (MIT licensed).

## License

[MIT](LICENSE).
