// OpenNext generates this entrypoint at build time.
// @ts-ignore
import nextWorker from "./.open-next/worker.js";
import {
  isCacheablePublicDocument,
  isCacheablePublicResponse,
} from "./src/lib/edge-public-page-cache.mjs";

// The OpenNext cache implementations use these durable object exports.
// @ts-ignore
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

const MACHINE_PATHS = new Set(["/agent-instructions.md", "/ai.txt", "/llms.txt", "/llms-full.txt"]);
const MARKDOWN_TYPE = "text/markdown";

function prefersMarkdown(acceptHeader) {
  if (!acceptHeader?.toLowerCase().includes(MARKDOWN_TYPE)) return false;
  const entries = acceptHeader.split(",").map((entry) => {
    const [type, ...params] = entry.trim().split(";");
    let quality = 1;
    for (const param of params) {
      const [key, value] = param.trim().split("=");
      if (key.toLowerCase() === "q") quality = Number.parseFloat(value) || 0;
    }
    return { type: type.trim().toLowerCase(), quality };
  });

  const markdown = entries.find((entry) => entry.type === MARKDOWN_TYPE);
  if (!markdown || markdown.quality <= 0) return false;
  const html =
    entries.find((entry) => entry.type === "text/html") ??
    entries.find((entry) => entry.type === "text/*") ??
    entries.find((entry) => entry.type === "*/*");
  return !html || markdown.quality > html.quality;
}

function hasSessionCookie(request) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return false;
  const names = new Set([
    "ba.session_token",
    "ba-session_token",
    "ba_session_token",
    "__Secure-ba.session_token",
    "__Secure-ba-session_token",
    "__Secure-ba_session_token",
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
  ]);
  return cookieHeader.split(";").some((cookie) => {
    const name = cookie.trim().split("=", 1)[0];
    return names.has(name);
  });
}

function getHost(request) {
  return new URL(request.url).hostname.toLowerCase().replace(/\.$/, "");
}

function isPlatformHost(hostname) {
  return (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".workers.dev")
  );
}

function rewriteRequest(request, pathname, search, extraHeaders = {}) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = search;
  const headers = new Headers(request.headers);
  for (const [name, value] of Object.entries(extraHeaders)) headers.set(name, value);
  return new Request(url, { method: request.method, headers, cf: request.cf });
}

function assetHeaders(object) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("last-modified", object.uploaded.toUTCString());
  headers.set("content-length", String(object.size));
  if (!headers.has("cache-control"))
    headers.set("cache-control", "public, max-age=300, s-maxage=300");
  headers.set("access-control-allow-origin", "*");
  headers.set("x-content-type-options", "nosniff");
  return headers;
}

async function servePublicAsset(request, bucket, ctx) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, HEAD, OPTIONS",
        "access-control-allow-headers": "If-None-Match, Range",
        "access-control-max-age": "86400",
      },
    });
  }
  if (request.method !== "GET" && request.method !== "HEAD")
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD, OPTIONS" },
    });

  let key;
  try {
    key = decodeURIComponent(new URL(request.url).pathname.slice(1));
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!key || key.includes("/") || key.includes("\\") || key === "." || key === "..")
    return new Response("Not found", { status: 404 });

  const cacheUrl = new URL(request.url);
  cacheUrl.pathname = `/${encodeURIComponent(key)}`;
  cacheUrl.search = "";
  const cacheKey = new Request(cacheUrl);
  if (request.method === "GET" && !request.headers.has("range")) {
    const cached = await caches.default.match(cacheKey);
    if (cached) {
      const ifNoneMatch = request.headers.get("if-none-match");
      if (ifNoneMatch?.split(",").some((value) => value.trim() === cached.headers.get("etag")))
        return new Response(null, { status: 304, headers: cached.headers });
      return cached;
    }
  }

  const object = await bucket.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = assetHeaders(object);
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch?.split(",").some((value) => value.trim() === object.httpEtag))
    return new Response(null, { status: 304, headers });
  const response = new Response(request.method === "HEAD" ? null : object.body, { headers });
  if (request.method === "GET" && !request.headers.has("range"))
    ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = getHost(request);
    const appRoot = String(env.APP_ROOT_DOMAIN || "waitlyze.com").toLowerCase();

    // Permanent www → apex redirect that preserves path and query, so www can
    // never serve duplicate content even if the zone-level rule is removed.
    if (hostname === `www.${appRoot}`) {
      const target = new URL(url.toString());
      target.hostname = appRoot;
      return Response.redirect(target.toString(), 301);
    }

    // Redirect any *.workers.dev subdomain access to the canonical apex domain.
    if (hostname.endsWith(".workers.dev")) {
      const target = new URL(url.toString());
      target.hostname = appRoot;
      return Response.redirect(target.toString(), 301);
    }

    // The wildcard SaaS route also receives the custom R2 hostname. Serve it
    // from the existing private bucket binding rather than forwarding it to
    // the Next.js application or exposing the bucket's S3 endpoint.
    if (hostname === `assets.${appRoot}`)
      return servePublicAsset(request, env.WAITLYZE_UPLOADS, ctx);

    const isAppHost = hostname === appRoot || hostname?.endsWith(`.${appRoot}`);
    const isCustomHost = Boolean(appRoot) && !isPlatformHost(hostname) && !isAppHost;
    const { pathname } = url;
    const isReadMethod = request.method === "GET" || request.method === "HEAD";

    if (MACHINE_PATHS.has(pathname)) return nextWorker.fetch(request, env, ctx);

    if (!isCustomHost) {
      const directMarkdown =
        isReadMethod && pathname.endsWith(".md") && !pathname.startsWith("/api");
      const negotiatedMarkdown =
        isReadMethod &&
        !pathname.startsWith("/api") &&
        !pathname.startsWith("/_next") &&
        !pathname.startsWith("/domain") &&
        prefersMarkdown(request.headers.get("accept"));
      if (directMarkdown || negotiatedMarkdown) {
        const cleanPath = directMarkdown ? pathname.replace(/\.md$/, "") : pathname;
        return nextWorker.fetch(
          rewriteRequest(request, "/api/md", `?path=${encodeURIComponent(cleanPath || "/")}`, {
            "x-waitlyze-markdown-path": cleanPath || "/",
          }),
          env,
          ctx,
        );
      }
    }

    const protectedRoute =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/waitlists") ||
      pathname.startsWith("/settings");
    if (protectedRoute && !hasSessionCookie(request))
      return Response.redirect(new URL("/", request.url), 307);

    const isFileRequest = /\.[a-z0-9]+$/i.test(pathname);
    if (
      isCustomHost &&
      isReadMethod &&
      !isFileRequest &&
      pathname !== "/domain" &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/_next/")
    ) {
      return nextWorker.fetch(rewriteRequest(request, "/domain", ""), env, ctx);
    }

    if (isCacheablePublicDocument(request)) {
      // Next's static HTML is normally read from the incremental cache on
      // every request. Keep only these anonymous documents in the Worker
      // region's cache for five minutes to avoid repeated R2/cache lookups.
      const cacheKey = new Request(request.url);
      const cached = await caches.default.match(cacheKey);
      if (cached) return cached;
      const response = await nextWorker.fetch(request, env, ctx);
      if (isCacheablePublicResponse(response)) {
        const headers = new Headers(response.headers);
        headers.set("cache-control", "public, max-age=0, s-maxage=300");
        headers.set("x-waitlyze-public-cache", "HIT");
        const toCache = new Response(response.clone().body, {
          status: response.status,
          headers,
        });
        ctx.waitUntil(caches.default.put(cacheKey, toCache));
        const originalHeaders = new Headers(response.headers);
        originalHeaders.set("x-waitlyze-public-cache", "MISS");
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: originalHeaders,
        });
      }
      return response;
    }

    return nextWorker.fetch(request, env, ctx);
  },

  // Cloudflare Email Sending lifecycle events (event subscription → queue).
  // Forward each batch to the app's internal ingestion route, which applies
  // permanent bounces and complaints to workspace suppression.
  async queue(batch, env) {
    const appRoot = String(env.APP_ROOT_DOMAIN || "waitlyze.com").toLowerCase();
    const events = [];
    for (const message of batch.messages) {
      try {
        events.push(message.body);
      } catch {
        // A malformed body must not block the rest of the batch.
      }
    }
    if (!events.length) {
      for (const message of batch.messages) message.ack();
      return;
    }
    let ok = false;
    try {
      const response = await env.WORKER_SELF_REFERENCE.fetch(
        new Request(`https://${appRoot}/api/internal/email-events`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.OUTBOX_DISPATCH_SECRET || ""}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ events }),
        }),
      );
      ok = response.ok;
      if (!ok) console.error("email-event ingestion returned", response.status);
    } catch (error) {
      console.error("email-event ingestion failed:", error?.name || error?.message || "unknown");
    }
    for (const message of batch.messages) {
      if (ok) message.ack();
      else message.retry();
    }
  },

  // Lightweight scheduled cron trigger to keep Neon DB awake and isolates warm
  scheduled(controller, env, ctx) {
    const appRoot = String(env.APP_ROOT_DOMAIN || "waitlyze.com").toLowerCase();
    const url = `https://${appRoot}/api/health`;
    ctx.waitUntil(
      (async () => {
        try {
          let response;
          if (env.WORKER_SELF_REFERENCE) {
            response = await env.WORKER_SELF_REFERENCE.fetch(
              new Request(url, {
                method: "GET",
                headers: { "x-cron-source": "cloudflare-worker-cron" },
              }),
            );
          } else {
            response = await fetch(url, {
              method: "GET",
              headers: { "x-cron-source": "cloudflare-worker-cron" },
            });
          }
          if (!response.ok) {
            console.error("Scheduled database keep-alive returned", response.status);
          }
        } catch (error) {
          console.error(
            "Scheduled keep-alive ping failed:",
            error?.name || error?.message || "unknown",
          );
        }
      })(),
    );
  },
};
