import { NextResponse } from "next/server";

import { getRegionalPricing } from "@/lib/billing/regional-pricing.mjs";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { publicClientIdentity } from "@/lib/security/public-rate-limit.mjs";

export const runtime = "nodejs";

export async function GET(request) {
  const clientIp = publicClientIdentity(request.headers);
  try {
    const allowed = await checkRateLimit(prisma, `regional-pricing:${clientIp}`, 60, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Cache-Control": "private, no-store" } },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const country = request.headers.get("cf-ipcountry");
  const pricing = await getRegionalPricing(
    country || (process.env.NODE_ENV === "development" ? "IN" : null),
  );
  return NextResponse.json({ pricing }, { headers: { "Cache-Control": "private, no-store" } });
}
