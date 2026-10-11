# Waitlyze

This is a [Next.js](https://nextjs.org/) project designed to help users create stunning waitlists quickly and efficiently. The application features a no-code designer, customizable forms, and real-time analytics to enhance user engagement and conversion rates.

## Getting Started

To set up the project locally, follow these steps:

### Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 24, matching `package.json`)
- [pnpm](https://pnpm.io/)

### Clone the Repository

First, clone the repository to your local machine:

```bash
git clone git@github.com:FALAK097/Waitlyze.git
cd Waitlyze
```

### Install Dependencies

Next, install the project dependencies:

```bash
pnpm install
```

### Set Up Environment Variables

Create a `.env` file in the root of the project and add the following environment variables:

```bash
cp .env.example .env
```

Fill in the values of the environment variables.

### Configure PostgreSQL

Run PostgreSQL locally, using your existing service or the provided Compose DB:

```bash
docker compose up -d db
```

Set `DATABASE_URL` to your local database. Use a separate database for tests. Do
not point local development or migration reset commands at production. Migration
checks are validated with PostgreSQL 17; the existing Compose setup uses 15.

### Run Database Migrations

Run the following command to set up the database schema:

``` bash
pnpm prisma migrate deploy
```

### Start the Development Server

Now, you can start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database migration history

PR #89 preserves the two migrations already on main and consolidates its new
schema into `20261011000000_campaign_product_revamp`. This migration also assigns
existing users and campaigns to personal workspaces, preserves existing published
campaigns, and normalizes historical signup addresses without deleting duplicates.
See [migration validation and local reset guidance](docs/MIGRATION_CONSOLIDATION.md).

## Third-party attribution

## Evil Charts

The focused area-chart composition in `src/components/product/evil-area-chart.jsx` adapts the Recharts area-chart recipe from [Evil Charts](https://github.com/legions-developer/evilcharts), Copyright (c) 2026 Gurbinder. The adaptation keeps the gradient area and accessible Recharts structure, uses Waitlyze design tokens, and omits animation and brush controls.

MIT License

Copyright (c) 2026 Gurbinder

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
