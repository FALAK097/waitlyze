import { NextResponse } from "next/server";

import { getRegionalPricing } from "@/lib/billing/regional-pricing.mjs";

export const runtime = "nodejs";

export async function GET(request) {
  const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry");
  const pricing = await getRegionalPricing(
    country || (process.env.NODE_ENV === "development" ? "IN" : null),
  );
  return NextResponse.json({ pricing }, { headers: { "Cache-Control": "private, no-store" } });
}
