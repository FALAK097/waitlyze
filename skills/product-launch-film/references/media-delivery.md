# Media correction and web delivery

Read when changing an existing render or publishing a film. Inspect the project's actual media and provider configuration rather than reusing IDs or hostnames from another project.

## Encode and inspect

```sh
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,duration:format=duration -of json film.mp4
ffmpeg -v error -i film.mp4 -f null -
ffmpeg -i rendered.mp4 -c copy -movflags +faststart film.mp4
ffmpeg -ss 1.65 -i film.mp4 -frames:v 1 poster.png
cwebp -q 90 poster.png -o poster.webp
```

Choose a representative poster time, not a blank transition. Avoid re-encoding the entire film for a metadata-only change. Fast-start requires the `moov` atom before `mdat`; verify rather than assuming the renderer did it. Encoded audio padding can make container duration slightly longer than `frames / fps`.

## Correct only a scene

Prefer a full re-render when practical. For an expensive film with an isolated correction:

1. Find an original video keyframe before the changed scene using ffprobe. Render from that exact frame through the end of the film, so the replacement retains every later scene. Match dimensions, fps, codec/profile, pixel format, color range and time base.
2. Extract the prefix by exact frame count. Time-based stream-copy trimming can include extra B-frame packets. Concatenate compatible video segments and map the original audio when its timing is unchanged. Preserve fast-start.
3. Decode the entire result. Verify total frame count, scene boundary playback and unchanged decoded-prefix `framemd5` output. Compare original audio packet hashes/timestamps if claiming audio preservation. Encoded video packet hashes alone can differ after remuxing because parameter sets are inserted.
4. Inspect the corrected interval with audio. Never call a successful concat command proof of frame or sync correctness.

## Publish to R2 or equivalent object storage

- Compute the final file's SHA-256 and put a digest in its key. Set explicit `video/mp4` or `image/webp` types and `Cache-Control: public, max-age=31536000, immutable` only for immutable, public assets. Keep source media and credentials separate.
- Use the canonical public CDN host. An environment variable intended for user uploads may point at an obsolete or private host; verify the actual browser-resolved source.
- Scope any edge-cache rule to public film paths; avoid caching app routes or errors. Preserve existing rules. Origin browser-cache headers do not establish edge-cache eligibility.
- Verify HEAD content type/length and GET byte ranges (`206` plus correct `Content-Range`). Warm with a full GET and repeat it to confirm edge HIT; HEAD/range cache status can differ. Keep poster checks separate.
- Update source URLs and documentation together after upload. Do not overwrite immutable keys or delete assets still referenced by a deployed page. Preserve rollback versions until migration is confirmed.

## Small reproducible project

Trace entrypoint imports and literal/dynamic asset paths before deletion. Preserve the screenshots and editable sound sources actually needed for revisions. Deduplicate font bytes while keeping declared weight behavior identical. Consolidate narration and timings into one manifest; remove per-segment copies only after checking their callers. Keep rendered files out of source control when published artifacts already have durable storage. Validate a clean lockfile install and render a representative still after cleanup.
