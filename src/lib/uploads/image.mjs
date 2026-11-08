import { imageSize } from "image-size";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_PIXELS = 16_000_000;
const FORMATS = new Set(["jpg", "png", "webp", "gif", "avif"]);

/** Validate raster signatures and dimensions before publishing user-provided images. */
export async function normalizeUploadedImage(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > MAX_BYTES) {
    throw new TypeError("Choose an image smaller than 4MB.");
  }
  try {
    const metadata = imageSize(buffer);
    if (
      !FORMATS.has(metadata.type) ||
      !Number.isInteger(metadata.width) ||
      !Number.isInteger(metadata.height) ||
      metadata.width <= 0 ||
      metadata.height <= 0 ||
      metadata.width * metadata.height > MAX_PIXELS
    )
      throw new Error("unsupported_image");
    const contentType = metadata.type === "jpg" ? "image/jpeg" : `image/${metadata.type}`;
    return { data: buffer, extension: metadata.type, contentType };
  } catch {
    throw new TypeError("Choose a valid PNG, JPEG, WebP, GIF, or AVIF image.");
  }
}
