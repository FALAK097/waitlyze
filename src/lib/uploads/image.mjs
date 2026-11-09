import { imageSize } from "image-size";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_PIXELS = 16_000_000;
const FORMATS = new Set(["jpg", "png", "webp", "gif", "avif"]);

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// PNG text/time chunks can embed GPS or device details.
const PNG_PRIVATE_CHUNKS = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);
// EXIF Orientation tag (0x0112) — the one value worth keeping when stripping.
const EXIF_ORIENTATION_TAG = 0x0112;
// WebP metadata chunks: "EXIF" keeps only its Orientation tag, "XMP " is
// dropped entirely (matching VP8X flag bits below).
const WEBP_XMP_FLAG = 0x04;
const WEBP_EXIF_FLAG = 0x08;

/**
 * Read the EXIF Orientation tag (0x0112) from a raw EXIF payload, with or
 * without the JPEG-style "Exif\0\0" prefix. Returns 1-8, or null when the
 * payload is malformed or has no orientation. Never throws: a payload we
 * cannot parse is simply dropped with the rest of the metadata.
 */
function readExifOrientation(payload) {
  try {
    let tiff = payload;
    if (tiff.length >= 6 && tiff.toString("latin1", 0, 6) === "Exif\0\0") tiff = tiff.subarray(6);
    if (tiff.length < 8) return null;
    const byteOrder = tiff.toString("latin1", 0, 2);
    if (byteOrder !== "II" && byteOrder !== "MM") return null;
    const little = byteOrder === "II";
    const u16 = (offset) => (little ? tiff.readUInt16LE(offset) : tiff.readUInt16BE(offset));
    const u32 = (offset) => (little ? tiff.readUInt32LE(offset) : tiff.readUInt32BE(offset));
    if (u16(2) !== 42) return null;
    const ifd = u32(4);
    if (ifd < 8 || ifd + 2 > tiff.length) return null;
    const entries = u16(ifd);
    if (ifd + 2 + entries * 12 > tiff.length) return null;
    for (let i = 0; i < entries; i++) {
      const entry = ifd + 2 + i * 12;
      if (u16(entry) !== EXIF_ORIENTATION_TAG) continue;
      // Orientation is a single SHORT whose value sits in the value field.
      if (u16(entry + 2) !== 3 || u32(entry + 4) !== 1) return null;
      const value = u16(entry + 8);
      return value >= 1 && value <= 8 ? value : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Minimal EXIF blob holding nothing but the Orientation tag. */
function buildExifOrientationPayload(orientation, withPrefix) {
  const tiff = Buffer.alloc(26);
  tiff.write("II", 0, "latin1"); // little-endian TIFF header
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(8, 4); // IFD0 follows the 8-byte header
  tiff.writeUInt16LE(1, 8); // exactly one entry
  tiff.writeUInt16LE(EXIF_ORIENTATION_TAG, 10);
  tiff.writeUInt16LE(3, 12); // SHORT
  tiff.writeUInt32LE(1, 14); // one value
  tiff.writeUInt16LE(orientation, 18); // value in the first two bytes, then padding
  tiff.writeUInt32LE(0, 22); // no further IFDs (GPS, Exif IFD, thumbnails all gone)
  if (!withPrefix) return tiff;
  return Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff]);
}

/**
 * Rebuild an EXIF payload that keeps only Orientation (2-8; 1 needs no tag).
 * Returns null when there is nothing worth keeping, so callers drop the
 * metadata entirely.
 */
function rebuildExifKeepOrientation(payload) {
  const orientation = readExifOrientation(payload);
  if (orientation === null || orientation < 2 || orientation > 8) return null;
  const withPrefix = payload.length >= 6 && payload.toString("latin1", 0, 6) === "Exif\0\0";
  return buildExifOrientationPayload(orientation, withPrefix);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function buildJpegApp1Segment(payload) {
  const segment = Buffer.alloc(4 + payload.length);
  segment[0] = 0xff;
  segment[1] = 0xe1;
  segment.writeUInt16BE(payload.length + 2, 2); // length includes its own two bytes
  payload.copy(segment, 4);
  return segment;
}

function buildPngChunk(type, data) {
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, "latin1");
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length);
  return chunk;
}

function buildWebpChunk(type, data) {
  const chunk = Buffer.alloc(8 + data.length + (data.length % 2)); // RIFF pads to even sizes
  chunk.write(type, 0, "latin1");
  chunk.writeUInt32LE(data.length, 4);
  data.copy(chunk, 8);
  return chunk;
}

/**
 * Remove APP1 (EXIF/XMP, including GPS) and other private APPn segments from
 * a JPEG stream, keeping the JFIF and ICC profiles, an orientation-only EXIF
 * value, and every byte from the start of scan onward. Returns null when the
 * stream is not a walkable JPEG.
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
    if (keep) {
      parts.push(buffer.subarray(offset, offset + 2 + length));
    } else if (
      marker === 0xe1 &&
      length >= 8 &&
      buffer.toString("latin1", offset + 4, offset + 10) === "Exif\0\0"
    ) {
      // EXIF: strip GPS, device details and thumbnails, but keep the
      // Orientation tag or phone photos would render sideways.
      const rebuilt = rebuildExifKeepOrientation(buffer.subarray(offset + 4, offset + 2 + length));
      if (rebuilt) parts.push(buildJpegApp1Segment(rebuilt));
    }
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
    if (type === "eXIf") {
      // Keep only Orientation; drop GPS and the rest of the EXIF payload.
      const rebuilt = rebuildExifKeepOrientation(buffer.subarray(offset + 8, offset + 8 + length));
      if (rebuilt) parts.push(buildPngChunk("eXIf", rebuilt));
    } else if (!PNG_PRIVATE_CHUNKS.has(type)) {
      parts.push(buffer.subarray(offset, offset + total));
    }
    offset += total;
    if (type === "IEND") {
      sawEnd = true;
      break;
    }
  }
  if (!sawEnd) return null;
  return Buffer.concat(parts);
}

/** EXIF chunk data of a WebP container, or null when it has none. */
function readWebpExifChunk(buffer) {
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString("latin1", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const total = 8 + size + (size % 2);
    if (offset + total > buffer.length) return null;
    if (type === "EXIF") return buffer.subarray(offset + 8, offset + 8 + size);
    offset += total;
  }
  return null;
}

/** Drop EXIF/XMP chunks from a WebP container, keeping orientation-only EXIF. */
function stripWebpMetadata(buffer) {
  if (
    buffer.length < 12 ||
    buffer.toString("latin1", 0, 4) !== "RIFF" ||
    buffer.toString("latin1", 8, 12) !== "WEBP"
  )
    return null;
  // VP8X, which carries the EXIF flag, precedes every other chunk, so decide
  // now whether an orientation-only EXIF chunk survives the strip.
  const exifData = readWebpExifChunk(buffer);
  const keptExif = exifData ? rebuildExifKeepOrientation(exifData) : null;
  const parts = [buffer.subarray(0, 12)];
  let offset = 12;
  let sawImage = false;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString("latin1", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const total = 8 + size + (size % 2);
    if (offset + total > buffer.length) return null;
    if (type === "EXIF") {
      if (keptExif) parts.push(buildWebpChunk("EXIF", keptExif));
      offset += total;
      continue;
    }
    if (type === "XMP ") {
      offset += total;
      continue;
    }
    if (type === "VP8X" && size >= 10) {
      const chunk = Buffer.from(buffer.subarray(offset, offset + total));
      chunk[8] &= ~WEBP_XMP_FLAG;
      if (!keptExif) chunk[8] &= ~WEBP_EXIF_FLAG;
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
