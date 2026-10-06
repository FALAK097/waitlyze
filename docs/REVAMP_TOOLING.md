# Revamp tooling baseline

This is the first implementation slice, stacked on the roadmap. Run `pnpm lint` to parse project JavaScript/JSX/TypeScript and run the initial correctness rules. Generated Prisma output, dependencies, build output, and coverage are excluded.

`@shadcn/lint` is registered in `eslint.config.mjs`. **No shadcn design rules are enabled yet.** Registration validates compatibility; it does not certify token usage or design quality. The next foundation slice defines semantic tokens and component contracts before enabling rules in the new product namespace. Keep legacy exceptions explicit and local.

The Quality workflow installs the lockfile, runs lint, generates Prisma, compiles a production build, and runs the public Chromium smoke suite. Failure reports and traces are retained for seven days. It has no deployment step or application secrets.

## Reproduce the baseline

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm build:test
pnpm exec playwright install chromium
pnpm test:browser
```

`build:test` runs Prisma generation and the normal Turbopack production build through `scripts/with-test-env.mjs`. The wrapper overwrites declared app credentials with nonproduction placeholders, including Google credentials, so local `.env` values cannot supply real provider credentials. It does not disable environment validation, migrate a database, or send messages. Font downloads still need network access. The build output contains fixture configuration: **do not deploy this `.next` output**. A deployment must perform its own normal build with its deployment environment.

Playwright starts a fresh server on `127.0.0.1:3100`, refusing to reuse an existing session. Five tests cover public rendering without uncaught client errors, keyboard open/Escape/focus restoration for sign-in, anonymous dashboard redirect, and the two legal pages. They never authenticate or submit mutations. This is a public behavior baseline, not a full accessibility review or an authenticated campaign fixture.

Authenticated service tests need a separate disposable PostgreSQL database and synthetic workspace data in PR 03. The placeholder database URL here must never be treated as a working fixture. OAuth, mail delivery, R2, tenant isolation, screen-reader behavior, rendered contrast, narrow layout, and migration rehearsals remain outside this suite. Existing peer and runtime warnings are recorded separately from check results.

The pnpm 11 `allowBuilds` policy preserves the five dependencies already allowed by the former `onlyBuiltDependencies` list. It does not approve additional package names. The duplicated identical `border` entry in the Tailwind config was removed to satisfy `no-dupe-keys`, with no value change.

Local verification and remaining gaps are recorded in the roadmap ledger. Recharts 2 is deprecated according to the package-manager installation output; the analytics slice must validate the Recharts 3 migration before importing current Evil Charts recipes.

## Local validation on 2026-09-27

Frozen install, lint, production compilation (23 generated pages), and all five Chromium tests pass on macOS with Node 26.7.0 and pnpm 11.5.0. CI uses Node 22; its run is not yet verified. The first sandboxed build could not fetch Inter; the network-enabled build passed. Existing Node deprecation/localStorage and dependency peer warnings remain.

The keyboard regression test caught a shared-modal focus bug and now protects its fix:

| Location | Before | After | Why |
| --- | --- | --- | --- |
| `src/components/auth/auth-modal-provider.jsx`, `src/components/auth/auth-modal.jsx` | Closing shared sign-in lost focus because it has no DialogTrigger | Capture the opening focused element and restore it on close when it still exists | Keyboard users can resume at their original control; Escape and focus return pass in Chromium |

This verifies only the stated public flows. Full interface review, VoiceOver, touch, 320px reflow, zoom, reduced motion, forced colors, and both-theme rendered contrast are not verified by this slice.

React Doctor's changed-file scan returned 49/100 with two Socket vulnerability-score diagnostics for existing `axios@1.9.0` and `jspdf@3.0.1` lockfile resolutions. No React code diagnostics were reported. These dependency advisories need a dedicated upgrade/compatibility check; they were not suppressed or treated as a verified exploit. The scan is not a passing quality gate.

The stack was refreshed onto main after the public-site PR landed. Its auth modal now supplies the shared focus restoration; the smoke test follows the current accessible dialog title. No duplicate auth-modal replacement is retained in tooling.
