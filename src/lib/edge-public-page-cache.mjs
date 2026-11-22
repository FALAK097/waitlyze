// Only anonymous document requests for build-time public pages may share an
// edge cache entry. RSC, markdown negotiation, query variants and sessions
// must continue through the Next.js router.
const PUBLIC_DOCUMENTS = new Set(["/", "/templates", "/blog", "/tools"]);
const PUBLIC_CACHE_TTL_SECONDS = 24 * 60 * 60;
const PUBLIC_CLIENT_CACHE_CONTROL = "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

export function publicDocumentCacheKey(request, versionId) {
  const url = new URL(request.url);
  url.searchParams.set("__waitlyze_version", versionId || "unknown");
  return new Request(url.toString());
}

export function publicDocumentCacheHeaders(headers, { stored = false } = {}) {
  const result = new Headers(headers);
  result.set(
    "cache-control",
    stored ? `public, max-age=${PUBLIC_CACHE_TTL_SECONDS}` : PUBLIC_CLIENT_CACHE_CONTROL,
  );
  return result;
}

export function isCacheablePublicDocument(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (!PUBLIC_DOCUMENTS.has(url.pathname) || url.search) return false;
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
