# Waitlyze

Waitlyze is a viral waitlist platform for founders and creators — launch page, referral loop, email automation, and analytics from a single list. Create a beautiful page in minutes, turn signups into referrers, and launch to a primed audience.

## Features

- No-code waitlist designer with templates and brand kit
- Referral system with ranks, points, rewards, and leaderboard
- Email builder with templates, broadcasts, and automations (Resend + BYOK)
- Real-time analytics: signups, sources, geo, devices, referrals
- Public API, API keys, and embeddable widgets for any site
- Custom share slugs and social sharing with OG cards

## Tech Stack

Next.js (App Router) · PostgreSQL + Prisma · Better Auth · Resend · Cloudflare R2 · Tailwind + shadcn/ui

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 24 (see `.nvmrc`, enforced via `engines`)
- [pnpm](https://pnpm.io/)
- PostgreSQL 17 for migration checks (the Compose setup below provides it)

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

Start the provided Postgres service:

```bash
docker compose up -d db
```

Set `DATABASE_URL` to your local database. Use a separate database for tests —
never point local development or migration reset commands at production.

```bash
pnpm prisma migrate deploy
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

Releases are versioned manually. To cut a release:

1. Bump `version` in `package.json`.
2. Add a new `## vX.Y.Z` entry to the top of `CHANGELOG.md`, following the format of the existing entries.
3. Open a pull request. The published history is rendered at `/docs/changelog`.

## Attribution

Area-chart styling adapted from [Evil Charts](https://evilcharts.com) by Gurbinder (MIT licensed).

## License

MIT — see [LICENSE](LICENSE).
