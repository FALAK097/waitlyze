---
name: product-launch-film
description: Plan, build, revise, and publish product launch videos with Remotion using real product captures, narration, captions, and polished motion. Use for reference-video analysis, SaaS walkthrough films, or landing-page video delivery.
---

# Product launch film

Produce an editable film grounded in the actual product, with evidence that the exported media and its delivery work. Match the user's requested stage: analysis or planning alone does not authorize implementation or publishing.

## 1. Understand the reference and product

- Inspect the reference video itself, with audio and representative frames. Record timecoded beats: opening hook, pacing, cuts, framing, camera moves, cursor actions, typography, captions, sound and closing CTA. A thumbnail or social post is insufficient; disclose inaccessible footage.
- Inspect the repository and primary product journey. Verify every feature claim against working behavior; distinguish seeded demonstration metrics from real results. Use the reference's visual language without copying its branding, footage or soundtrack.
- Propose a short shot list tied to a clear audience and outcome. For each shot specify duration, real UI state, action/focus, narration and transition. Respect requested scope before moving to production.

## 2. Build one reproducible composition

- Prefer real product screenshots or recordings over fabricated dashboards. Capture a consistent viewport at high resolution with seeded data, stable fonts and no loading artifacts, credentials or customer information. Inspect the entire frame, including drawers, tables and URLs.
- Use a separate locked Remotion package when renderer dependencies should stay out of app deployment. Confirm supported Node, browser and package versions before rendering. Keep one active entry/composition and only assets reachable from it, plus clearly identified editable audio sources.
- Centralize scene boundaries, narration text and word timings. Generate selectable VTT captions from the same data. Group punctuation and spoken compounds deliberately: one displayed URL may span several spoken words. Highlight through the complete interval.
- Drive animation from frame/time, not wall-clock timers or random values. Await font/image readiness. Use local fonts, explicit dimensions and controlled easing. Animate only to explain a transition or guide attention; synchronize cursors to the action and keep small UI legible.
- Maintain full-frame and caption safe areas across camera moves. Inspect boundaries, not just scene centers. Rolling digits must derive display and fractional progress from the same decimal base; reordered rows must reach their authored final values.

## 3. Finish sound and render

- Finalize narration pacing before fine camera timing. Keep segment audio and a reusable instrumental when future edits need them; retain a finished mix for deterministic rendering. Use licensed or user-authorized sound. Duck music under speech, avoid clipping, and listen to the exported mix.
- Start with representative stills and short ranges, then render the full film. A useful web default is 1920×1080, 60fps, H.264/AAC, CRF 16–18 and MP4 fast-start; adapt to the brief rather than forcing these settings.
- Inspect hook, every cut, densest UI, caption changes and CTA. Check temporal behavior with playback, not stills alone. Confirm exported dimensions, frame count, duration, audio sync and decoding. For partial re-renders or CDN publishing, read [media-delivery.md](references/media-delivery.md).

## 4. Deliver and verify

- A narrated marketing film usually benefits from native controls, click-to-play, `playsInline`, `preload="none"`, a compact high-quality poster and a reserved aspect ratio. Respect the user's playback choice; handle reduced-motion and constrained-data contexts when adding autoplay. Keep captions selectable and provide a visible direct-media fallback outside the video element.
- Publish only within the user's authorized scope. Verify the real public URL, byte ranges and caching; upload new bytes under a new content-hashed key and update the page atomically. Keep old referenced assets until consumers migrate.
- Check desktop and narrow mobile playback, seeking, sound, captions, full-frame visibility, pre-play network traffic and the fallback with JavaScript unavailable. Reinspect fixes. Separate local, CI, public-CDN and deployed-page evidence.
- Follow repository checks and review requirements. Remove abandoned compositions, duplicate timings/fonts and temporary captures. Prefer CDN artifacts over committed rendered binaries where appropriate; retain source inputs and a locked, documented render path. Report the final artifact/PR, verified results and remaining gaps; never infer deployment from a passing build.
