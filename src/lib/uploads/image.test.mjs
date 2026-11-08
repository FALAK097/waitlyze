import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeUploadedImage } from "./image.mjs";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/SikAAAAASUVORK5CYII=",
  "base64",
);

test("validates a raster upload and preserves its original type", async () => {
  const result = await normalizeUploadedImage(ONE_PIXEL_PNG);
  assert.equal(result.extension, "png");
  assert.equal(result.contentType, "image/png");
  assert.deepEqual(result.data, ONE_PIXEL_PNG);
});

test("rejects malformed, unsupported, and oversized image input", async () => {
  await assert.rejects(() => normalizeUploadedImage(Buffer.from("not an image")), TypeError);
  await assert.rejects(() => normalizeUploadedImage(Buffer.alloc(4 * 1024 * 1024 + 1)), TypeError);
  await assert.rejects(() => normalizeUploadedImage("not a buffer"), TypeError);
});
