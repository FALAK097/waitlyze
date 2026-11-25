# Waitlyze launch film

Separate Remotion project, intentionally outside the app workspace so app deployment does not install the renderer. From the repository root with Node 24 and pnpm 11.5.0:

```sh
pnpm --dir video install --frozen-lockfile
pnpm --dir video exec remotion browser ensure
pnpm --dir video studio
pnpm --dir video render
```

The nested workspace pins render dependencies separately and permits the esbuild lifecycle script required by the renderer. Rendered output stays local under ignored `video/out/`; R2 hosts the published artifacts. Composition: `LaunchFilm`, 1920 x 1080, 60 fps, 103.47 seconds. The published MP4 uses H.264/AAC and fast-start metadata before media data. Retain `-movflags +faststart` if re-encoding.

## Landing delivery

The film uses the canonical `https://assets.waitlyze.com/launch/` CDN, independent of user-upload storage environment overrides.

- Film: `waitlyze-launch-20c3621c1a04.mp4` (37,650,345 bytes).
- Poster: `waitlyze-launch-cbda091bb109.webp` (45,438 bytes).
- Filenames contain the first 12 characters of the SHA-256 digest. Upload changed bytes under new names and update the page URLs together.
- R2 content types: `video/mp4` and `image/webp`. Both use `Cache-Control: public, max-age=31536000, immutable`.
- Cloudflare cache rule set `e449f0068ead4fc9ae3b90891face975` covers only `assets.waitlyze.com` paths starting `/launch/waitlyze-launch-`, with a one-year edge TTL and zero TTL for 400–599 responses. Repeated full GETs returned cache HIT during delivery verification.
- Byte-range requests return 206 for seeking. Native controls, inline playback and `preload="none"` avoid downloading the film until play. There is no automatic playback or loop. Native playback works without JavaScript; browsers without video support receive a fallback link inside the video element.
- English captions: `public/videos/waitlyze-launch.en.vtt`, generated from segment narration times/text in `src/vo-manifest.json`. Regenerate when narration changes.

Earlier unversioned new-film uploads remain in R2 for compatibility. The old `showcase-demo-4k.webm` was deleted in the previous publishing run and is no longer referenced by the landing page. Feature screenshots remain in use.

## Editing the film

`src/index.ts` registers `src/Root.tsx`, which combines `WaitlyzeLaunch` with `public/soundtrack.mp3`. `src/WaitlyzeLaunch.tsx` orchestrates the 12-scene problem → solution → payoff narrative (`src/scenes/Act1Pain.tsx`, `src/scenes/Act2Solution.tsx`, `src/scenes/Act3MontageAndPayoff.tsx`), shared UI primitives (`src/components/Primitives.tsx`), Waitlyze brand tokens (`src/theme.ts`), and word-synchronized live captions. Shared motion helpers live in `src/motion/easing.ts`.

`src/vo-manifest.json` is the single source for narration text, word timings and scene boundaries. It replaces separate narration/storyboard tables and per-segment word JSON files. Keep multiword spoken URLs aligned to a single display token spanning the entire spoken interval. `public/vo/*.mp3` and the instrumental `public/music.mp3` remain editable audio sources; the composition uses their finished mix, `public/soundtrack.mp3`.

All 22 `public/captures/` images are used by the film. Refresh captures from seeded product data when the interface changes; keep credentials and customer data out of the footage. Three local font files cover all declared weights; duplicate font bytes are shared by the corresponding font-face declarations.

Before a full render, inspect stills near scene transitions, cursor targets and captions. Validate the final MP4 duration, 60fps, H.264/AAC tracks, complete frame and audio sync. For a scene-only correction, a keyframe-aligned replacement can avoid re-rendering the entire film, but verify frame counts, decoded prefix hashes and unchanged audio before publishing. Regenerate the poster only when its scene changes.
