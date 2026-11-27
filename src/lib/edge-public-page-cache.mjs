// Only anonymous document requests for build-time public pages may share an
// edge cache entry. RSC, markdown negotiation, query variants and sessions
// must continue through the Next.js router.
const PUBLIC_DOCUMENTS = new Set([
  "/",
  "/features",
  "/about",
  "/pricing",
  "/compare",
  "/alternatives",
  "/templates",
  "/blog",
  "/tools",
  "/research/waitlist-benchmarks",
]);
const PUBLIC_PREFIXES = ["/alternatives/", "/templates/", "/blog/", "/tools/"];
const PUBLIC_CACHE_TTL_SECONDS = 24 * 60 * 60;
const PUBLIC_CLIENT_CACHE_CONTROL =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

function isPublicCacheablePath(pathname) {
  if (!pathname || pathname.endsWith(".md")) return false;
  if (PUBLIC_DOCUMENTS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function publicDocumentCacheKey(request, versionId) {
  const url = new URL(request.url);
  url.searchParams.set("__waitlyze_version", versionId || "unknown");
  return new Request(url.toString());
}

export function appendVaryAccept(headers) {
  const existing = headers.get("vary");
  if (!existing) {
    headers.set("vary", "Accept");
    return;
  }
  const tokens = existing
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!tokens.some((part) => part.toLowerCase() === "accept")) {
    tokens.push("Accept");
    headers.set("vary", tokens.join(", "));
  }
}

export function publicDocumentCacheHeaders(headers, { stored = false } = {}) {
  const result = new Headers(headers);
  appendVaryAccept(result);
  result.set(
    "cache-control",
    stored ? `public, max-age=${PUBLIC_CACHE_TTL_SECONDS}` : PUBLIC_CLIENT_CACHE_CONTROL,
  );
  return result;
}

export function isCacheablePublicDocument(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (!isPublicCacheablePath(url.pathname) || url.search) return false;
  if (request.headers.has("cookie") || request.headers.has("authorization")) return false;
  if (
    [
      "rsc",
      "next-router-state-tree",
      "next-router-prefetch",
      "next-router-segment-prefetch",
      "next-url",
    ].some((header) => request.headers.has(header))
  )
    return false;
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/markdown")) return false;
  return accept.includes("text/html") || accept.includes("*/*") || !accept;
}

export function isCacheablePublicResponse(response) {
  return (
    response.status === 200 &&
    response.headers.get("content-type")?.startsWith("text/html") &&
    !response.headers.has("set-cookie") &&
    !response.headers.get("cache-control")?.includes("private") &&
    !response.headers.get("cache-control")?.includes("no-store")
  );
}
