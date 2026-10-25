import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { consumePublicBudget, PublicRateLimitError } from "@/lib/security/public-rate-limit.mjs";

import {
  WIDGET_CACHE_HEADERS,
  counterHtml,
  htmlResponse,
  joinUrlFor,
  widgetRateLimitResponse,
} from "../_shared.mjs";

// Live counter widget ("2,418 waiting") for any published waitlist. JSON by
// default, embeddable HTML with ?format=html:
//
//   <iframe src="https://YOUR_HOST/api/widgets/counter?waitlistId=ID&format=html"
//           width="100%" height="180" style="border:0" loading="lazy"
//           title="Waitlist counter"></iframe>
export async function GET(request) {
  try {
    const params = request.nextUrl.searchParams;
    const waitlistId = params.get("waitlistId");
    const format = (params.get("format") || "json").toLowerCase();
    if (typeof waitlistId !== "string" || !waitlistId || waitlistId.length > 128)
      return NextResponse.json({ message: "A valid waitlist is required." }, { status: 400 });
    if (format !== "json" && format !== "html")
      return NextResponse.json({ message: "format must be json or html." }, { status: 400 });

    await consumePublicBudget(prisma, {
      kind: "widget",
      campaignId: waitlistId,
      headers: request.headers,
    });

    const waitList = await prisma.waitList.findUnique({
      where: { id: waitlistId },
      select: { id: true, name: true, status: true, publicSlug: true },
    });
    if (!waitList || waitList.status !== "PUBLISHED")
      return NextResponse.json({ message: "Counter not found." }, { status: 404 });

    const total = await prisma.signUp.count({ where: { waitListId: waitlistId } });
    const name = waitList.name || "Waitlist";

    if (format === "html")
      return htmlResponse(counterHtml({ name, total, joinUrl: joinUrlFor(waitList.publicSlug) }));
    return NextResponse.json({ total }, { headers: WIDGET_CACHE_HEADERS });
  } catch (error) {
    if (error instanceof PublicRateLimitError) return widgetRateLimitResponse(error);
    console.error("Error loading counter widget:", error);
    return NextResponse.json({ message: "Failed to load counter" }, { status: 500 });
  }
}
