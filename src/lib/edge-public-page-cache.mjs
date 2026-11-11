// Only anonymous document requests for build-time public pages may share an
// edge cache entry. RSC, markdown negotiation, query variants and sessions
// must continue through the Next.js router.
const PUBLIC_DOCUMENTS = new Set(["/", "/templates", "/blog"]);

export function isCacheablePublicDocument(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (!PUBLIC_DOCUMENTS.has(url.pathname) || url.search) return false;
  if (request.headers.has("cookie") || request.headers.has("authorization")) return false;
  if (request.headers.has("rsc") || request.headers.has("next-router-state-tree")) return false;
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
