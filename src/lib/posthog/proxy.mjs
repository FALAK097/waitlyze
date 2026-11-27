export const POSTHOG_RELAY_PREFIX = "/api/t";

const DEFAULT_INGEST_HOST = "https://us.i.posthog.com";
const DEFAULT_ASSETS_HOST = "https://us-assets.i.posthog.com";
const EU_INGEST_HOST = "https://eu.i.posthog.com";
const EU_ASSETS_HOST = "https://eu-assets.i.posthog.com";

const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "OPTIONS"]);
const STATIC_CACHE_CONTROL = "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";

function resolvePostHogUpstreams(configuredHost) {
  const normalized = String(configuredHost || "")
    .trim()
    .replace(/\/+$/, "");
  if (/^https:\/\/(eu|eu-assets)(\.i)?\.posthog\.com$/i.test(normalized)) {
    return {
      ingestHost: EU_INGEST_HOST,
      assetsHost: EU_ASSETS_HOST,
    };
  }
  if (
    normalized &&
    normalized.startsWith("https://") &&
    !/^https:\/\/(app|us|us-assets)(\.i)?\.posthog\.com$/i.test(normalized)
  ) {
    return {
      ingestHost: normalized,
      assetsHost: normalized,
    };
  }
  return {
    ingestHost: DEFAULT_INGEST_HOST,
    assetsHost: DEFAULT_ASSETS_HOST,
  };
}

export function isPostHogRelayPath(pathname) {
  return pathname === POSTHOG_RELAY_PREFIX || pathname.startsWith(`${POSTHOG_RELAY_PREFIX}/`);
}

function buildUpstreamHeaders(request, url, appRoot) {
  const headers = new Headers();
  const passthroughHeaders = [
    "accept",
    "accept-language",
    "content-encoding",
    "content-type",
    "if-none-match",
    "if-modified-since",
    "user-agent",
  ];

  for (const name of passthroughHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const clientIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
  }

  // Forward canonical Origin and Referer so PostHog's Authorized URLs check for
  // Session Replay (`recording_domains`) succeeds without leaking auth cookies.
  const canonicalOrigin = appRoot && url.hostname === appRoot ? `https://${appRoot}` : url.origin;
  headers.set("origin", request.headers.get("origin") || canonicalOrigin);
  headers.set("referer", request.headers.get("referer") || `${canonicalOrigin}/`);

  return headers;
}

function sanitizeResponseHeaders(upstreamHeaders, isStaticAsset) {
  const headers = new Headers();
  const allowedResponseHeaders = [
    "content-type",
    "content-encoding",
    "cache-control",
    "etag",
    "last-modified",
  ];

  for (const name of allowedResponseHeaders) {
    const value = upstreamHeaders.get(name);
    if (value) headers.set(name, value);
  }

  if (isStaticAsset) {
    headers.set("cache-control", STATIC_CACHE_CONTROL);
  } else if (!headers.has("cache-control")) {
    headers.set("cache-control", "no-store");
  }

  headers.set("x-content-type-options", "nosniff");
  headers.set("x-robots-tag", "noindex");
  return headers;
}

/**
 * First-party reverse proxy for PostHog analytics and Session Replay (`/api/t/*`).
 * Avoids third-party tracker blockers while stripping all application cookies
 * and authorization headers before forwarding to PostHog Cloud.
 */
export async function proxyPostHogRequest(request, { env = process.env, ctx = null } = {}) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: "GET, HEAD, POST, OPTIONS",
        "Cache-Control": "public, max-age=86400",
        "X-Robots-Tag": "noindex",
      },
    });
  }

  if (!ALLOWED_METHODS.has(request.method)) {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD, POST, OPTIONS", "X-Robots-Tag": "noindex" },
    });
  }

  const url = new URL(request.url);
  const rawSubpath = url.pathname.slice(POSTHOG_RELAY_PREFIX.length) || "/";
  const subpath = rawSubpath.startsWith("/") ? rawSubpath : `/${rawSubpath}`;

  if (subpath.includes("..") || subpath.includes("\\")) {
    return new Response("Bad request", {
      status: 400,
      headers: { "X-Robots-Tag": "noindex" },
    });
  }

  const isStaticAsset = subpath.startsWith("/static/");
  const isAssetEndpoint = isStaticAsset || subpath.startsWith("/array/");
  const configuredHost = env?.POSTHOG_HOST || env?.NEXT_PUBLIC_POSTHOG_HOST;
  const { ingestHost, assetsHost } = resolvePostHogUpstreams(configuredHost);
  const upstreamBase = isAssetEndpoint ? assetsHost : ingestHost;
  const upstreamUrl = `${upstreamBase}${subpath}${url.search}`;

  const edgeCache = typeof caches !== "undefined" ? caches.default : null;
  const cacheKey = isStaticAsset && request.method === "GET" ? new Request(upstreamUrl) : null;
  if (edgeCache && cacheKey) {
    const cached = await edgeCache.match(cacheKey);
    if (cached) return cached;
  }

  const appRoot = String(env?.APP_ROOT_DOMAIN || "waitlyze.com").toLowerCase();
  const headers = buildUpstreamHeaders(request, url, appRoot);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      redirect: "manual",
    });

    const responseHeaders = sanitizeResponseHeaders(upstreamResponse.headers, isStaticAsset);
    const response = new Response(request.method === "HEAD" ? null : upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });

    if (edgeCache && cacheKey && upstreamResponse.ok) {
      const putPromise = edgeCache.put(cacheKey, response.clone());
      if (ctx?.waitUntil) ctx.waitUntil(putPromise);
    }

    return response;
  } catch {
    return new Response(null, {
      status: 502,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  }
}
