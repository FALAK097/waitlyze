import { NextResponse } from "next/server";

import {
  findUnsubscribeSignup,
  hashUnsubscribeToken,
  unsubscribeFromMarketing,
} from "@/lib/email/unsubscribe.mjs";
import prisma from "@/lib/prisma";
import { checkRateLimit, isRateLimitExceeded } from "@/lib/rate-limit";
import { publicClientIdentity } from "@/lib/security/public-rate-limit.mjs";

const INVALID_ATTEMPT_LIMIT = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const invalidAttemptKey = (request) =>
  `email-unsubscribe-invalid:${publicClientIdentity(request.headers)}`;

async function consumeInvalidAttempt(request) {
  return checkRateLimit(
    prisma,
    invalidAttemptKey(request),
    INVALID_ATTEMPT_LIMIT,
    RATE_LIMIT_WINDOW_MS,
  );
}

const tooManyRequests = () =>
  NextResponse.json(
    { message: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": "300" } },
  );

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
  const contentType = request.headers.get("content-type") || "";
  const form = contentType.includes("application/x-www-form-urlencoded")
    ? await request.formData()
    : null;
  const rawToken = request.nextUrl.searchParams.get("token") || form?.get("token");
  const token = typeof rawToken === "string" ? rawToken : "";
  if (token.length < 32 || token.length > 128) {
    try {
      if (!(await consumeInvalidAttempt(request))) return tooManyRequests();
    } catch {
      return NextResponse.json(
        { message: "Unsubscribe is temporarily unavailable. Please try again shortly." },
        { status: 503 },
      );
    }
    return NextResponse.json({ message: "Unsubscribe link is invalid." }, { status: 400 });
  }

  try {
    if (
      await isRateLimitExceeded(
        prisma,
        invalidAttemptKey(request),
        INVALID_ATTEMPT_LIMIT,
        RATE_LIMIT_WINDOW_MS,
      )
    )
      return tooManyRequests();

    const signup = await findUnsubscribeSignup(prisma, token);
    if (!signup) {
      if (!(await consumeInvalidAttempt(request))) return tooManyRequests();
      return NextResponse.json({ message: "Unsubscribe link is invalid." }, { status: 400 });
    }

    const allowed = await checkRateLimit(
      prisma,
      `email-unsubscribe:${hashUnsubscribeToken(token)}`,
      10,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!allowed) return tooManyRequests();

    const unsubscribed = await unsubscribeFromMarketing(prisma, token, { signup });
    if (!unsubscribed)
      return NextResponse.json({ message: "Unsubscribe link is invalid." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { message: "Unsubscribe is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }
  if (form?.get("List-Unsubscribe") === "One-Click") return new Response(null, { status: 204 });
  if (form) {
    return NextResponse.redirect(
      new URL(`/unsubscribe/${encodeURIComponent(token)}?done=1`, request.url),
      303,
    );
  }
  return new Response(null, { status: 204 });
}
