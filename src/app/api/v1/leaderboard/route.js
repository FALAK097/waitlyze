import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { consumePublicBudget, PublicRateLimitError } from "@/lib/security/public-rate-limit.mjs";

/**
 * Privacy-masked neighborhood view for the referral cockpit.
 * Never exposes raw emails: every address is masked server-side
 * (e.g. `b***@g***`) and only counts/positions leave this endpoint.
 */
export function maskEmail(email) {
  if (typeof email !== "string" || !email) return "***@***";
  const at = email.indexOf("@");
  const local = at > 0 ? email.slice(0, at) : email;
  const domain = at > 0 ? email.slice(at + 1) : "";
  const head = (value) => (value.length > 0 ? value[0] : "*");
  if (!domain) return `${head(local)}***@***`;
  const domainHead = domain.split(".")[0] || "*";
  return `${head(local)}***@${head(domainHead)}***`;
}

const NEIGHBOR_RADIUS = 2;

export async function GET(request) {
  try {
    const waitListId = request.nextUrl.searchParams.get("waitListId");
    const code = request.nextUrl.searchParams.get("code");
    if (typeof waitListId !== "string" || !waitListId || waitListId.length > 128)
      return NextResponse.json({ message: "A valid waitlist is required." }, { status: 400 });
    if (typeof code !== "string" || !code || code.length > 256)
      return NextResponse.json({ message: "A referral code is required." }, { status: 400 });
    await consumePublicBudget(prisma, {
      kind: "leaderboard",
      campaignId: waitListId,
      headers: request.headers,
    });
    const waitList = await prisma.waitList.findUnique({
      where: { id: waitListId },
      select: { id: true, status: true, showReferrals: true },
    });
    if (!waitList || waitList.status !== "PUBLISHED" || !waitList.showReferrals)
      return NextResponse.json({ message: "A valid waitlist is required." }, { status: 400 });
    const signup = await prisma.signUp.findFirst({
      where: {
        waitListId,
        OR: [{ referralCode: code }, { uniqueUserId: code }],
      },
      select: { id: true },
    });
    if (!signup)
      return NextResponse.json({ message: "A valid referral code is required." }, { status: 400 });

    const rows = await prisma.$queryRaw`
      WITH referral_scores AS (
        SELECT referral."referredById" AS "referrerId", COUNT(*)::bigint AS score
        FROM "referrals" AS referral
        INNER JOIN "sign_ups" AS referred
          ON referred."id" = referral."signUpId"
        INNER JOIN "sign_ups" AS referrer
          ON referrer."id" = referral."referredById"
         AND referrer."waitListId" = referred."waitListId"
        INNER JOIN "wait_lists" AS campaign
          ON campaign."id" = referred."waitListId"
         AND campaign."showReferrals" = true
        WHERE referred."waitListId" = ${waitListId}
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
        WHERE signup."waitListId" = ${waitListId}
      )
      SELECT ranked."id", ranked.score, ranked.position, ranked.total,
             target."id" AS "targetId", target.position AS "targetPosition",
             target.score AS "targetScore"
      FROM ranked
      CROSS JOIN (SELECT "id", position, score FROM ranked WHERE "id" = ${signup.id}) AS target
      WHERE ranked.position BETWEEN target.position - ${NEIGHBOR_RADIUS}
        AND target.position + ${NEIGHBOR_RADIUS}
      ORDER BY ranked.position ASC
    `;

    if (!rows.length)
      return NextResponse.json({ message: "A valid referral code is required." }, { status: 400 });

    const total = Number(rows[0].total);
    const position = Number(rows[0].targetPosition);
    const score = Number(rows[0].targetScore);
    // Emails are masked server-side; the viewer's own row is labeled "you".
    const entries = rows.map((row) => ({
      position: Number(row.position),
      maskedEmail: row.id === signup.id ? "you" : maskEmail(row.email ?? ""),
      referrals: Number(row.score),
      you: row.id === signup.id,
    }));

    const above = entries.find((entry) => entry.position === position - 1) ?? null;
    return NextResponse.json(
      {
        position,
        total: Number.isSafeInteger(total) ? total : entries.length,
        referrals: Number.isSafeInteger(score) ? score : 0,
        referralsToNext: above ? Math.max(above.referrals - score + 1, 1) : 0,
        neighbors: entries,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof PublicRateLimitError)
      return NextResponse.json(
        { message: error.message, error: error.message },
        { status: error.status, headers: { "Retry-After": error.status === 429 ? "3600" : "60" } },
      );
    console.error("Error loading leaderboard:", error);
    return NextResponse.json({ message: "Failed to load leaderboard" }, { status: 500 });
  }
}
