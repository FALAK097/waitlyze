import { NextResponse } from "next/server";

import { escapeHtml } from "@/lib/widgets/mask.mjs";

// Short CDN-friendly cache: widgets are polled by third-party pages, so edge
// hits absorb embed traffic while staying within a minute of fresh.
export const WIDGET_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export function widgetRateLimitResponse(error) {
  return NextResponse.json(
    { message: error.message, error: error.message },
    { status: error.status, headers: { "Retry-After": error.status === 429 ? "3600" : "60" } },
  );
}

const SHELL = (title, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#111827;background:transparent}
.waitlyze-widget{max-width:420px;margin:0 auto;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff}
.waitlyze-widget h2{margin:0 0 4px;font-size:15px}
.waitlyze-widget p.sub{margin:0 0 12px;font-size:13px;color:#6b7280}
.waitlyze-widget ol{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.waitlyze-widget li{display:flex;align-items:center;gap:10px;font-size:14px}
.waitlyze-widget .pos{flex-shrink:0;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:9999px;background:#f3f4f6;font-weight:700;font-size:12px}
.waitlyze-widget .email{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.waitlyze-widget .refs{margin-left:auto;flex-shrink:0;font-size:12px;color:#6b7280}
.waitlyze-widget .counter{font-size:32px;font-weight:800;letter-spacing:-0.02em}
.waitlyze-widget a.join{display:inline-block;margin-top:12px;font-size:13px;font-weight:600;color:#fff;background:#ff6b4a;border-radius:8px;padding:8px 14px;text-decoration:none}
</style>
</head>
<body>
<div class="waitlyze-widget">
${body}
</div>
</body>
</html>`;

export function leaderboardHtml({ name, total, entries, joinUrl }) {
  const rows = entries
    .map(
      (entry) =>
        `<li><span class="pos">${entry.position}</span><span class="email">${escapeHtml(entry.maskedEmail)}</span><span class="refs">${entry.referrals} referral${entry.referrals === 1 ? "" : "s"}</span></li>`,
    )
    .join("");
  return SHELL(
    `${name} leaderboard`,
    `<h2>${escapeHtml(name)} leaderboard</h2>` +
      `<p class="sub">${total.toLocaleString("en-US")} waiting</p>` +
      `<ol>${rows}</ol>` +
      (joinUrl ? `<a class="join" href="${escapeHtml(joinUrl)}">Join the waitlist</a>` : ""),
  );
}

export function counterHtml({ name, total, joinUrl }) {
  return SHELL(
    `${name} waitlist counter`,
    `<div class="counter">${total.toLocaleString("en-US")}</div>` +
      `<p class="sub">waiting${name ? ` for ${escapeHtml(name)}` : ""}</p>` +
      (joinUrl ? `<a class="join" href="${escapeHtml(joinUrl)}">Join the waitlist</a>` : ""),
  );
}

export function htmlResponse(html) {
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", ...WIDGET_CACHE_HEADERS },
  });
}

export function joinUrlFor(publicSlug) {
  const base = String(process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");
  if (!base || !publicSlug) return null;
  return `${base}/w/${encodeURIComponent(publicSlug)}`;
}
