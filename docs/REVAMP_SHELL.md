# Two-destination product shell

Slice 04 adopts the product foundation in the authenticated application. Main navigation is **Waitlists · Settings**. Existing /dashboard GET links redirect to /wait-lists; public forms, IDs and API payloads remain unchanged.

| Before | After | Why |
| --- | --- | --- |
| Persistent sidebar and separate dashboard selection | Server-rendered compact header, waitlist table and contextual routes | Two primary destinations need little navigation; a waitlist URL owns its context |
| Waitlist cards with a delete control | Real subscriber counts, clear open links, typed deletion under waitlist Settings | Keep collection scanning simple and make destructive actions deliberate |
| Global analytics and audience dropdown | Overview and Subscribers within each waitlist | Preserve capabilities without another global destination |
| No account settings destination | Profile save/sign-out and workspace details with desktop TOC/mobile disclosure | Expose real forms and hide capabilities that have not shipped |
| Captured identity / unscoped private actions | Fresh sessions and scoped database predicates in adopted editor/analytics/template/media paths | A visible tab or stale UI is not authorization |

The shell uses Geist, scoped cool neutrals, ink text and lime actions, consistent with the Dodo-inspired public palette. Lime stays limited to clear actions and active states; atmospheric gradients and dot texture stay on the landing page. Its legacy Tailwind channel adapter is restricted to .product-shell because older recipes wrap tokens in hsl(). Native links navigate immediately, focus indicators remain visible and the selected route uses aria-current. Navigation, account, builder and analytics controls use 44px touch targets. Server-generated DiceBear avatars use opaque IDs. No demo routes, assets or mocked statistics were added.

## Data and permissions

Entry validates the real Better Auth session, ensures the personal workspace and lists current memberships. A workspace picker appears only with multiple memberships. Its cookie is a preference: selection is checked against current memberships, a forged/revoked choice falls back to the personal workspace, and each resource query still authorizes the actor. Selection persists on reload. No invitation/team UI is exposed yet.

Waitlist tabs are Overview, Page, Subscribers, Emails and Settings. Emails is hidden from MEMBER users, and a direct request is a normal 404. Analytics and subscriber reads use nested tenant scopes. Ordinary page edits allow MEMBER, while changing email enablement requires sendEmail in the final write predicate; unchanged email values are omitted to avoid overwriting concurrent privileged changes. The existing inverted email-toggle URL parser was corrected. Existing template reads, updates and creation connections now include the sendEmail predicate. These private checks leave the existing public transactional signup-email path unchanged; that path still needs the separate ingestion/email redesign in the roadmap.

Creation uses a fresh actor, the selected authorized workspace and an explicit field allowlist. A client cannot supply ownership/workspace fields. Newly supplied logo keys must belong to the uploading actor; existing image removal authorizes the waitlist and checks the stored key before using storage. Deletion requires the current waitlist name and deleteCampaign permission in the database delete query. No-logo waitlists can be deleted. Stored-logo cleanup failures are reported to the server log after successful database deletion; durable cleanup retry is not implemented yet.

Profile saves update only the signed-in account's name, enforce 1–80 non-whitespace characters, retain entered text on failure and announce success/error. Email remains managed by the sign-in provider. Team, integrations, developers and billing sections stay absent until their functionality ships. Waitlist Settings currently contains deletion; publishing/domain and referral settings arrive in their later slices.

## Validation and limits

Local fixture compilation and lint pass. All 17 public/foundation Chromium tests and 26 real PostgreSQL/HTTP/authenticated-browser tests pass. The new browser path covers two-item navigation, dashboard redirect, persisted profile saves and failed-input retention, Settings axe, 320/375px reflow and keyboard skip/navigation, contextual tabs, workspace persistence/forged preference, template saves and demotion while mounted, MEMBER page editing and denied email changes, creation mapping and typed deletion/cancel. Desktop Waitlists and mobile Settings screenshots were inspected locally and are not committed. No production data, Google OAuth, email delivery or R2 requests were used in these tests.

Independent review identified missing access-error mapping and an overly broad email-toggle write predicate; both were fixed and the affected behavior tested. Final review/CI evidence is recorded in the PR. React Doctor reported 43/100 over the whole stack: existing Axios/jsPDF supply-chain findings, legacy editor complexity, sequential default-template creation and duplicated legacy breadcrumb structure remain. Its removeImage authentication finding is a false positive: the action calls requireCampaign, which calls fresh getSession and authorizes before any storage/database operation. No diagnostics were suppressed.

The reused builder, subscriber tools and charts retain their existing internals. Full Base UI migration, Evil Charts adoption and polishing those controls remain later slices. These tests do not prove production readiness, Google login, live sending/storage, complete accessibility of the legacy surfaces or a backup restore. Production migration/backfill remains pending. No merge was performed.
