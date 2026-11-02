import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";

function prefersMarkdown(acceptHeader) {
  if (!acceptHeader || !acceptHeader.toLowerCase().includes("text/markdown")) return false;
  const entries = acceptHeader.split(",").map((entry) => {
    const [type, ...params] = entry.trim().split(";");
    let q = 1.0;
    for (const p of params) {
      const [k, v] = p.trim().split("=");
      if (k.toLowerCase() === "q") q = parseFloat(v) || 0;
    }
    return { type: type.trim().toLowerCase(), q };
  });

  const md = entries.find((e) => e.type === "text/markdown");
  if (!md || md.q <= 0) return false;
  const html =
    entries.find((e) => e.type === "text/html") ??
    entries.find((e) => e.type === "text/*") ??
    entries.find((e) => e.type === "*/*");
  if (!html) return true;
  return md.q > html.q;
}

export function proxy(req) {
  const hostname = req.headers.get("host")?.split(":")[0]?.toLowerCase().replace(/\.$/, "");
  const appRoot = process.env.APP_ROOT_DOMAIN?.toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const isPlatformHost =
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".vercel.app");
  const isAppHost = appRoot && (hostname === appRoot || hostname.endsWith(`.${appRoot}`));
  const isCustomHost = Boolean(appRoot) && !isPlatformHost && !isAppHost;
  const { pathname } = req.nextUrl;

  // Dedicated machine endpoints with their own route handlers
  if (
    pathname === "/agent-instructions.md" ||
    pathname === "/ai.txt" ||
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt"
  ) {
    return NextResponse.next();
  }

  // Handle .md URL requests and Accept: text/markdown content negotiation for AI agents
  const isDirectMarkdown =
    !isCustomHost && pathname.endsWith(".md") && !pathname.startsWith("/api");
  const isMarkdownNegotiated =
    !isCustomHost &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/domain") &&
    prefersMarkdown(req.headers.get("accept"));

  if (isDirectMarkdown || isMarkdownNegotiated) {
    const cleanPath = isDirectMarkdown ? pathname.replace(/\.md$/, "") : pathname;
    const target = req.nextUrl.clone();
    target.pathname = "/api/md";
    target.search = `?path=${encodeURIComponent(cleanPath || "/")}`;
    const requestHeaders = new Headers(req.headers);
    // Preserve the route path: rewritten query parameters are not available to the handler.
    requestHeaders.set("x-waitlyze-markdown-path", cleanPath || "/");
    return NextResponse.rewrite(target, { request: { headers: requestHeaders } });
  }

  // Never rewrite file requests on custom hosts - serve public/ assets and
  // robots/favicon normally instead of the /domain HTML document.
  const isFileRequest = /\.[a-z0-9]+$/i.test(pathname);
  if (
    appRoot &&
    !isPlatformHost &&
    !isAppHost &&
    !isFileRequest &&
    pathname !== "/domain" &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next/")
  ) {
    const target = req.nextUrl.clone();
    target.pathname = "/domain";
    target.search = "";
    return NextResponse.rewrite(target);
  }

  const sessionCookie = getSessionCookie(req, {
    cookiePrefix: "ba",
  });
  // Protect routes starting with /dashboard and /waitlists
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/waitlists") ||
    pathname.startsWith("/settings");

  if (pathname.startsWith("/forms") || pathname.startsWith("/api/waitlist")) {
    return NextResponse.next();
  }

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const res = NextResponse.next();
  const ip = req.headers.get("x-forwarded-for") || req.ip || req.headers.get("x-real-ip") || "::1";
  res.headers.set("x-forwarded-for", ip);

  return res;
}

export const config = {
  matcher: ["/((?!.*\\..*|_next|forms).*)", "/", "/(api|trpc)(.*)", "/((?!_next).*.md)"],
};
