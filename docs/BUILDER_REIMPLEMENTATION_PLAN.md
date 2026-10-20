# Builder reimplementation plan

> Status: proposed design brief and delivery plan. Confirm the decisions in
> **Decisions to approve** before implementation starts.
>
> Baseline: `origin/main` at `63cd842` on 2026-10-20, reviewed in the isolated
> `codex/builder-v2` worktree.

## Outcome

Rebuild Builder as one coherent publishing studio for three connected visitor
experiences:

1. a hosted waitlist page, from a minimal email form to a complete launch page;
2. a reusable form that can be embedded on a founder's own website; and
3. a post-signup status page that turns a signup into a referral loop.

All three surfaces share one brand kit, one signup configuration, one draft and
publication lifecycle, and one analytics identity. API access and custom domains
are delivery methods for the same waitlist, not separate products.

## Why the current Builder needs structural work

Current `main` has useful foundations, but two incompatible editing paths:

- Snapshot-backed waitlists use `SnapshotPageBuilder`, revision-safe autosave,
  undo/redo, a private draft, immutable published revisions, desktop/mobile
  preview, conflict recovery, and five section types.
- Snapshot-less waitlists use the legacy `WaitlistGenerator`, which exposes more
  visual controls but bypasses the snapshot publication model.
- The snapshot schema hard-codes a white surface, ink text, lime action, Geist,
  email-only forms, referrals off, verification off, one required form, and only
  Hero, Highlights, FAQ, Form, and Note blocks.
- The Prisma model still stores many legacy appearance fields directly on
  `WaitList`, while the new editor stores page content in JSON. There is no
  authoritative shared Brand Kit or Form definition.
- The post-signup result exists inside the signup component, but it is not a
  first-class editable surface.
- Sharing is a collapsed panel at the bottom of Builder; custom domains are in
  Settings; API keys are global. The user has to discover the delivery model by
  navigating the product rather than seeing it as one flow.
- `/waitlists/new` currently creates an `Untitled waitlist` on page visit. This
  creates ghost drafts and does not ask for the waitlist name as requested.

The reimplementation should remove the dual path. A minimal email field plus
button must be a valid composition in the same system as a full page, not a
legacy mode.

## Competitor findings: what to learn, not copy

LaunchList's public material currently describes a mature model:

- Nine launch-specific page templates and 19 reusable blocks, including product
  content, signup counts, leaderboards, rewards, updates, media, pricing, and
  countdowns ([template catalogue](https://getlaunchlist.com/templates/waitlist-pages)).
- Eight styles, global accent/fonts/corners, per-block layout variants, drag,
  duplicate, remove, desktop/phone preview, undo/redo, and publish-separated
  drafts ([template catalogue](https://getlaunchlist.com/templates/waitlist-pages)).
- A form shared by hosted pages and embeds, plus editable status/referral pages
  and custom domains according to its newer product guide
  ([launch guide](https://getlaunchlist.com/blog/how-to-create-a-waitlist-landing-page)).
- Its older help page documents a smaller five-section builder and says custom
  domains are unavailable, which conflicts with newer product pages. Treat the
  live authenticated product as the source of truth before matching any exact
  capability ([older builder guide](https://getlaunchlist.com/help/docs/getting-started/waitlist-page-builder)).

Waitlyze should match the coherent mental model, not LaunchList's screen design.
Our differentiation is a calmer editor, a better referral/status-page workflow,
BYOK email, and transparent draft/publish safety.

## Product model

### One waitlist, three editable surfaces

| Surface     | Purpose                                                           | Hosted              | Embed                                                                 | API                            |
| ----------- | ----------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------- | ------------------------------ |
| Launch page | Explain the product and collect interest                          | Full page           | Not embedded whole in v1                                              | Read configuration only        |
| Signup form | Collect and validate subscriber data                              | Used by page blocks | Inline embed and optional popup                                       | Equivalent submission contract |
| Status page | Confirm signup, show position, referral link, rewards and sharing | Hosted after signup | Open hosted status URL after embed signup, with inline-success option | Status lookup response         |

### Shared configuration

- **Brand Kit:** logo, favicon, heading font, body font, text, muted text,
  page background, surface color, accent, button background, button text,
  input background/border/text, and corner scale.
- **Signup Form:** ordered fields, labels, placeholder, required state,
  consent, button copy, validation, verification, referral attribution, and
  success behavior.
- **Publication:** draft revision, published revision, publication status,
  public address, SEO/share metadata, and change summary.
- **Growth:** referral sharing, position visibility, signup count,
  milestones/rewards, leaderboard visibility, and share channels.

Changing shared configuration updates all three previews. It reaches visitors
only after Publish, so embeds never change unexpectedly while a founder is
experimenting.

## Design brief

### 1. Feature summary

Builder is a calm, focused publishing studio for indie founders and startup
marketing teams. It must let a first-time founder publish a credible waitlist in
minutes while allowing a power user to construct a full branded launch page,
embed the same form elsewhere, and tune the referral status experience.

### 2. Primary user action

Move from a named private draft to a tested, published waitlist with one obvious
next action at every step.

### 3. Design direction

Use Waitlyze's existing precise, optimistic, approachable visual language:
white surfaces, near-black ink, quiet neutral controls, fine dividers, compact
typography, and lime reserved for primary actions and active state. The studio
should feel more like a composed document tool than a dashboard full of cards.
It remains light-only and WCAG AA.

### 4. Layout strategy

Desktop uses a full-width studio inside the existing product shell:

- a compact command bar for surface selection, save state, undo/redo, preview,
  and Publish;
- a left rail for layers/blocks/templates;
- a center canvas showing the actual visitor surface;
- a right inspector for the selected block or global design settings.

The left and right rails use dividers rather than nested cards. The canvas gets
the visual weight. At tablet widths, the rails become drawers. On mobile,
Builder switches between **Edit** and **Preview** and opens properties in a
bottom sheet; no critical control is removed.

### 5. Key states

- Creating: name, generated address, availability, submit progress and errors.
- First use: choose Simple form, a recommended template, Blank page, or migrate
  existing content.
- Draft saved, saving, offline/retrying, validation error, and revision conflict.
- Empty page, selected block, no selection, add-block, reorder, duplicate,
  hidden block, and maximum-block limit.
- Template preview, apply confirmation, content-preserving style switch, and
  full-template replacement with recoverable previous draft.
- Desktop and phone preview, overflow/content stress, upload progress/failure,
  missing image, and invalid color contrast.
- Private draft, publish review, publishing, published, updates pending, paused,
  signups closed while page remains live, and rollback.
- Hosted URL, embedded form, API, active/pending custom domain, and provider
  failure.
- Immediate success, email verification pending, verified status, referrals
  disabled, position hidden, and returning subscriber.
- Legacy waitlist migration preview, successful conversion, and safe fallback.

### 6. Interaction model

- Click a block on the canvas or in Layers to select it; edit its content and
  layout in the inspector.
- Add Block opens a searchable, categorized library. New blocks are inserted
  after the selected block and focused.
- Drag handles reorder on pointer devices; keyboard Move up/down remains fully
  supported. Duplicate and hide are reversible; delete offers immediate Undo.
- Global Design exposes style presets first, then fonts, colors, and corners.
  Advanced tokens are progressively disclosed.
- Templates show responsive previews. Applying a style never changes content.
  Replacing a page template shows exactly what will be replaced and keeps the
  prior draft restorable.
- Autosave is default. Publish is deliberate and shows validation, the changed
  surfaces, the destination URL, and any launch blockers.
- The surface switcher moves among **Page**, **Form**, and **Status** without
  leaving Builder. **Publish & share** opens a focused panel containing Hosted,
  Embed, API, and Domain options.

### 7. Content requirements

- Creation asks only for **Waitlist name**. It suggests the address live and
  allows editing it before creation.
- First-use copy explains the outcome, not editor mechanics: “Start with only a
  signup form, or choose a complete launch page.”
- Save copy distinguishes “Saved privately” from “Published”.
- Publish review names concrete blockers and warnings; warnings do not pretend
  to be errors.
- Destructive or replacing actions state what changes and how to recover.
- Embed instructions include inline, popup, React, and plain HTML examples only
  when their runtime support exists.
- API and custom-domain affordances report current availability; they must not
  promise provider setup that is absent.

### 8. Implementation references

Use the Impeccable references for interaction design, spatial design,
responsive adaptation, typography, motion/reduced-motion, color contrast, and
UX writing. Use existing Waitlyze primitives; do not introduce another control
layer.

### 9. Open questions

The main decisions needing owner confirmation are collected below. Exact paid
plan gates can remain configuration-driven while the product has no users.

## Information architecture

### Creation

Replace navigation-only `/waitlists/new` behavior with a proper create dialog on
the Waitlists page:

1. Enter waitlist name.
2. See/edit the generated unique slug with debounced availability feedback.
3. Create a private draft through an idempotent Server Action.
4. Enter Builder's start screen and choose Simple form, a template, or Blank.

The dialog should not ask for colors, referrals, email, or template. Those
choices belong in Builder where they can be previewed. Direct visits to
`/waitlists/new` should render the same focused create experience and must not
create a database record on GET.

### Builder navigation

```text
Builder
├── Page
│   ├── Layers
│   ├── Add block
│   ├── Templates
│   └── Design
├── Form
│   ├── Fields
│   ├── Behavior
│   └── Design overrides
├── Status
│   ├── Confirmation
│   ├── Position and referral link
│   ├── Rewards and sharing
│   └── Verification states
└── Publish & share
    ├── Hosted page
    ├── Website embed
    ├── API
    └── Custom domain
```

Custom-domain DNS management can remain in Settings, but Builder should show its
state and deep-link to the exact section. API-key creation should remain in its
secured global area; Builder shows the endpoint and links to a scoped key.

## Public address decision

Use `https://waitlyze.falakgala.dev/w/{slug}` for v1 and keep `publicSlug`
globally unique.

Do **not** use `https://waitlyze.falakgala.dev/{slug}`. It creates permanent
collisions with product routes such as `docs`, `settings`, `api`, `waitlists`,
and every future marketing route. A reserved-word list reduces but never removes
that architectural tax.

Do **not** make `{slug}.waitlyze.falakgala.dev` the canonical URL yet. It is
possible with wildcard DNS/TLS and host rewrites, but the current Proxy treats
all subdomains of `APP_ROOT_DOMAIN` as app hosts and does not resolve them to a
waitlist. It also increases cookie, preview, local-development, custom-domain,
and incident-debugging complexity. A future short public domain such as
`{slug}.waitlyze.page` would justify that work and be easier to share.

Preserve the route abstraction so a future subdomain can redirect to the same
canonical page without changing referral or analytics identity.

Slug rules:

- normalized lowercase ASCII letters, numbers and single hyphens;
- 3–48 characters for readable URLs;
- generated from the name with a deterministic numeric suffix on collision;
- case-insensitive uniqueness at the database boundary;
- explicit reserved-slug list even under `/w/`;
- published slug changes require a warning and a redirect record from the old
  slug so existing referral links do not break;
- changing the display name never changes the URL automatically.

## Schema direction

Move from template schema v1 to a discriminated, versioned experience document.
Keep immutable publication revisions and optimistic concurrency.

```js
{
  schemaVersion: 2,
  template: { id, version },
  brand: {
    logo, favicon,
    headingFont, bodyFont,
    colors: { page, surface, text, muted, accent, button, buttonText, input, inputBorder, inputText },
    radius: "sharp" | "soft" | "round" | "pill"
  },
  page: {
    seo: { title, description, image, indexable },
    blocks: [{ id, type, visible, variant, props }]
  },
  form: {
    fields: [{ id, type, label, placeholder, required, options }],
    buttonText, consent, verification, duplicateBehavior
  },
  statusPage: {
    states: { joined, verificationPending, verified, returning },
    showPosition, showReferralLink, showReferralCount,
    shareChannels, rewards
  }
}
```

Rules:

- Stable block IDs are required for selection, drag/drop, analytics and future
  collaborative editing.
- Validate every snapshot with Zod on client boundaries and again server-side.
- Store font IDs from an allow-list, never arbitrary CSS or remote font URLs.
- Resolve styles into CSS custom properties in one renderer shared by preview,
  hosted pages, custom domains, and embeds.
- Keep embed-specific layout as a small override, not a forked design system.
- Do not delete legacy columns in the first release. Migrate them to v2 snapshots,
  run both readers during a compatibility window, then remove dead fields in a
  later migration.

## Initial block and template scope

### Phase-one blocks

- Navigation
- Hero
- Signup form
- Benefits
- Steps
- Logos
- Numbers
- Testimonials
- FAQ
- Media (image first; video as an additive follow-up)
- Signup count
- Referral rewards
- Call to action
- Footer

Pricing, countdown, leaderboard, updates, gallery and long-form story are useful,
but should follow after the renderer, migration, and referral status page are
stable. The schema must allow adding them without another migration.

### Initial templates

- Simple form
- SaaS beta
- AI product
- Mobile app
- Creator/newsletter
- Community
- Event/course
- Ecommerce/pre-order
- Developer tool
- Blank page

Templates provide content and block structure. Styles provide only visual tokens
and block variants. Applying a style must never replace copy.

## Delivery phases

### Phase 0 — Contract and migration tests

- [ ] Freeze the v2 experience schema, block registry, brand tokens and font
      allow-list.
- [ ] Add fixtures for legacy flat-field waitlists and schema-v1 snapshots.
- [ ] Add migration tests proving public copy, slug, form behavior, referrals,
      SEO and published output are preserved.
- [ ] Add serialization tests for every block and status-page state.
- [ ] Define the compatibility and rollback window.

Exit gate: a legacy waitlist can be converted to v2 and rendered equivalently
without changing its live published page.

### Phase 1 — Creation and unified foundation

- [ ] Add the name/slug creation dialog and remove write-on-GET behavior.
- [ ] Add slug normalization, availability, reserved values and idempotent
      creation.
- [ ] Build the v2 snapshot service with optimistic revision checks, local
      recovery and immutable publication revisions.
- [ ] Convert new waitlists to v2 only; retain legacy reading.
- [ ] Add the Builder shell, surface switcher, command bar, responsive rails and
      loading/error states using current app primitives.

Exit gate: a named private draft can be created, autosaved, recovered after a
reload, and opened at desktop, tablet and mobile widths.

### Phase 2 — Brand Kit, templates and core page editor

- [ ] Add the ten initial templates and a content-preserving style system.
- [ ] Add heading/body font selection, text/background/accent/button/input
      colors, and corner scale.
- [ ] Add accessible contrast feedback and safe fallback colors.
- [ ] Implement the phase-one block registry, add/duplicate/hide/remove/reorder,
      per-block variants and keyboard operations.
- [ ] Render preview and public page from the same components.
- [ ] Add logo, image, favicon and OG image upload states.

Exit gate: Simple form and every template can be customized, keyboard-edited,
previewed at phone/desktop widths and published without renderer drift.

### Phase 3 — Form and embed

- [ ] Make the signup form a shared definition used by hosted pages and embeds.
- [ ] Support email first, then name and a bounded set of custom fields.
- [ ] Add inline and stacked layouts, labels/placeholders, button copy, consent,
      validation and duplicate behavior.
- [ ] Replace fixed-height iframe assumptions with a secured `postMessage`
      resize protocol and strict origin checks.
- [ ] Preserve referral and UTM parameters in embeds.
- [ ] Provide verified plain HTML and React instructions plus a sandboxed test
      preview.
- [ ] Converge hosted, embedded and API signup ingestion on one service.

Exit gate: identical signup rules and attribution pass through hosted, embedded
and API paths; the embed is responsive without manual height tuning.

### Phase 4 — Status page and referral cockpit

- [ ] Add joined, verification-pending, verified and returning-subscriber
      previews.
- [ ] Make heading/body, position, referral link, referral count, share copy and
      share channels editable.
- [ ] Add status-page style variants derived from the same Brand Kit.
- [ ] Handle referrals disabled, position hidden and verification disabled
      without dead or contradictory UI.
- [ ] Ensure hosted, embedded and custom-domain signup paths reach the correct
      status experience.

Exit gate: every signup outcome has editable, locally verified content and a
functional referral path when enabled.

### Phase 5 — Publish, addresses and delivery hub

- [ ] Replace the bottom disclosure with Publish & share.
- [ ] Add validation summary, change summary, signed/private preview link,
      publish/pause/close-signups distinctions and rollback.
- [ ] Keep `/w/{slug}` canonical and add old-slug redirects.
- [ ] Surface custom-domain readiness and provider errors with a deep link to
      Settings.
- [ ] Surface API endpoint/readiness with a deep link to scoped API keys/docs.
- [ ] Ensure custom domains serve page, status, verification and unsubscribe
      routes consistently before calling them complete.

Exit gate: a founder can understand every publishing option and verify the live
result without hunting across tabs.

### Phase 6 — Legacy convergence and cleanup

- [ ] Offer a migration preview for every snapshot-less waitlist.
- [ ] Convert legacy drafts without mutating the active published revision.
- [ ] Remove the runtime branch between `WaitlistGenerator` and
      `SnapshotPageBuilder` only after migration proof.
- [ ] Deprecate direct appearance columns, then remove them in a separate schema
      migration after the compatibility window.
- [ ] Update `Todo.md` to reflect actual shipped evidence.

Exit gate: one Builder, one renderer contract and no hidden legacy creation path.

## Edge-case checklist

### Creation and identity

- [ ] Double-click/retry creates only one waitlist.
- [ ] Name collisions are allowed; slug collisions are not.
- [ ] Unicode names generate safe slugs without losing the display name.
- [ ] Reserved, empty, too-long and concurrently claimed slugs report inline.
- [ ] Abandoning the dialog creates nothing.
- [ ] Renaming does not silently change the URL.

### Editing and publication

- [ ] Multi-tab conflicts preserve both copies and identify the published one.
- [ ] Offline edits recover after reload; publish cannot race an unsaved draft.
- [ ] Template/style changes are undoable.
- [ ] Empty or hidden required form blocks block publication with a direct fix.
- [ ] Long words, large text, zero/one/many items and missing media render safely.
- [ ] Published pages remain immutable while drafts change.
- [ ] Rollback creates a new publication event rather than rewriting history.

### Accessibility and responsive behavior

- [ ] Complete keyboard block manipulation and visible focus.
- [ ] Screen-reader announcements for save, move, add, remove and publish.
- [ ] WCAG AA contrast enforcement or explicit warning with safe defaults.
- [ ] 44px mobile targets, correct email keyboard, zoom to 200%, reduced motion,
      high contrast, and no critical hover-only action.
- [ ] Mobile editing adapts controls instead of hiding them.

### Public surfaces and delivery

- [ ] Paused page, closed signups and missing page are distinct states.
- [ ] Referral/UTM parameters survive hosted, redirects, embeds and domains.
- [ ] Embed loader is idempotent, supports multiple forms and cannot be broken by
      host CSS.
- [ ] Custom-domain DNS/certificate/provider failures are recoverable.
- [ ] SEO canonical, robots and OG data match publication settings.
- [ ] Old slugs and referral links continue to resolve.
- [ ] Status, verification and unsubscribe routes work on every supported host.

### Security and data integrity

- [ ] Every Server Action and route re-authorizes workspace capability.
- [ ] Snapshot size, block count, text length, URLs and uploads are bounded.
- [ ] No arbitrary HTML/CSS/JS or arbitrary font URL enters public rendering.
- [ ] API, hosted and embed submission paths share validation, rate limits,
      idempotency and attribution.
- [ ] Public preview tokens are scoped, expiring and non-enumerable.

## Verification gates

Report these separately; one cannot stand in for another:

- **Code:** schema and migration tests, unit tests, lint, build, and React Doctor.
- **Local data:** real PostgreSQL migration and legacy-to-v2 conversion fixtures.
- **Browser:** authenticated creation/edit/publish, public hosted page, embed,
  status/referral flow, keyboard use, desktop/tablet/mobile and reduced motion.
- **Provider:** wildcard/custom-domain DNS, TLS and Vercel mapping if enabled.
- **CI/deployment:** GitHub checks and Vercel deployment evidence.
- **Acceptance:** founder can create and publish Simple form and Full page flows
  without developer help.

## Decisions to approve

1. Keep `/w/{slug}` canonical for now; do not use a root-level slug or nested
   subdomain until Waitlyze owns a purpose-built short public domain.
2. Use **Page / Form / Status / Publish & share** as the Builder's top-level
   workflow.
3. Ask only for name and editable slug at creation; choose Simple/template/Blank
   after the draft opens.
4. Publish Page, Form and Status together as one immutable experience revision.
5. Ship the 14 phase-one blocks first and defer the remaining advanced blocks
   until the shared renderer and migration are proven.
6. Keep custom-domain management in Settings but expose its state and entry point
   in Publish & share.
