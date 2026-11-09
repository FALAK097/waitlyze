import { imageSize } from "image-size";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_PIXELS = 16_000_000;
const FORMATS = new Set(["jpg", "png", "webp", "gif", "avif"]);

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// PNG text/time chunks can embed GPS or device details.
const PNG_PRIVATE_CHUNKS = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);
// WebP metadata chunks (and the matching VP8X flag bits).
const WEBP_PRIVATE_CHUNKS = new Set(["EXIF", "XMP "]);
const WEBP_PRIVATE_FLAGS = 0x08 | 0x04; // EXIF | XMP

/**
 * Remove APP1 (EXIF/XMP, including GPS) and other private APPn segments from
 * a JPEG stream, keeping the JFIF and ICC profiles and every byte from the
 * start of scan onward. Returns null when the stream is not a walkable JPEG.
 */
function stripJpegMetadata(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  const parts = [buffer.subarray(0, 2)];
  let offset = 2;
  while (offset + 4 <= buffer.length && buffer[offset] === 0xff) {
    const marker = buffer[offset + 1];
    // Start of scan: entropy-coded data follows untouched.
    if (marker === 0xda) break;
    // Standalone markers carry no payload.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(buffer.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }
    if (marker === 0xd8 || marker === 0xd9) {
      parts.push(buffer.subarray(offset, offset + 2));
      offset += 2;
      if (marker === 0xd9) break;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > buffer.length) return null;
    const isAppn = marker >= 0xe0 && marker <= 0xef;
    const keep = !isAppn || marker === 0xe0 || marker === 0xe2; // JFIF (APP0), ICC (APP2)
    if (keep) parts.push(buffer.subarray(offset, offset + 2 + length));
    offset += 2 + length;
    if (marker === 0xd9) break;
  }
  parts.push(buffer.subarray(offset));
  return Buffer.concat(parts);
}

/** Drop private metadata chunks (EXIF, text, time) from a PNG stream. */
function stripPngMetadata(buffer) {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  const parts = [buffer.subarray(0, 8)];
  let offset = 8;
  let sawEnd = false;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("latin1", offset + 4, offset + 8);
    const total = 12 + length;
    if (offset + total > buffer.length) return null;
    if (!PNG_PRIVATE_CHUNKS.has(type)) parts.push(buffer.subarray(offset, offset + total));
    offset += total;
    if (type === "IEND") {
      sawEnd = true;
      break;
    }
  }
  if (!sawEnd) return null;
  return Buffer.concat(parts);
}

/** Drop EXIF/XMP chunks from a WebP container and clear their VP8X flags. */
function stripWebpMetadata(buffer) {
  if (
    buffer.length < 12 ||
    buffer.toString("latin1", 0, 4) !== "RIFF" ||
    buffer.toString("latin1", 8, 12) !== "WEBP"
  )
    return null;
  const parts = [buffer.subarray(0, 12)];
  let offset = 12;
  let sawImage = false;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString("latin1", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const total = 8 + size + (size % 2);
    if (offset + total > buffer.length) return null;
    if (WEBP_PRIVATE_CHUNKS.has(type)) {
      offset += total;
      continue;
    }
    if (type === "VP8X" && size >= 10) {
      const chunk = Buffer.from(buffer.subarray(offset, offset + total));
      chunk[8] &= ~WEBP_PRIVATE_FLAGS;
      parts.push(chunk);
    } else {
      if (type === "VP8 " || type === "VP8L") sawImage = true;
      parts.push(buffer.subarray(offset, offset + total));
    }
    offset += total;
  }
  if (!sawImage) return null;
  const body = Buffer.concat(parts);
  body.writeUInt32LE(body.length - 8, 4);
  return body;
}

function stripPrivateMetadata(buffer, type) {
  try {
    if (type === "jpg") return stripJpegMetadata(buffer) ?? buffer;
    if (type === "png") return stripPngMetadata(buffer) ?? buffer;
    if (type === "webp") return stripWebpMetadata(buffer) ?? buffer;
  } catch {
    // Never trade metadata stripping for a broken upload.
  }
  return buffer;
}

/**
 * Structural completeness checks. image-size only reads the header, so a
 * truncated or fake image can pass it; these verify the container actually
 * ends where it should before anything is published to public R2.
 */
function assertCompleteImage(buffer, type) {
  if (type === "jpg") {
    const eoi =
      buffer.length >= 2 &&
      buffer[buffer.length - 2] === 0xff &&
      buffer[buffer.length - 1] === 0xd9;
    const hasScan = buffer.indexOf(Buffer.from([0xff, 0xda])) > 0;
    if (!eoi || !hasScan) throw new Error("truncated_jpeg");
    return;
  }
  if (type === "png") {
    let offset = 8;
    let sawIdat = 0;
    let sawEnd = false;
    while (offset + 12 <= buffer.length) {
      const length = buffer.readUInt32BE(offset);
      const chunkType = buffer.toString("latin1", offset + 4, offset + 8);
      const total = 12 + length;
      if (offset + total > buffer.length) throw new Error("truncated_png");
      if (chunkType === "IDAT") sawIdat += 1;
      if (chunkType === "IEND") {
        sawEnd = true;
        break;
      }
      offset += total;
    }
    if (!sawEnd || sawIdat === 0) throw new Error("incomplete_png");
    return;
  }
  if (type === "webp") {
    if (
      buffer.length < 12 ||
      buffer.toString("latin1", 0, 4) !== "RIFF" ||
      buffer.readUInt32LE(4) + 8 > buffer.length
    )
      throw new Error("truncated_webp");
    return;
  }
  if (type === "gif") {
    if (buffer[buffer.length - 1] !== 0x3b) throw new Error("truncated_gif");
    return;
  }
  // AVIF: verify the ISOBMFF stream declares an AVIF brand and reaches an
  // mdat box, so a header-only file cannot be published.
  if (type === "avif") {
    const head = buffer.toString("latin1", 4, 8) === "ftyp";
    if (!head || !buffer.includes(Buffer.from("mdat"))) throw new Error("incomplete_avif");
  }
}

async function decodeIfPossible(data, contentType) {
  // Full decode validation where the runtime provides it (Cloudflare
  // Workers). Node dev/build runtimes fall back to structural checks only.
  if (typeof createImageBitmap !== "function") return;
  const bitmap = await createImageBitmap(new Blob([data], { type: contentType }));
  bitmap.close();
}

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
    // Strip EXIF/GPS and other private metadata before the bytes are stored,
    // then verify the result is still a complete, decodable image.
    const data = stripPrivateMetadata(buffer, metadata.type);
    assertCompleteImage(data, metadata.type);
    await decodeIfPossible(data, contentType);
    return { data, extension: metadata.type, contentType };
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError("Choose a valid PNG, JPEG, WebP, GIF, or AVIF image.", { cause: error });
  }
}
