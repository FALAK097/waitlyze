import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { normalizeUploadedImage } from "../../src/lib/uploads/image.mjs";

test("uploaded raster bytes become a decoded WebP with a fixed safe extension", async () => {
  const png = await sharp({ create: { width: 10, height: 10, channels: 4, background: "red" } }).png().toBuffer();
  const image = await normalizeUploadedImage(png);
  assert.equal(image.extension, "webp");
  assert.equal(image.contentType, "image/webp");
  assert.equal((await sharp(image.data).metadata()).format, "webp");
});

test("active SVG, HTML, malformed, empty, and oversized payloads are rejected", async () => {
  for (const buffer of [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>'), Buffer.from("<html><script>alert(1)</script></html>"), Buffer.from("not an image"), Buffer.alloc(0), Buffer.alloc(4 * 1024 * 1024 + 1)]) {
    await assert.rejects(normalizeUploadedImage(buffer), TypeError);
  }
});

test("large dimensions are rejected before rasterizing a decompression bomb", async () => {
  const png = await sharp({ create: { width: 4100, height: 4100, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(normalizeUploadedImage(png), TypeError);
});
