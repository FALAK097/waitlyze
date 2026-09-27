# Revamp tooling baseline

This is the first implementation slice, stacked on the roadmap. Run `pnpm lint` to parse project JavaScript/JSX/TypeScript and run the initial correctness rules. Generated Prisma output, dependencies, build output, and coverage are excluded.

`@shadcn/lint` is registered in `eslint.config.mjs`. **No shadcn design rules are enabled yet.** Registration validates compatibility; it does not certify token usage or design quality. The next foundation slice defines semantic tokens and component contracts before enabling rules in the new product namespace. Keep legacy exceptions explicit and local.

The Quality workflow installs the lockfile and runs lint without application secrets, production database access, or deployment. Production build and behavioral test jobs must be added with the foundation's disposable fixtures and validated environment requirements; lint is not a substitute for those checks.

The pnpm 11 `allowBuilds` policy preserves the five dependencies already allowed by the former `onlyBuiltDependencies` list. It does not approve additional package names. The duplicated identical `border` entry in the Tailwind config was removed to satisfy `no-dupe-keys`, with no value change.

Local verification and remaining gaps are recorded in the roadmap ledger. Recharts 2 is deprecated according to the package-manager installation output; the analytics slice must validate the Recharts 3 migration before importing current Evil Charts recipes.
