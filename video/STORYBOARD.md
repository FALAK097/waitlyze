# Waitlyze Launch Video — Storyboard & Visual Choreography

## Format & Guardrails

- **Resolution & Frame Rate:** `1920×1080` (`16:9`), `60fps`, `4,771` frames (`79.51s`)
- **100% Real Product UI:** Every feature scene uses high-DPI (`3200×1920`, `2x` Retina) Playwright captures of the actual logged-in Waitlyze application (`Weekend Studio` PRO workspace) stored in [`video/public/captures/`](file:///Users/falakgala/projects/Waitlyze/video/public/captures/).
- **Zero Clipping / Full-Frame Guarantee:** The browser window (`1540×920px`) is centered inside the `1920×1080` canvas (`top: 66px`, `left: 190px`) with `objectFit: "contain"` and subtle scale (`1.0` to `1.018`), leaving dedicated top HUD (`14px..56px`) and bottom caption (`1004px..1066px`) safe zones so **zero UI edges, sidebars, tables, or drawers are ever cut off**.

## Scene-by-Scene Breakdown

1. **Scene 01 — Hook, Brand Drop & Hero Reveal (`0.00s – 9.33s`, frames `0 – 560`)**
   - `0.00s – 4.25s`: Fast kinetic typography contrasting fragmented launch tools (_Forms + Spreadsheets + Referral Hacks_).
   - `4.25s – 5.55s`: Lime brand mark + **Waitlyze** wordmark drop with spring physics.
   - `5.55s – 9.33s`: Instant reveal of the live hosted waitlist (`08_public_page_hero.png`) transitioning into the multi-waitlist workspace (`01_waitlists_dashboard.png`).

2. **Scene 02 — Multi-Waitlist Workspace Dashboard (`9.33s – 17.37s`, frames `560 – 1042`)**
   - Screen: `01_waitlists_dashboard.png`
   - Highlights `Weekend Studio` PRO workspace, status tabs (`All / Draft / Published / Paused`), and live metrics across 5 campaigns (`Weekend — Cabin & Trail Drops`: `5,188` visitors, `1,774` subscribers, `34.2%` conversion).

3. **Scene 03 — Visual Page Builder (`17.37s – 26.16s`, frames `1042 – 1570`)**
   - Sub-clip A (`17.37s – 20.30s`): `02_builder_blocks.png` — 3-pane editor with section blocks (`Hero`, `Features`, `Rewards`, `FAQ`, `Countdown`, `Social Proof`), live canvas, and inspector controls.
   - Sub-clip B (`20.30s – 23.25s`): `03_builder_design.png` — Templates gallery (` Editorial`, ` Kinetic`, ` Minimal`) and Brand Kit palette/typography controls.
   - Sub-clip C (`23.25s – 26.16s`): `04_builder_mobile.png` — Instant responsive mobile viewport preview inside the builder.

4. **Scene 04 — Viral Referral & Rewards Engine (`26.16s – 34.47s`, frames `1570 – 2068`)**
   - Sub-clip A (`26.16s – 30.40s`): `05_builder_after_signup.png` — Post-signup status page builder (`Confirmed / Pending email / Returning visitor`, queue position `#228`, `80` points, milestone progress bar).
   - Sub-clip B (`30.40s – 34.47s`): `09_public_page_rewards.png` — Live public reward tier ladder (`1 Referral → +5 Spots`, `3 Referrals → Priority Thursday Drop`, `5 Referrals → Brass Trail Compass`, `10 Referrals → Free Off-Grid Night`).

5. **Scene 05 — Readiness Checklist, Custom Domain & Embeds (`34.47s – 41.77s`, frames `2068 – 2506`)**
   - Sub-clip A (`34.47s – 36.90s`): `06_builder_publish_share.png` — Launch readiness checklist (`6/6 ready`), shareable hosted link, and SEO metadata.
   - Sub-clip B (`36.90s – 39.35s`): `18_settings_domain.png` — Verified custom domain (`waitlist.weekend.club` `Active`) with DNS verification table.
   - Sub-clip C (`39.35s – 41.77s`): `07_builder_embed_code.png` — Copy-paste JS embed snippet and public REST API snippet.

6. **Scene 06 — Subscribers CRM & Fraud Review (`41.77s – 49.72s`, frames `2506 – 2983`)**
   - Sub-clip A (`41.77s – 45.70s`): `10_subscribers_crm.png` — Full subscriber CRM (`1,774` signups, verified status, referral counts, points, acquisition source, device, country).
   - Sub-clip B (`45.70s – 49.72s`): `11_subscribers_fraud_review.png` — Flagged referral review drawer inspecting same-browser-fingerprint signups before granting referral credit (`Exclude` vs `Approve credit`).

7. **Scene 07 — Full-Funnel Analytics & Global Reach (`49.72s – 57.74s`, frames `2983 – 3464`)**
   - Sub-clip A (`49.72s – 52.45s`): `12_analytics_overview.png` — KPI cards (`3,690` visitors, `1,333` signups, `36.12%` conversion `Strong`, `86.5%` verification), EvilCharts daily activity area chart, and conversion funnel.
   - Sub-clip B (`52.45s – 55.15s`): `13_analytics_map_channels.png` — Acquisition channels (`Direct / Referral / Paid / Social`), Browsers & Devices tabs, and interactive World Map (`US 626`, `GB 158`, `CA 120`, `DE 92`, `IN 68`).
   - Sub-clip C (`55.15s – 57.74s`): `14_analytics_referrals_email.png` — Organic vs referred signup split, Top Referrers leaderboard, and Email Delivery health.

8. **Scene 08 — Lifecycle Email Automations & Broadcasts (`57.74s – 65.35s`, frames `3464 – 3921`)**
   - Sub-clip A (`57.74s – 60.35s`): `15_emails_automations.png` — Event-driven automation recipes (`Welcome`, `Referral Nudge`, `Milestone Unlocked`, `Launch Countdown`).
   - Sub-clip B (`60.35s – 62.90s`): `16_emails_broadcasts.png` — Broadcast composer targeting verified cohorts and past sent campaigns.
   - Sub-clip C (`62.90s – 65.35s`): `17_emails_logs.png` — Per-recipient Resend delivery logs (`Sent`, `Subject`, `Type`, `Timestamp`).

9. **Scene 09 — Webhooks, Alerts, Scoped API Keys & Audit Logs (`65.35s – 73.90s`, frames `3921 – 4434`)**
   - Sub-clip A (`65.35s – 67.50s`): `19_settings_webhooks.png` — Signed webhook endpoints (`Production CRM Sync`, `Linear Growth Triage`) with delivery status.
   - Sub-clip B (`67.50s – 69.65s`): `20_settings_notifications.png` — Instant Slack (`#growth-signups`) and Discord (`#waitlist-feed`) milestone alerts.
   - Sub-clip C (`69.65s – 71.80s`): `21_workspace_api_keys.png` — Scoped `wly_live_...` API keys (`subscribers:read/write`, `waitlists:read`, `analytics:read`).
   - Sub-clip D (`71.80s – 73.90s`): `22_workspace_audit_log.png` — Immutable workspace audit log of domain, webhook, and campaign actions.

10. **Scene 10 — Outro CTA (`73.90s – 79.51s`, frames `4434 – 4771`)**
    - Full-screen brand close with `waitlyze.com` URL pill, complete feature badges, and animated lime CTA button.
