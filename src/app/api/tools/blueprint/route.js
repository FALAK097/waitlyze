import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { POSTHOG_EVENTS } from "@/lib/posthog/events.mjs";
import { trackServerEvent } from "@/lib/posthog/server.mjs";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { publicClientIdentity } from "@/lib/security/public-rate-limit.mjs";
import {
  BLUEPRINT_COOKIE_NAME,
  BLUEPRINT_TTL_MS,
  createToolBlueprint,
  signBlueprintCookieValue,
  verifyBlueprintCookieValue,
} from "@/lib/tools/blueprint.mjs";
import { getToolBySlug } from "@/lib/tools/registry.mjs";

function clientIpKey(request, action = "create") {
  return `tool-blueprint:${action}:${publicClientIdentity(request.headers)}`;
}

export async function POST(request) {
  try {
    let allowed;
    try {
      allowed = await checkRateLimit(prisma, clientIpKey(request, "create"), 40, 60 * 60 * 1000);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Blueprint saves are temporarily unavailable. Please try again." },
        { status: 503, headers: { "Retry-After": "60" } },
      );
    }

    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many blueprint saves. Please try again shortly." },
        { status: 429, headers: { "Retry-After": "600" } },
      );
    }

    const body = await request.json();
    if (!body?.toolSlug || !getToolBySlug(body.toolSlug)) {
      return NextResponse.json({ ok: false, error: "Unknown Launch Lab tool." }, { status: 400 });
    }

    const record = await createToolBlueprint(prisma, body);
    const nextUrl = `/waitlists/new?blueprint=${encodeURIComponent(record.id)}`;
    const signedCookie = signBlueprintCookieValue(record.id, record.toolSlug);

    // Fire safe server-side event without raw user text
    try {
      await trackServerEvent({
        distinctId: `blueprint:${record.id}`,
        event: POSTHOG_EVENTS.TOOL_BLUEPRINT_CREATED,
        properties: {
          tool_slug: record.toolSlug,
          template_id: body.templateId || "simple",
          blueprint_id: record.id,
        },
      });
    } catch {
      // Analytics must never block conversion
    }

    const response = NextResponse.json({
      ok: true,
      id: record.id,
      toolSlug: record.toolSlug,
      expiresAt: record.expiresAt,
      nextUrl,
    });

    response.cookies.set(BLUEPRINT_COOKIE_NAME, signedCookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.floor(BLUEPRINT_TTL_MS / 1000),
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.issues[0]?.message || "Invalid tool blueprint payload.",
        },
        { status: 400 },
      );
    }
    console.error("Blueprint creation error:", error?.code || error?.name || "unknown");
    return NextResponse.json(
      { ok: false, error: "Could not save your tool blueprint. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    let allowed;
    try {
      allowed = await checkRateLimit(prisma, clientIpKey(request, "delete"), 40, 60 * 60 * 1000);
    } catch {
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    if (!allowed) {
      return NextResponse.json({ ok: false }, { status: 429, headers: { "Retry-After": "600" } });
    }
    const url = new URL(request.url);
    const requestedId = url.searchParams.get("id");
    const cookieVal = request.cookies.get(BLUEPRINT_COOKIE_NAME)?.value;
    const verified = verifyBlueprintCookieValue(cookieVal);

    if (requestedId && verified?.id === requestedId) {
      await prisma.toolBlueprint
        .deleteMany({
          where: { id: requestedId, claimedWaitlistId: null },
        })
        .catch(() => {});
      const response = NextResponse.json({ ok: true });
      response.cookies.set(BLUEPRINT_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const response = NextResponse.json({ ok: false }, { status: 409 });
    return response;
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
