# Integrations and developer documentation

## Connection scope

Resend is the only implemented provider. Its connection uses a sending API key, not OAuth. The integration screen deliberately does not advertise unimplemented connectors as available.

The API-key model remains waitlist scoped: generated secrets grant signup-write access to one waitlist. They are stored as hashes and returned once. Generating a default workspace key, returning a saved plaintext key, or silently broadening access would require a separate authorization and migration design. Replacement is explicit revoke → create, with an immediate-access-loss confirmation.

## Interface changes

| Principle | Before | After | Location |
| --- | --- | --- | --- |
| Grouping | Resend credential form always displayed inside a card | One provider row with status and Connect/Manage; configuration opens in a right drawer | `src/components/product/resend-integration.jsx` |
| Minimal surfaces | Card-heavy provider layout and large integration guide sheet | Spaced, background-free logo and row; compact header actions | `src/components/product/integrations-panel.jsx`, `integrations-panel.css` |
| Secret handling | Password field only | Mask/reveal/copy for newly entered secrets; saved encrypted secrets never returned; typed secrets cleared on close/save | `src/components/product/resend-integration.jsx` |
| Recovery | Inline request status only | Busy labels, disabled duplicate submissions, inline recoverable error and success/error toast | `src/components/product/resend-integration.jsx` |
| Destructive actions | Disconnect immediately removed credentials | Explicit disconnect confirmation with sender fallback explanation | `src/components/product/resend-integration.jsx` |
| Progressive disclosure | Dedicated API-key section and dated guide | API keys action opens drawer; published developer docs accessible from header | `src/components/product/integrations-panel.jsx` |
| Secret handling | Plaintext newly created API key displayed and kept in list state | Masked once-only reveal/copy; raw secret excluded from list state and discarded on panel close | `src/components/api-keys-client.jsx` |
| Loading/recovery | Loading copy and table-heavy key list | Skeleton rows; abortable parallel key/waitlist fetch; retry error; empty state; revoke confirmation | `src/components/api-keys-client.jsx` |
| Honest API contracts | Integration guide confined to a sheet | Indexed Fumadocs guides match current signup, embed, webhook, and Resend implementation; dashboard endpoints distinguished from developer authentication | `src/app/docs`, `src/lib/developer-docs.jsx` |
| Responsive content | Fixed 600/700px guide drawer and bulky tables | Flexible key list and full-width controls; docs code/table overflow local to content | `integrations-panel.css`, `src/app/docs/docs.css` |
| Color/motion | In-sheet dark code blocks | White-only docs with pale neutral code surface; no theme switch/provider; reduced motion disables docs animation | `src/app/docs/layout.jsx`, `docs.css` |

## Sources and attribution

- Resend icon retrieved through [SVGL API](https://svgl.app/docs/api), using the public light asset [Resend icon](https://svgl.app/library/resend-icon-black.svg). Trademark belongs to Resend; no API call is required at runtime. Logo has no background.
- [Fumadocs Docs Layout](https://www.fumadocs.dev/docs/ui/layouts/docs), [Docs Page](https://www.fumadocs.dev/docs/ui/layouts/page), and [Root Provider](https://www.fumadocs.dev/docs/ui/layouts/root-provider) guided the implementation. `fumadocs-ui` and `fumadocs-core` 16.17.1 peer dependencies support Next 16 and React 19.2+; this repository uses Next 16.3.8 and React 19.3.
- Resend domain instructions link to [official Resend domain setup](https://resend.com/docs/dashboard/domains/introduction).

## Verification

Targeted ESLint and `git diff --check` pass. Executed the documented webhook verifier against `signWebhook` from the actual application: valid signature passes; wrong key and stale timestamp fail; multiple rotation signatures are accepted when one is valid. The documentation does not promise provider credentials, external email delivery, or a running dispatcher that have not been verified.

Creation and revocation use inline panels in the existing drawer, eliminating nested modal focus traps and portal stacking. Panel headings receive focus on entry; focus returns to the guide link on exit.

Runtime, keyboard/focus, drawer/panel interactions, mobile width, and docs rendering are checked in the final parent-agent browser pass. This file records implementation changes and source-level evidence; it does not replace that runtime verification.
