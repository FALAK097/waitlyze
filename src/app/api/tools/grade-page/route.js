import { createHash } from "node:crypto";
import https from "node:https";
import { isIP } from "node:net";

import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { gradeWaitlistHtml } from "@/lib/tools/engines/page-grader.mjs";
import { isPublicAddress, resolvePublicTarget } from "@/lib/webhooks/security.mjs";

const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 1_572_864; // 1.5 MB hard cap
const FETCH_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;

// Derived-score-only cache (never stores raw HTML)
const scoreCache = new Map();

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of scoreCache.entries()) {
    if (entry.expiresAt <= now) scoreCache.delete(key);
  }
  while (scoreCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = scoreCache.keys().next().value;
    scoreCache.delete(oldestKey);
  }
}

function validatePublicHttpsUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.length > 2048 || rawUrl.includes("\\")) {
    throw new Error("Enter a valid public https:// URL.");
  }
  const trimmed = rawUrl.trim();
  let parsed;
  try {
    parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error("Enter a valid public https:// URL.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Only public HTTPS URLs are supported for security.");
  }
  if (parsed.username || parsed.password || (parsed.port && parsed.port !== "443")) {
    throw new Error("URLs must use standard HTTPS port 443 without embedded credentials.");
  }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    !host.includes(".")
  ) {
    throw new Error("Use a public internet domain (localhost and internal hosts are blocked).");
  }
  if (isIP(host) && !isPublicAddress(host)) {
    throw new Error("Private, loopback, and link-local IP addresses are blocked.");
  }
  parsed.hash = "";
  return parsed;
}

async function resolveAndValidateHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (!isPublicAddress(host)) {
      throw new Error("Target IP address is not publicly routable.");
    }
    return [{ address: host, family: isIP(host) }];
  }

  // Primary path: Node DNS via Waitlyze's shared security helper
  try {
    return await resolvePublicTarget(host);
  } catch (err) {
    if (err?.code === "TARGET_BLOCKED") {
      throw new Error("Target domain resolved to a private or reserved IP range.");
    }
    // Fallback for Cloudflare Workers runtime where node:dns lookup may be unavailable:
    // Verify A and AAAA answers through Cloudflare DoH before connecting.
  }

  const queries = ["A", "AAAA"].map(async (type) => {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`,
      {
        headers: { Accept: "application/dns-json" },
        signal: AbortSignal.timeout(4000),
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.Answer) ? data.Answer.map((a) => a.data).filter(Boolean) : [];
  });

  const resolvedIps = (await Promise.all(queries)).flat().filter((ip) => isIP(ip) !== 0);
  if (resolvedIps.length === 0) {
    throw new Error("Could not resolve a public DNS address for that domain.");
  }
  if (resolvedIps.some((ip) => !isPublicAddress(ip))) {
    throw new Error("Target domain resolved to a private or reserved IP range.");
  }
  return resolvedIps.map((address) => ({ address, family: isIP(address) }));
}

function fetchPinnedHttpsNode(targetUrl, addresses, headers) {
  return new Promise((resolve, reject) => {
    const chosen = addresses[0];
    const req = https.request(
      targetUrl,
      {
        method: "GET",
        servername: targetUrl.hostname,
        agent: new https.Agent({
          keepAlive: false,
          lookup: (_host, _options, callback) => callback(null, chosen.address, chosen.family),
        }),
        headers,
        timeout: FETCH_TIMEOUT_MS,
      },
      (res) => {
        const status = res.statusCode || 0;
        const location = typeof res.headers.location === "string" ? res.headers.location : "";
        const contentType = String(res.headers["content-type"] || "").toLowerCase();
        const contentLength = Number(res.headers["content-length"] || "0");

        if (status >= 300 && status < 400) {
          res.resume();
          resolve({ status, location, contentType, text: "", bytes: 0 });
          return;
        }
        if (status < 200 || status >= 300) {
          res.resume();
          reject(new Error(`Target page returned HTTP ${status}.`));
          return;
        }
        if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
          res.resume();
          reject(new Error("URL did not return an HTML page (expected text/html)."));
          return;
        }
        if (contentLength > MAX_HTML_BYTES) {
          res.resume();
          reject(new Error("Page HTML exceeds the 1.5 MB inspection limit."));
          return;
        }

        const chunks = [];
        let totalBytes = 0;
        res.on("data", (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_HTML_BYTES) {
            req.destroy(new Error("Page HTML exceeds the 1.5 MB inspection limit."));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          const text = Buffer.concat(chunks, totalBytes).toString("utf8");
          resolve({ status, location: "", contentType, text, bytes: totalBytes });
        });
        res.on("error", reject);
      },
    );
    req.on("timeout", () => {
      const err = new Error("Timed out waiting for the page to respond (8-second limit).");
      err.name = "TimeoutError";
      req.destroy(err);
    });
    req.on("error", reject);
    req.end();
  });
}

async function readBoundedText(response, maxBytes) {
  if (!response.body) {
    const text = await response.text();
    const bytes = new TextEncoder().encode(text).byteLength;
    if (bytes > maxBytes) throw new Error("Page HTML exceeds the 1.5 MB inspection limit.");
    return { text, bytes };
  }
  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new Error("Page HTML exceeds the 1.5 MB inspection limit.");
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder("utf-8", { fatal: false }).decode(merged), bytes: totalBytes };
}

async function fetchPublicHtmlSafely(initialUrl) {
  let currentUrl = validatePublicHttpsUrl(initialUrl);
  const requestHeaders = {
    "User-Agent":
      "WaitlyzePageGrader/1.0 (+https://waitlyze.com/tools/waitlist-landing-page-grader)",
    Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
  };
  const canUsePinnedNodeTransport =
    typeof process !== "undefined" &&
    Boolean(process.versions?.node) &&
    typeof https?.request === "function";

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const addresses = await resolveAndValidateHost(currentUrl.hostname);

    if (canUsePinnedNodeTransport && addresses.length > 0) {
      const pinned = await fetchPinnedHttpsNode(currentUrl, addresses, requestHeaders);
      if (pinned.status >= 300 && pinned.status < 400) {
        if (!pinned.location) {
          throw new Error("Redirect response did not include a target URL.");
        }
        if (hop === MAX_REDIRECTS) {
          throw new Error("Too many redirects (maximum 3 allowed).");
        }
        currentUrl = validatePublicHttpsUrl(new URL(pinned.location, currentUrl).toString());
        continue;
      }
      return {
        html: pinned.text,
        bytes: pinned.bytes,
        statusCode: pinned.status,
        finalUrl: currentUrl.toString(),
      };
    }

    const response = await fetch(currentUrl.toString(), {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: requestHeaders,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("Redirect response did not include a target URL.");
      }
      if (hop === MAX_REDIRECTS) {
        throw new Error("Too many redirects (maximum 3 allowed).");
      }
      currentUrl = validatePublicHttpsUrl(new URL(location, currentUrl).toString());
      continue;
    }

    if (!response.ok) {
      throw new Error(`Target page returned HTTP ${response.status}.`);
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("URL did not return an HTML page (expected text/html).");
    }

    const contentLength = Number(response.headers.get("content-length") || "0");
    if (contentLength > MAX_HTML_BYTES) {
      throw new Error("Page HTML exceeds the 1.5 MB inspection limit.");
    }

    const { text, bytes } = await readBoundedText(response, MAX_HTML_BYTES);
    return {
      html: text,
      bytes,
      statusCode: response.status,
      finalUrl: currentUrl.toString(),
    };
  }

  throw new Error("Too many redirects.");
}

export async function POST(request) {
  try {
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "local";

    let allowed = true;
    try {
      allowed = await checkRateLimit(prisma, `tool-grade:${ip}`, 20, 60 * 60 * 1000);
    } catch {
      allowed = true;
    }
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Rate limit reached (20 audits/hour). Try again shortly." },
        { status: 429, headers: { "Retry-After": "300" } },
      );
    }

    const body = await request.json();
    const mode = body?.mode === "html" ? "html" : "url";
    const launchType = typeof body?.launchType === "string" ? body.launchType : "saas";
    const goal = typeof body?.goal === "string" ? body.goal : "signups";

    if (mode === "html") {
      const html = typeof body?.html === "string" ? body.html.trim() : "";
      if (html.length < 20) {
        return NextResponse.json(
          { ok: false, error: "Paste at least 20 characters of HTML or page copy to audit." },
          { status: 400 },
        );
      }
      if (html.length > 250_000) {
        return NextResponse.json(
          { ok: false, error: "Pasted content exceeds the 250 KB limit." },
          { status: 400 },
        );
      }
      const result = gradeWaitlistHtml({
        html,
        launchType,
        goal,
        responseBytes: new TextEncoder().encode(html).byteLength,
      });
      return NextResponse.json({ ok: true, result });
    }

    const validatedUrl = validatePublicHttpsUrl(body?.url);
    const urlHash = createHash("sha256").update(validatedUrl.toString()).digest("hex");
    const cacheKey = `${urlHash}|${launchType}|${goal}`;
    pruneCache();
    const cached = scoreCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ ok: true, cached: true, result: cached.result });
    }

    const fetched = await fetchPublicHtmlSafely(validatedUrl.toString());
    const result = gradeWaitlistHtml({
      html: fetched.html,
      url: fetched.finalUrl,
      launchType,
      goal,
      responseBytes: fetched.bytes,
      statusCode: fetched.statusCode,
    });

    scoreCache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ ok: true, cached: false, result });
  } catch (error) {
    const message =
      error?.name === "TimeoutError"
        ? "Timed out waiting for the page to respond (8-second limit). Try pasting the HTML instead."
        : error?.message || "Could not audit that URL. Try the Paste HTML / Copy tab instead.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
