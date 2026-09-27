# Revamp design foundation

This is PR slice 02, stacked on tooling #37 and roadmap #36. It supplies reusable foundations, not campaign tenancy or a working campaign dashboard.

## Scope and adoption

The latest owner direction uses [Dodo Payments](https://dodopayments.com/) as a visual reference. Its public page and extracted styles informed cool neutral surfaces, ink text and a restrained lime primary action. Geist, Waitlyze content and platform behavior remain our own. A contrasting action border keeps the light-theme control boundary visible. Marketing can use quiet atmospheric backgrounds; operational views keep opaque neutral surfaces. Adoption across existing marketing and dashboard routes remains pending.

New components live under `src/components/product`. Scoped `.product-ui` tokens protect existing product/public screens from a blanket palette or Radix rewrite. Add the scope and Geist font variables at the future campaign shell boundary. Components consume semantic tokens; primitives stay in the token stylesheet. Light and dark use the existing next-themes class mechanism. Theme changes now suppress transitions. Appearance controls expose the selected preference with aria-pressed and a static background cue.

Geist Sans and Geist Mono are loaded through Next font tooling in the test fixture. UI sizes use rem roles; fields stay at 16px, controls have 40px desktop and 44px narrow-view targets, headings balance, descriptions wrap, and numbers use tabular figures. No chart theme is invented before the analytics slice.

The button and dialog composition adapt official [shadcn Base Nova button](https://ui.shadcn.com/r/styles/base-nova/button.json) and [dialog](https://ui.shadcn.com/r/styles/base-nova/dialog.json) source. Base UI supplies focus management and dialog state. Buttons use variants; links remain native anchors styled with `buttonVariants`, preserving Cmd/Ctrl-click and link semantics. Input is native and receives its label from the form.

Dialogs currently open immediately for all input types. High-frequency keyboard actions receive no entrance or press choreography. Pointer press scale is 0.96, with `static` to opt out; reduced motion removes transitions. Hover is gated to fine pointers. Focus-visible uses a 2px outline, 3px offset, and Highlight in forced colors. Modal centering intentionally uses physical coordinates; surrounding layout uses logical properties to mirror correctly in RTL.

DiceBear generation stays in a server component using core 10's `Style`/`Avatar` API and only the Shapes definition. Shapes is CC0 1.0 according to its bundled metadata; core is MIT. An opaque ID seeds a deterministic data URI, with no public avatar API and no client-side generator bundle. Uploaded source takes precedence. Adjacent named avatars use empty alt; identity-only callers supply meaningful alt text. SVG is used as an image, never injected with raw HTML.

## Preview and states

There is no design-system page in product source. The owner requested removal of the component demo; its synthetic hero/cards and runtime preview flag have been removed. A small fixture under `tests/fixtures/foundation` exercises only theme controls, dialog, input, avatar and completion status. `pnpm build:test` temporarily materializes its route for an isolated build, then removes the source route in a finally block, including when compilation fails. Normal application builds do not contain `/design-system`, regardless of environment flags. Normal build and Vercel build commands refuse any leftover fixture source after a forced kill or host crash. A separate normal build contained no design-system manifest entry and returned HTTP 404 for the URL even with the fixture flag set. Test artifacts must never be deployed.

Run `pnpm build:test`, then `pnpm test:browser`. The fixture makes no mutation, sending, OAuth or database operation. An empty name validates on submit, focuses the field, exposes an inline described error, and keeps submit available. A stable polite region carries completion. Real pending, save, empty and failure states belong to the features that implement them.

## Active design contracts

ESLint applies `shadcn/no-restyle`, `shadcn/no-arbitrary-values`, and `shadcn/no-inline-styles` to the new namespace and preview. Component consumers can control placement but cannot change primitive sizes, colors or padding through class overrides. CSS definitions still need token review; these JSX rules do not lint CSS values. One-off ESLint probes confirmed all three rules reject their violating examples. Legacy files retain their existing correctness rules. Add future campaign routes to this scoped contract as they ship.

## Local evidence

Frozen install, lint, isolated production build (23 generated static pages plus a test-only fixture), and 17 Chromium tests pass. The suite covers the five public regressions plus foundation checks:

- Light/dark axe scans on the preview and open dialog: no violations.
- Base UI trigger composition, focus trap, first-error focus, accessible error description, Escape, successful preview, focus return, and stable completion status.
- 320, 375, 768, 1280 and 1440px reflow, including usable modal actions.
- Visible keyboard focus, reduced-motion transition removal, local decorative avatar.
- RTL with 200% root text enlargement at 640px. This is a text-enlargement/reflow check, not a complete browser-zoom audit.
- Earlier light foundation and dark dialog screenshots visually inspected for grouping, alignment, wrapping, labels and elevation. The reduced control fixture is verified by the same automated suite.

Measured pairs below come from Chromium resolving the actual scoped CSS token colors. Text pairs are tested against page, surface and inset backgrounds; meaningful control and focus pairs use a 3:1 floor. Values rounded to three decimals for display; assertions use unrounded values.

| Pair | Light | Dark | Minimum |
| --- | ---: | ---: | ---: |
| Primary text / surface | 18.740 | 15.452 | 4.5 |
| Secondary text / surface | 7.889 | 10.532 | 4.5 |
| Action label / solid | 15.703 | 15.703 | 4.5 |
| Action label / hover | 11.585 | 15.115 | 4.5 |
| Success text / surface | 6.963 | 10.049 | 4.5 |
| Danger text / surface | 8.227 | 8.228 | 4.5 |
| Control border / surface | 4.793 | 5.280 | 3 |
| Action border / surface | 4.793 | 13.514 | 3 |
| Focus outline / surface | 17.928 | 15.452 | 3 |

All 23 tested pair combinations pass in each theme. Opaque panel/control surfaces avoid uncertain compositing behind text. Outline spacing keeps its indicator against the surrounding surface; no translucency is used there.

## Changes and remaining coverage

| Principle | Before | After | Why |
| --- | --- | --- | --- |
| Theme/color | Product foundation had no scoped semantic contract | Product-only neutral/action/status roles and shadcn aliases, both themes | Migrate incrementally while enforcing meaning and measured contrast |
| Typography | No revamp font/type source | Scoped Next-loaded Geist and role sizes | Consistent readable hierarchy without changing legacy routes |
| Controls | Only legacy Radix wrappers | New Base UI button/dialog and native input | Preserve composition and platform behavior in new flows |
| Identity | No local revamp avatar wrapper | Server-generated DiceBear Shapes fallback | Deterministic identity without transmitting email to an avatar service |
| Layout | No testable foundation surface | Test-only control fixture; RTL centering fixed after failed test | Validate interaction and reflow before campaign adoption |
| Motion/focus | Theme transitions could smear; new rules absent | Theme swap suppression, instant overlays, pointer-only press, visible focus and reduced-motion guard | Preserve speed and keyboard orientation |
| Enforcement | shadcn plugin registration only | Three scoped shadcn design rules | Turn foundation conventions into executable constraints |

Not verified: VoiceOver, physical touch device, full browser zoom, pseudo-localization, forced-colors rendering, every hover/press state at slow speed, authenticated campaign UI, backend permissions and server failure behavior. No blanket interface approval or production-readiness claim is made. React Doctor scanned the staged foundation against its tooling parent. Internal links were changed to Next Link and button variants moved into a non-component module after its warnings. The final scan reported only the two pre-existing Axios/jsPDF Socket diagnostics (40/100); no new React code warning remained. These diagnostics are not suppressed here. Remote foundation CI status belongs to its PR.

Rollback: revert this slice. No database schema/migration, route redirect, or existing component replacement is included.
