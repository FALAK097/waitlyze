import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getWaitlistAnalytics } from "@/lib/analytics/waitlist-analytics.mjs";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { AccessError } from "@/lib/workspaces/service.mjs";

const allowedRanges = new Set([7, 30, 90]);

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await requireCampaign(id, "viewCampaign");
    const { searchParams } = new URL(request.url);
    const requestedDays = Number(searchParams.get("days") ?? 30);
    if (!allowedRanges.has(requestedDays)) {
      return NextResponse.json({ error: "Choose a 7, 30, or 90 day range." }, { status: 400 });
    }
    const timeZone = searchParams.get("timeZone") || "UTC";
    const analytics = await getWaitlistAnalytics(prisma, { waitListId: id, days: requestedDays, timeZone });
    return NextResponse.json(analytics, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof TypeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error loading waitlist analytics:", error);
    return NextResponse.json({ error: "Could not load waitlist analytics." }, { status: 500 });
  }
}
