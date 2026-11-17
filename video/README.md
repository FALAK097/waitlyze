# Waitlyze launch film

Separate Remotion project, intentionally outside the app workspace so app deployment does not install the renderer. From the repository root with Node 24 and pnpm 11.5.0:

```sh
pnpm --dir video install --ignore-workspace --frozen-lockfile
pnpm --dir video exec remotion browser ensure
pnpm --dir video studio
pnpm --dir video render
```

The lockfile pins render dependencies. Composition: `LaunchFilm`, 1920 x 1080, 60 fps, 78.22 seconds. The published MP4 uses H.264/AAC and fast-start metadata before media data. Retain `-movflags +faststart` if re-encoding.

## Landing delivery

The film uses the canonical `https://assets.waitlyze.com/launch/` CDN, independent of user-upload storage environment overrides.

- Film: `waitlyze-launch-67cd5b85b9b2.mp4` (33,181,298 bytes).
- Poster: `waitlyze-launch-41e3af827abd.webp` (245,372 bytes).
- Filenames contain the first 12 characters of the SHA-256 digest. Upload changed bytes under new names and update the page URLs together.
- R2 content types: `video/mp4` and `image/webp`. Both use `Cache-Control: public, max-age=31536000, immutable`.
- Cloudflare cache rule set `e449f0068ead4fc9ae3b90891face975` covers only `assets.waitlyze.com` paths starting `/launch/waitlyze-launch-`, with a one-year edge TTL and zero TTL for 400–599 responses. Repeated full GETs returned cache HIT during delivery verification.
- Byte-range requests return 206 for seeking. Native controls, inline playback and `preload="none"` avoid downloading the film until play. There is no automatic playback or loop. A visible direct link works without JavaScript or embedded video support.
- English captions: `public/videos/waitlyze-launch.en.vtt`, generated from segment narration times/text in `src/vo-manifest.json`. Regenerate when narration changes.

Earlier unversioned new-film uploads remain in R2 for compatibility. The old `showcase-demo-4k.webm` was deleted in the previous publishing run and is no longer referenced by the landing page. Feature screenshots remain in use.
