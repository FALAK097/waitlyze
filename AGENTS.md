<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

- Do not write unit tests: no `*.test.*` files and no test scripts for new code. Verify with
  `oxlint`, `oxfmt --check`, a production `pnpm build`, and live checks against the dev server
  instead.
- An authorized push to `main` automatically runs the production build and deployment. Do not run a
  separate manual deployment after pushing to `main` unless the user explicitly asks for one;
  verify the automatic pipeline and deployed service instead.
- Release notes in `CHANGELOG.md` (both existing and future entries) must only describe user-facing
  changes (features and fixes). Never include internal technical, infrastructure, tooling, or CI
  implementation details.
