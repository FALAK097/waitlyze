# Waitlist page builder

Phase 06 connects a selected starter to a private, editable waitlist page. It keeps editing in the waitlist's **Page** destination; it adds no global builder, automation or template-library navigation.

| Before | After | Why |
| --- | --- | --- |
| Starter choice was saved as a snapshot, while the existing editor still exposed legacy fields. | Drafts edit the saved starter through section controls and a live, inert preview. Published pages keep the existing editor until the publication slice migrates them. | A created draft should look and behave like the starter the owner chose, without changing published pages as a side effect. |
| Draft page edits had no version history or cross-tab conflict signal. | Autosave uses an optimistic revision, retains up to 48 prior snapshots, and asks the owner to use the saved snapshot or replace it with this tab's snapshot after a conflict. | A late tab cannot silently overwrite newer work; conflict actions state whether they replace the whole page. |
| A reload could discard unsaved builder text. | Per-tab session recovery restores unsaved input, with a visible warning when the recovered revision is behind the saved revision. | Recovery stays local to the browser tab and never publishes the page. |

The editor supports the current structured hero, highlights, questions, signup form labels and note. Owners can add/reorder/remove optional sections, undo and redo, and preview the rendered result. Required hero and signup sections stay in place; sections, fields and item counts have bounded schema limits. The preview renders text and layout from the validated snapshot without injecting HTML, sending network requests or accepting signups. Draft routes remain private and ingestion endpoints continue to reject drafts.

Each save rechecks workspace edit permission and draft status on the server, validates the complete snapshot, and compares the submitted revision before writing. A successful update increments the current revision and records the previous snapshot in the revision table in one transaction. The UI never retries a conflict invisibly: **Use saved version** discards this tab's edits; **Replace saved version with mine** replaces the remote page with this tab's full snapshot. If the save fails, edits remain available in the open tab and the owner can retry.

The product shell stays intentionally small: **Waitlists** and **Settings** are the only global destinations. A waitlist keeps its contextual **Overview · Page · Subscribers · Emails · Settings** route tabs, with unsupported capabilities hidden. These are navigable links because each represents a page; local page controls use actual tabs only when switching peer panels. Global Settings uses an in-page section index, collapsed into a compact section picker on narrow screens.

Validation for this slice: `pnpm lint`, `pnpm build:test`, the complete `pnpm test:database` suite against the disposable loopback PostgreSQL fixture, and the authenticated Chromium flow covering autosave, undo, full-snapshot conflict replacement, private-draft routes and mobile axe/overflow checks. Production migration and deployment remain separate, pending work.
