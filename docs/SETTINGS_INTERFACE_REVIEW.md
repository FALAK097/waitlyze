# Authenticated interface review

Reviewed on 2026-10-11 using better-interface, better-ui, and make-interfaces-feel-better. Scope: authenticated navigation, Settings, integration drawers, developer guides, Analytics navigation, and shared error states. The latest decision replaces the global sidebar with horizontal navigation; Settings retains its own section menu.

## Changes and evidence

| Domain | Before | After | Evidence |
| --- | --- | --- | --- |
| Layout | Global sidebar despite few main destinations | Aligned top bar with workspace context, Waitlists, Settings, Docs and account menu | `src/components/product/app-shell.jsx:62`, `app-shell.css:4` |
| Layout | All Settings panels displayed in one scroll | Selected panel only, with section links on the left and mobile grid | `src/app/(app)/settings/page.jsx:14`, `settings-page.css:1` |
| Accessibility | Configuration always visible; nested API-key dialogs could appear below drawer | Base UI drawer; inline create/revoke panels; focus moves to panel heading and returns on cancel | `src/components/product/side-drawer.jsx:9`, `src/components/api-keys-client.jsx:26` |
| Accessibility | Navigation depended on scrolling | Real links, current-page state, breadcrumbs and skip link | `src/components/product/app-shell.jsx:29`, `settings-section-nav.jsx:26` |
| Writing | Developer/Privacy/Data sections and repetitive integration descriptions | Four Settings destinations; concise provider description; API-key action and public guides | `src/app/(app)/settings/page.jsx:43`, `integrations-panel.jsx:13` |
| Writing | Replacement Resend sender described as remaining active | Copy explains deployment sender fallback until replacement passes its test | `src/components/product/resend-integration.jsx:78` |
| Typography | Long email/member labels truncated | Wrapping labels, controlled form width, tabular member counts and consistent heading scale | `src/components/product/settings-page.css:16`, `app-shell.css:26` |
| Color | Card-heavy sections and decorative icon backgrounds | White surfaces, restrained selected state, background-free Resend mark | `src/components/product/settings-page.css:1`, `integrations-panel.css:1` |
| UI polish | Long-page skeleton and short-lived errors | Matching panel skeleton, persistent dismissible Settings error toasts, inline recovery | `src/components/product/settings-panel-skeleton.jsx:1`, `settings-feedback.jsx:7` |
| UI polish | Analytics buried in published Overview | Dedicated authorized Analytics page, available for draft and published waitlists | `src/app/(app)/wait-lists/[id]/analytics/page.jsx:9`, `waitlist-nav.jsx:12` |
| UI polish | Generic failure UI | Original white/lime 404 illustration and shared retry errors using Next.js `retry` | `src/components/product/status-page.jsx:9`, `src/app/(app)/error.jsx:4` |

Integration-specific changes and primary sources are recorded in `SETTINGS_INTEGRATIONS_REVIEW.md`.

## Verification

- Authenticated browser: Profile, Members and Integrations render separately; Analytics displays live local data for the existing published waitlist. Account menu shows name/email/sign-out. Invitation opens with email focus; Escape restores its trigger. No invitation or provider email was sent.
- Resend drawer and API-key drawer open and dismiss. API-key create form is visible at 390px; entry focuses its heading, Cancel returns focus to the guide, Escape restores the API-key trigger. No new credential was issued or revoked during this visual check.
- Settings checked at 320px and 390px with no horizontal document overflow. The provider action was adjusted to remain on one line at 320px. Desktop layout checked at the existing browser size; temporary viewport overrides were reset.
- Rendered navigation colors: secondary RGB(78,82,85) on white has 7.89:1 contrast; selected RGB(0,22,13) on RGB(242,242,243) has 16.75:1. These measured pairs pass normal-text AA; this is not a full contrast audit.
- Docs render and client navigation back into Settings keeps the app layout intact. All five guides return HTTP 200; unknown documentation and the public not-found test return 404.
- Drawer transitions are limited to transform/opacity and enabled only when reduced motion is not requested. Reduced-motion behavior was inspected in CSS; OS preference and actual 200% browser zoom were not separately exercised.
- Full ESLint, production build and 22 security unit tests pass. Build emits two non-blocking Fumadocs search-highlight CSS optimizer warnings.
- Independent review approved after fixing drawer layering and Resend copy. Auth/scope and API documentation contracts were reviewed.
- React Doctor scanned the broader PR against main: 51/100, 69 diagnostics. Its four errors were independently checked as false positives: campaign authorization is enforced through `requireCampaign` before mutation, and the copyright timer/listener has cleanup. No rules were suppressed. Existing complexity, formatting and architecture warnings remain; the scanner did not pass cleanly.

Verdict: the requested navigation and Settings changes are implemented and locally checked. External email delivery, provider configuration, new-key issuance/revocation, deployed runtime behavior and latest CI remain separate verification boundaries.
