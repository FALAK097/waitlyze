import { NextResponse } from "next/server";

import { unsubscribeFromMarketing } from "@/lib/email/unsubscribe.mjs";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { publicClientIdentity } from "@/lib/security/public-rate-limit.mjs";

export async function GET(request) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token)
    return NextResponse.json({ message: "Unsubscribe link is invalid." }, { status: 400 });
  const response = NextResponse.redirect(
    new URL(`/unsubscribe/${encodeURIComponent(token)}`, request.url),
    303,
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(request) {
  try {
    const allowed = await checkRateLimit(
      prisma,
      `email-unsubscribe:${publicClientIdentity(request.headers)}`,
      60,
      60 * 60 * 1000,
    );
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "300" } },
      );
    }
  } catch {
    return NextResponse.json(
      { message: "Unsubscribe is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }
  const contentType = request.headers.get("content-type") || "";
  const form = contentType.includes("application/x-www-form-urlencoded")
    ? await request.formData()
    : null;
  const token = request.nextUrl.searchParams.get("token") || form?.get("token");
  const unsubscribed = await unsubscribeFromMarketing(prisma, token);
  if (!unsubscribed)
    return NextResponse.json({ message: "Unsubscribe link is invalid." }, { status: 400 });
  if (form?.get("List-Unsubscribe") === "One-Click") return new Response(null, { status: 204 });
  if (form) {
    return NextResponse.redirect(
      new URL(`/unsubscribe/${encodeURIComponent(token)}?done=1`, request.url),
      303,
    );
  }
  return new Response(null, { status: 204 });
}
