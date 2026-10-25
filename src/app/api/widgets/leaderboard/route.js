import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { consumePublicBudget, PublicRateLimitError } from "@/lib/security/public-rate-limit.mjs";
import { maskEmail } from "@/lib/widgets/mask.mjs";

import {
  WIDGET_CACHE_HEADERS,
  htmlResponse,
  joinUrlFor,
  leaderboardHtml,
  widgetRateLimitResponse,
} from "../_shared.mjs";

// Standalone embeddable leaderboard: top referrers for any published
// waitlist with referrals on. Masked emails only — raw addresses never leave
// this endpoint. Serve as JSON (`?format=json`, default) or as an embeddable
// HTML snippet (`?format=html`, iframe it anywhere).
//
//   <iframe src="https://YOUR_HOST/api/widgets/leaderboard?waitlistId=ID&format=html&limit=10"
//           width="100%" height="420" style="border:0" loading="lazy"
//           title="Waitlist leaderboard"></iframe>
export async function GET(request) {
  try {
    const params = request.nextUrl.searchParams;
    const waitlistId = params.get("waitlistId");
    const format = (params.get("format") || "json").toLowerCase();
    const limit = Math.min(Math.max(Number.parseInt(params.get("limit") || "10", 10) || 10, 1), 50);
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
      select: { id: true, name: true, status: true, showReferrals: true, publicSlug: true },
    });
    if (!waitList || waitList.status !== "PUBLISHED" || !waitList.showReferrals)
      return NextResponse.json({ message: "Leaderboard not found." }, { status: 404 });

    // Verified-only scoring, same rules as the cockpit position query.
    const rows = await prisma.$queryRaw`
      WITH referral_scores AS (
        SELECT referral."referredById" AS "referrerId", COUNT(*)::bigint AS score
        FROM "referrals" AS referral
        INNER JOIN "sign_ups" AS referred
          ON referred."id" = referral."signUpId"
        INNER JOIN "sign_ups" AS referrer
          ON referrer."id" = referral."referredById"
         AND referrer."waitListId" = referred."waitListId"
        WHERE referred."waitListId" = ${waitlistId}
          AND referred."verifiedAt" IS NOT NULL
          AND referrer."verifiedAt" IS NOT NULL
          AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
          AND referral."referredById" IS NOT NULL
          AND referral."referredById" <> referral."signUpId"
        GROUP BY referral."referredById"
      ), ranked AS (
        SELECT signup."id", signup."email", COALESCE(score.score, 0)::bigint AS score,
          ROW_NUMBER() OVER (
            ORDER BY COALESCE(score.score, 0) DESC, signup."createdAt" ASC, signup."id" ASC
          ) AS position,
          COUNT(*) OVER () AS total
        FROM "sign_ups" AS signup
        LEFT JOIN referral_scores AS score ON score."referrerId" = signup."id"
        WHERE signup."waitListId" = ${waitlistId}
      )
      SELECT "id", "email", score, position, total FROM ranked
      WHERE position <= ${limit}
      ORDER BY position ASC
    `;

    const total = rows.length ? Number(rows[0].total) : 0;
    const entries = rows.map((row) => ({
      position: Number(row.position),
      maskedEmail: maskEmail(row.email ?? ""),
      referrals: Number(row.score),
    }));
    const name = waitList.name || "Waitlist";

    if (format === "html")
      return htmlResponse(
        leaderboardHtml({ name, total, entries, joinUrl: joinUrlFor(waitList.publicSlug) }),
      );
    return NextResponse.json({ total, entries }, { headers: WIDGET_CACHE_HEADERS });
  } catch (error) {
    if (error instanceof PublicRateLimitError) return widgetRateLimitResponse(error);
    console.error("Error loading leaderboard widget:", error);
    return NextResponse.json({ message: "Failed to load leaderboard" }, { status: 500 });
  }
}
