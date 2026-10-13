import sharp from "sharp";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_PIXELS = 16_000_000;
const FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif"]);

/** Decode and re-encode untrusted input; never publish original active content. */
export async function normalizeUploadedImage(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > MAX_BYTES) {
    throw new TypeError("Choose an image smaller than 4MB.");
  }
  try {
    const image = sharp(buffer, { limitInputPixels: MAX_PIXELS, failOn: "error" });
    const metadata = await image.metadata();
    if (!FORMATS.has(metadata.format)) throw new Error("unsupported_format");
    const data = await image.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    return { data, extension: "webp", contentType: "image/webp" };
  } catch {
    throw new TypeError("Choose a valid PNG, JPEG, WebP, GIF, or AVIF image.");
  }
}
