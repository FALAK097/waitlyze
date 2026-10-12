# Authenticated product interface review

Reviewed on 2026-10-12. Scope: the waitlist list and creation flow, Overview, both page editors, Subscribers and referral review, Analytics, all three email tools, waitlist settings, account settings, and shared navigation/error states. Design follows the confirmed `.impeccable.md` context and the impeccable, emil-design-eng, and better-ui skills: white surfaces, lime actions, restrained typography, common alignment, and progressive disclosure.

## Changes and resolved findings

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| P2 | Creation flow mobile footer | Final action could extend beyond a 320px screen | Back keeps its intrinsic width; the primary action fills the remaining space; hint uses its own row | Keeps creation usable on small phones |
| P2 | Broadcast, referral, automation and other client dates | Browser and server default locale formats differed; a direct broadcast reload produced a hydration error | Shared explicit en-GB/UTC formatting, with UTC identified for timestamps | Initial HTML and client rendering agree |
| P2 | Workspace settings | Two sibling components used the same workspace key | Component-specific key prefixes | Prevents ambiguous reconciliation when switching panels |
| P2 | Email error boundary | Try again cleared the error without refetching server data | Uses Next.js 16 `retry` | Allows recovery from a transient server failure |
| P2 | Broadcast drafts | Preview and send could operate against a different saved draft than the visible edits | Unsaved changes disable preview/send, audience preview invalidates after edits, selection prompts before discarding | Keeps review tied to saved content |
| P2 | Referral and settings actions | Failure feedback and pending handling were uneven | Inline validation, announced errors, toasts and disabled concurrent actions; management authorization retained | Makes outcomes clear and prevents accidental repeated decisions |
| P3 | Shared shell and waitlist tabs | Containers and framed navigation competed with page content | One 72rem container with shared responsive gutters, underline tabs, whitespace between sections, horizontal overflow hint on mobile | Consistent alignment and lower visual noise |
| P3 | Waitlist list | Redundant workspace copy and decorative framing | Compact search/filter header, flat table, semantic status dots, mobile updated dates | Faster scanning |
| P3 | Overview and launch checklist | Nested panels and all checklist details were always prominent | Borderless facts and a checklist disclosure; completed checklists start collapsed | Puts the next action first |
| P3 | Snapshot editor | Long controls and viewport-dependent preview typography | Controls/preview workspace, section disclosures, mobile Content/Preview choice, container-sized preview text | More useful editing space without oversized mobile previews |
| P3 | Legacy editor | Preview-first layout, nested scrolling, icon-only save, artificial signup success | Controls first, natural scrolling, visible Save changes, truthful preview feedback, clearer switches | Existing forms receive the same usable editing experience |
| P3 | Subscribers | Nested framing and a wide referral decision table | Flat audience table, subscriber detail drawer, responsive referral decision rows | Preserves details while fitting small screens |
| P3 | Analytics | Heavy metric framing; Table mode did not work with zero activity | Borderless metrics, chart/table modes with zero rows available, matching skeleton | Empty and populated states use the same interaction model |
| P3 | Email tools | Every field and recipe competed for attention | Focused template editor with live preview, optional content disclosure, one automation recipe at a time, flat broadcast workspace | Supports writing and reviewing one message at a time |
| P3 | Waitlist settings | Domain, webhooks and deletion were always expanded | Separate disclosures, masked secret controls, explicit deletion/rotation confirmation | Keeps routine settings concise |
| P3 | Email inputs and loading labels | Some native inputs lacked visible affordances; two actions could show different pending labels simultaneously | Shared product inputs and action-specific broadcast loading labels; 16px mobile entry fields | Clear interaction and pending feedback |

## Local verification

- Authenticated browser inspection at 1242px desktop and 320px/390px phone widths; additional 768px tablet checks on the broadcast workspace. Measured document width matched the viewport in tested layouts.
- Waitlist search: unmatched results, empty-state recovery and the original waitlist list. Status/sort links and server query contracts retained.
- Creation: starter selection, required-field validation, details, review, private draft creation and editor navigation. The 320px final action stays within the viewport.
- Snapshot editor: actual autosave to version 2, undo and autosave to version 3, responsive preview, publication review and Escape cancellation with focus returning to Publish. No test page was published.
- Legacy editor: Input tab, mobile layout, save completion and preview submission reporting that no subscriber was created.
- Subscribers: empty and populated rows, status filters, detail drawer, Escape focus return, referral decision note validation and approval feedback using fictional local data.
- Analytics: zero-data chart state, seven-day Table mode, populated chart and actual 3 visitors / 3 signups / 2 verified aggregate rendering from fictional local data.
- Email: Signup/Offboarding switching, Markdown preview and undo, template save, private broadcast draft creation/save, unsaved preview guard, zero eligible-recipient preview, and recipe selection. No provider email was sent and no automation was enabled.
- Account settings: Profile, Workspace, Members and Integrations panels; Resend drawer opening/closing with focus return. Fixed duplicate component keys and retested navigation.
- Direct broadcast reload after date normalization: no new hydration error. Subsequent settings navigation also produced no new duplicate-key error.
- Authenticated not-found page: missing waitlist displays the designed 404 and returns to Waitlists.
- Temporary local waitlists and their fictional subscriber/referral/email data were removed. The original waitlist remains unchanged.
- Full ESLint and production build pass. The build retains two non-blocking Fumadocs CSS optimizer warnings. All 22 targeted security tests pass: authorization/key revocation, safe raster uploads, fail-closed rate limiting, suppression matching, invitation token rotation and webhook validation/encryption.
- Independent source review approved the changes after the email retry fix. Existing save/conflict/publication guards, marketing-consent sending requirements and OWNER/ADMIN management checks remain in place.

## Not verified

- Physical touch devices, OS reduced-motion settings, 200% browser zoom and animation playback at 10% speed. CSS reduced-motion rules were inspected; viewport checks do not establish physical-device acceptance.
- Real email delivery, enabled automation execution, external OAuth/provider configuration, live custom-domain provisioning, webhook delivery and new API-key issuance/revocation through the browser. These would create external or security-sensitive effects.
- Forced runtime failure recovery for every route. Loading states were observed during normal navigation; error handling was checked by source and build.
- External React Doctor scan: automatic approval review rejected the external scanner because it could transmit private repository contents. Local checks and independent review were used instead.
- Deployed production behavior and customer acceptance. Local browser/build evidence does not establish these release gates; latest CI is reported separately after push.

Verdict: approve the inspected interface changes for review in PR #89. The external and production checks above remain distinct release gates.
