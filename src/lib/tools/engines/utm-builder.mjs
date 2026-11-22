export const UTM_CHANNEL_PRESETS = Object.freeze([
  {
    id: "producthunt",
    label: "Product Hunt",
    source: "producthunt",
    medium: "launch",
    content: "launch-day",
  },
  {
    id: "hackernews",
    label: "Hacker News (Show HN)",
    source: "hackernews",
    medium: "community",
    content: "show-hn",
  },
  {
    id: "x_thread",
    label: "X / Twitter Launch Thread",
    source: "x",
    medium: "social",
    content: "launch-thread",
  },
  { id: "x_bio", label: "X / Twitter Bio", source: "x", medium: "profile", content: "founder-bio" },
  {
    id: "linkedin",
    label: "LinkedIn Post",
    source: "linkedin",
    medium: "social",
    content: "launch-post",
  },
  {
    id: "reddit",
    label: "Reddit Community",
    source: "reddit",
    medium: "community",
    content: "post",
  },
  {
    id: "newsletter",
    label: "Newsletter Sponsorship",
    source: "newsletter",
    medium: "email",
    content: "sponsor-slot",
  },
  {
    id: "partner",
    label: "Partner Co-Marketing",
    source: "partner",
    medium: "referral",
    content: "callout",
  },
  {
    id: "event_qr",
    label: "Event Booth / Slide QR",
    source: "event",
    medium: "qr",
    content: "slide-deck",
  },
]);

export function normalizeUtmSegment(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function detectPiiWarning(text) {
  const str = String(text ?? "");
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(str)) {
    return "Detected an email address in a UTM parameter. Remove PII so personal data never leaks into URLs or analytics.";
  }
  if (/\b\d{10,}\b/.test(str)) {
    return "Detected a long numeric sequence resembling a phone or account ID. Keep UTM tags strictly anonymous.";
  }
  return "";
}

export function buildUtmMatrix({
  baseUrl = "https://waitlyze.com/w/your-launch",
  campaign = "private-beta",
  contentSuffix = "",
  selectedChannelIds = ["producthunt", "hackernews", "x_thread", "linkedin", "event_qr"],
} = {}) {
  const warnings = [];
  let parsedBase;
  const trimmedUrl = String(baseUrl || "").trim() || "https://waitlyze.com/w/your-launch";

  try {
    parsedBase = new URL(trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`);
  } catch {
    parsedBase = new URL("https://waitlyze.com/w/your-launch");
    warnings.push("Base URL was invalid; showing Waitlyze example URL until corrected.");
  }

  if (parsedBase.searchParams.has("r")) {
    warnings.push(
      'Base URL contains "?r=". Waitlyze reserves ?r= for personal subscriber referral codes. Remove it from broadcast UTM links.',
    );
    parsedBase.searchParams.delete("r");
  }

  const campaignPii = detectPiiWarning(campaign);
  const suffixPii = detectPiiWarning(contentSuffix);
  if (campaignPii) {
    warnings.push(
      `${campaignPii} The campaign tag was automatically reset to "launch-waitlist" so personal data never appears in copied links, CSV exports, or QR codes.`,
    );
  }
  if (suffixPii) {
    warnings.push(
      `${suffixPii} The flagged variant suffix was stripped so personal data never appears in copied links, CSV exports, or QR codes.`,
    );
  }

  const normalizedCampaign = campaignPii
    ? "launch-waitlist"
    : normalizeUtmSegment(campaign) || "launch-waitlist";
  const normalizedSuffix = suffixPii ? "" : normalizeUtmSegment(contentSuffix);

  const selectedSet = new Set(
    Array.isArray(selectedChannelIds) && selectedChannelIds.length
      ? selectedChannelIds
      : ["producthunt", "x_thread", "linkedin"],
  );

  const rows = UTM_CHANNEL_PRESETS.filter((ch) => selectedSet.has(ch.id)).map((ch) => {
    const u = new URL(parsedBase.toString());
    const source = normalizeUtmSegment(ch.source);
    const medium = normalizeUtmSegment(ch.medium);
    const content = normalizedSuffix ? `${ch.content}-${normalizedSuffix}` : ch.content;

    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", medium);
    u.searchParams.set("utm_campaign", normalizedCampaign);
    u.searchParams.set("utm_content", content);

    return {
      id: ch.id,
      channel: ch.label,
      source,
      medium,
      campaign: normalizedCampaign,
      content,
      url: u.toString(),
    };
  });

  // Extract waitlist slug if base URL matches /w/<slug>
  const slugMatch = parsedBase.pathname.match(/^\/w\/([a-z0-9-]+)$/i);
  const detectedSlug = slugMatch ? normalizeUtmSegment(slugMatch[1]).slice(0, 48) : "";

  return {
    baseUrl: parsedBase.toString(),
    campaign: normalizedCampaign,
    detectedSlug,
    warnings,
    rows,
  };
}

// ============================================================================
// Pure-JS ISO/IEC 18004 QR Code Generator (Byte Mode, ECC Level L, Versions 1-10)
// Zero external APIs or dependencies: 100% private client-side SVG matrix.
// ============================================================================
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = Array.from({ length: poly.length + 1 }, () => 0);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const rem = Array.from({ length: ecCount }, () => 0);
  for (const b of data) {
    const factor = b ^ rem[0];
    rem.shift();
    rem.push(0);
    for (let i = 0; i < ecCount; i += 1) {
      rem[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return rem;
}

// Level L specs for versions 1..10: [totalCodewords, ecPerBlock, blocksGroup1, dataPerBlock1, blocksGroup2, dataPerBlock2, alignCoords]
const QR_VERSIONS_L = [
  null,
  { total: 26, ec: 7, b1: 1, d1: 19, b2: 0, d2: 0, align: [] },
  { total: 44, ec: 10, b1: 1, d1: 34, b2: 0, d2: 0, align: [6, 18] },
  { total: 70, ec: 15, b1: 1, d1: 55, b2: 0, d2: 0, align: [6, 22] },
  { total: 100, ec: 20, b1: 1, d1: 80, b2: 0, d2: 0, align: [6, 26] },
  { total: 134, ec: 26, b1: 1, d1: 108, b2: 0, d2: 0, align: [6, 30] },
  { total: 172, ec: 18, b1: 2, d1: 68, b2: 0, d2: 0, align: [6, 34] },
  { total: 196, ec: 20, b1: 2, d1: 78, b2: 0, d2: 0, align: [6, 22, 38] },
  { total: 242, ec: 24, b1: 2, d1: 97, b2: 0, d2: 0, align: [6, 24, 42] },
  { total: 292, ec: 30, b1: 2, d1: 116, b2: 0, d2: 0, align: [6, 26, 46] },
  { total: 346, ec: 18, b1: 2, d1: 68, b2: 2, d2: 69, align: [6, 28, 50] },
];

const QR_MAX_BYTES_V10_L = 271;

function encodeQrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(String(text || "")));
  if (bytes.length > QR_MAX_BYTES_V10_L) {
    return null;
  }
  let version = 1;
  while (version <= 10) {
    const spec = QR_VERSIONS_L[version];
    const dataCap = spec.b1 * spec.d1 + spec.b2 * spec.d2;
    const countBits = version <= 9 ? 8 : 16;
    if (4 + countBits + bytes.length * 8 <= dataCap * 8) break;
    version += 1;
  }
  if (version > 10) return null;

  const spec = QR_VERSIONS_L[version];
  const dataCap = spec.b1 * spec.d1 + spec.b2 * spec.d2;
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i -= 1) bits.push((val >> i) & 1);
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) pushBits(b, 8);
  const maxBits = dataCap * 8;
  for (let i = 0; i < 4 && bits.length < maxBits; i += 1) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j += 1) v = (v << 1) | bits[i + j];
    dataBytes.push(v);
  }
  const pads = [0xec, 0x11];
  let p = 0;
  while (dataBytes.length < dataCap) {
    dataBytes.push(pads[p % 2]);
    p += 1;
  }

  // Split blocks & compute ECC
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let i = 0; i < spec.b1; i += 1) {
    const blk = dataBytes.slice(offset, offset + spec.d1);
    offset += spec.d1;
    dataBlocks.push(blk);
    ecBlocks.push(rsEncode(blk, spec.ec));
  }
  for (let i = 0; i < spec.b2; i += 1) {
    const blk = dataBytes.slice(offset, offset + spec.d2);
    offset += spec.d2;
    dataBlocks.push(blk);
    ecBlocks.push(rsEncode(blk, spec.ec));
  }

  const codewords = [];
  const maxD = Math.max(spec.d1, spec.d2);
  for (let i = 0; i < maxD; i += 1) {
    for (const blk of dataBlocks) if (i < blk.length) codewords.push(blk[i]);
  }
  for (let i = 0; i < spec.ec; i += 1) {
    for (const ec of ecBlocks) codewords.push(ec[i]);
  }

  const size = version * 4 + 17;
  const grid = Array.from({ length: size }, () => new Int8Array(size).fill(-1));
  const reserved = Array.from({ length: size }, () => new Uint8Array(size));

  const setMod = (r, c, val, isFunc = true) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    grid[r][c] = val ? 1 : 0;
    if (isFunc) reserved[r][c] = 1;
  };

  const placeFinder = (r0, c0) => {
    for (let dr = -1; dr <= 7; dr += 1) {
      for (let dc = -1; dc <= 7; dc += 1) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (r < 0 || c < 0 || r >= size || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const dark =
          inOuter &&
          (dr === 0 ||
            dr === 6 ||
            dc === 0 ||
            dc === 6 ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        setMod(r, c, dark, true);
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i += 1) {
    setMod(6, i, i % 2 === 0, true);
    setMod(i, 6, i % 2 === 0, true);
  }

  // Alignment patterns: skip ONLY the three finder-pattern corner regions.
  // Alignment patterns that intersect timing lines (e.g. (6,22) and (22,6) on v7+) MUST be placed.
  for (const r of spec.align) {
    for (const c of spec.align) {
      const overlapsFinder =
        (r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8);
      if (overlapsFinder) continue;
      for (let dr = -2; dr <= 2; dr += 1) {
        for (let dc = -2; dc <= 2; dc += 1) {
          const dark = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
          setMod(r + dr, c + dc, dark, true);
        }
      }
    }
  }

  // Reserve format & dark module
  setMod(size - 8, 8, 1, true);
  for (let i = 0; i < 9; i += 1) {
    if (!reserved[8][i]) reserved[8][i] = 1;
    if (!reserved[i][8]) reserved[i][8] = 1;
  }
  for (let i = 0; i < 8; i += 1) {
    reserved[8][size - 1 - i] = 1;
    reserved[size - 1 - i][8] = 1;
  }
  if (version >= 7) {
    for (let i = 0; i < 6; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        reserved[i][size - 11 + j] = 1;
        reserved[size - 11 + j][i] = 1;
      }
    }
  }

  // Place data bits with mask 0: (r + c) % 2 === 0
  const allBits = [];
  for (const cw of codewords) {
    for (let b = 7; b >= 0; b -= 1) allBits.push((cw >> b) & 1);
  }
  let bitIdx = 0;
  let up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let step = 0; step < size; step += 1) {
      const r = up ? size - 1 - step : step;
      for (let dx = 0; dx < 2; dx += 1) {
        const c = col - dx;
        if (reserved[r][c]) continue;
        const rawBit = bitIdx < allBits.length ? allBits[bitIdx] : 0;
        bitIdx += 1;
        const masked = (r + c) % 2 === 0 ? rawBit ^ 1 : rawBit;
        grid[r][c] = masked;
      }
    }
    up = !up;
  }

  // Format info for ECC Level L (01) + Mask 0 (000) -> 0x77c4 (111011111000100)
  const formatBits = 0x77c4;
  for (let i = 0; i < 15; i += 1) {
    const bit = (formatBits >> i) & 1;
    // Copy 1 around top-left
    if (i < 6) grid[i][8] = bit;
    else if (i < 8) grid[i + 1][8] = bit;
    else grid[size - 15 + i][8] = bit;

    // Copy 2
    if (i < 8) grid[8][size - 1 - i] = bit;
    else if (i < 9) grid[8][15 - i] = bit;
    else grid[8][14 - i] = bit;
  }

  // Version info for versions 7..10
  const VERSION_BITS = { 7: 0x07c94, 8: 0x085bc, 9: 0x09a99, 10: 0x0a4d3 };
  if (version >= 7 && VERSION_BITS[version]) {
    const vb = VERSION_BITS[version];
    for (let i = 0; i < 18; i += 1) {
      const bit = (vb >> i) & 1;
      const r = Math.floor(i / 3);
      const c = size - 11 + (i % 3);
      grid[r][c] = bit;
      grid[c][r] = bit;
    }
  }

  return grid;
}

export function generateQrResult(text, pixelSize = 200) {
  const byteLength = new TextEncoder().encode(String(text || "")).length;
  const matrix = encodeQrMatrix(text);
  if (!matrix) {
    return {
      svg: "",
      error: `URL is ${byteLength} bytes, which exceeds the ${QR_MAX_BYTES_V10_L}-byte QR limit. Shorten the destination URL or campaign tags to generate a scannable QR without truncating your link.`,
      byteLength,
      maxBytes: QR_MAX_BYTES_V10_L,
    };
  }
  const quiet = 4;
  const total = matrix.length + quiet * 2;
  const rects = [];
  for (let r = 0; r < matrix.length; r += 1) {
    for (let c = 0; c < matrix.length; c += 1) {
      if (matrix[r][c] === 1) {
        rects.push(`<rect x="${c + quiet}" y="${r + quiet}" width="1" height="1" />`);
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${pixelSize}" height="${pixelSize}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/><g fill="#00160d">${rects.join("")}</g></svg>`;
  return { svg, error: "", byteLength, maxBytes: QR_MAX_BYTES_V10_L };
}

export function generateQrSvg(text, pixelSize = 200) {
  return generateQrResult(text, pixelSize).svg;
}
