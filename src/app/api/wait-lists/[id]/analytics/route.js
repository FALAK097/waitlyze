import { NextResponse } from "next/server";

import { getWaitlistAnalytics } from "@/lib/analytics/waitlist-analytics.mjs";
import {
  FREE_HISTORY_DAYS,
  MAX_HISTORY_DAYS,
  historyWindowMessage,
  resolveHistoryWindow,
} from "@/lib/billing/workspace-plan.mjs";
import prisma from "@/lib/prisma";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { AccessError } from "@/lib/workspaces/service.mjs";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { campaign } = await requireCampaign(id, "viewCampaign");
    const { searchParams } = new URL(request.url);
    const requestedDays = Number(searchParams.get("days") ?? 30);
    if (!Number.isInteger(requestedDays) || requestedDays < 1 || requestedDays > MAX_HISTORY_DAYS) {
      return NextResponse.json(
        { error: `Choose a date range from 1 to ${MAX_HISTORY_DAYS} days.` },
        { status: 400 },
      );
    }
    const endDate = searchParams.get("endDate");
    if (
      endDate &&
      (!datePattern.test(endDate) ||
        Number.isNaN(Date.parse(`${endDate}T00:00:00Z`)) ||
        new Date(`${endDate}T00:00:00Z`).toISOString().slice(0, 10) !== endDate)
    ) {
      return NextResponse.json({ error: "Choose a valid end date." }, { status: 400 });
    }
    // Plan gating, server-side: free workspaces are capped at FREE_HISTORY_DAYS
    // no matter what the client requests. The window rides along so the UI can
    // message it honestly.
    const workspace = campaign.workspaceId
      ? await prisma.workspace.findUnique({
          where: { id: campaign.workspaceId },
          select: { plan: true },
        })
      : null;
    const window = resolveHistoryWindow({ plan: workspace?.plan, requestedDays });
    const timeZone = searchParams.get("timeZone") || "UTC";
    const analytics = await getWaitlistAnalytics(prisma, {
      waitListId: id,
      days: window.days,
      endDate,
      timeZone,
      maxDays: MAX_HISTORY_DAYS,
    });
    return NextResponse.json(
      {
        ...analytics,
        historyWindow: {
          ...window,
          message: historyWindowMessage(window),
          freeWindowDays: FREE_HISTORY_DAYS,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
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
