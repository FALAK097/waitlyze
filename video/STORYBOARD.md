# Waitlyze launch film storyboard

`LaunchFilm` in `src/Root.tsx` renders `WaitlyzeLaunch` with the mixed soundtrack. Scene timing comes from `src/vo-manifest.json`; capture selection, cursor paths and camera transforms come from `SCENE_CLIPS` in `src/WaitlyzeLaunch.tsx`. Older faux UI components and `timeline.ts` are retained source material and are not used by this composition.

The film opens with an animated brand sequence, moves through real product captures with camera and cursor motion, and ends with a light halftone world-map brand card. Plain word-synchronized captions run throughout. The website preserves the entire 16:9 frame.

| Scene                 | Window       |
| --------------------- | ------------ |
| WAITLYZE              | 0.00–8.26s   |
| CAMPAIGNS             | 8.26–16.26s  |
| VISUAL BUILDER        | 16.26–25.01s |
| REFERRAL ENGINE       | 25.01–33.28s |
| PUBLISH & EMBED       | 33.28–40.54s |
| SUBSCRIBERS & FRAUD   | 40.54–48.45s |
| FULL-FUNNEL ANALYTICS | 48.45–56.43s |
| EMAIL AUTOMATIONS     | 56.43–64.00s |
| WEBHOOKS & API        | 64.00–72.51s |
| LAUNCH TODAY          | 72.51–78.22s |
