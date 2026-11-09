import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { recordCloudflareSendingEvent } from "@/lib/email/suppression.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_EVENTS = 100;

function authorized(request) {
  const secret = env.OUTBOX_DISPATCH_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || !/^Bearer\s+/i.test(request.headers.get("authorization") || "")) return false;
  const suppliedBytes = Buffer.from(supplied);
  const secretBytes = Buffer.from(secret);
  return suppliedBytes.length === secretBytes.length && timingSafeEqual(suppliedBytes, secretBytes);
}

/**
 * Receives Cloudflare Email Sending lifecycle events from the queue consumer
 * (workers forward them here with OUTBOX_DISPATCH_SECRET). Permanent bounces
 * and complaints are applied to workspace suppression; every other event type
 * is acknowledged without storing.
 */
export async function POST(request) {
  if (!authorized(request)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const events = Array.isArray(body?.events)
    ? body.events
    : Array.isArray(body)
      ? body
      : body
        ? [body]
        : [];
  if (!events.length || events.length > MAX_EVENTS)
    return NextResponse.json({ message: "Expected 1-100 events" }, { status: 400 });

  const counters = { recorded: 0, ignored: 0, invalid: 0, suppressed: 0 };
  for (const event of events) {
    try {
      const outcome = await recordCloudflareSendingEvent(prisma, event);
      counters[outcome] += 1;
    } catch (error) {
      if (error instanceof TypeError) {
        counters.invalid += 1;
        continue;
      }
      console.error("Cloudflare email event ingestion failed:", error);
      // Signal a retryable failure so the queue redelivers the batch.
      return NextResponse.json({ message: "Ingestion failed" }, { status: 500 });
    }
  }
  return NextResponse.json(counters);
}
