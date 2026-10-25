import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import {
  FOLLOW_NETWORKS,
  awardPoints,
  followEventKey,
  isFarmSuspect,
} from "@/lib/referrals/points.mjs";
import { getPublishedRewards } from "@/lib/referrals/rewards.mjs";
import { consumePublicBudget, PublicRateLimitError } from "@/lib/security/public-rate-limit.mjs";

// Self-reported social-follow claims. The cockpit follow buttons post here
// after the visitor opens the founder's profile; the award is idempotent
// (one payout per signup per network via the ledger event key) and lands in
// the same transaction as the balance bump.
//
// Only verified signups earn: pending and farm-suspect signups get a success
// response with awarded:false so the UI stays quiet without leaking why.
export async function POST(request) {
  try {
    const body = await request.json();
    if (typeof body?.waitListId !== "string" || !body.waitListId || body.waitListId.length > 128)
      return NextResponse.json({ message: "A valid waitlist is required." }, { status: 400 });
    if (typeof body?.code !== "string" || !body.code || body.code.length > 256)
      return NextResponse.json({ message: "A referral code is required." }, { status: 400 });
    if (typeof body?.network !== "string" || !FOLLOW_NETWORKS.includes(body.network))
      return NextResponse.json(
        { message: `Network must be one of: ${FOLLOW_NETWORKS.join(", ")}.` },
        { status: 400 },
      );
    await consumePublicBudget(prisma, {
      kind: "follow",
      campaignId: body.waitListId,
      headers: request.headers,
    });
    const signup = await prisma.signUp.findFirst({
      where: {
        waitListId: body.waitListId,
        OR: [{ referralCode: body.code }, { uniqueUserId: body.code }],
      },
      select: { id: true, waitListId: true, verifiedAt: true, ipAddress: true, points: true },
    });
    if (!signup)
      return NextResponse.json({ message: "A valid referral code is required." }, { status: 400 });
    if (!signup.verifiedAt)
      return NextResponse.json(
        { awarded: false, message: "Verify your email before earning follow points." },
        { status: 403 },
      );
    // Once founders configure follow links (Phase-3 cockpit), only the
    // configured networks pay out. Pre-config, any supported network pays so
    // points work out of the box. Reads the raw published snapshot so this
    // keeps working before the snapshot schema knows the key.
    const { rewards } = await getPublishedRewards(prisma, body.waitListId);
    const configured = await configuredFollowNetworks(prisma, body.waitListId);
    if (configured && !configured.includes(body.network))
      return NextResponse.json(
        { message: "This waitlist doesn't offer that follow task." },
        { status: 400 },
      );
    const result = await prisma.$transaction(async (tx) => {
      if (await isFarmSuspect(tx, signup.ipAddress)) return { awarded: false };
      const award = await awardPoints(tx, {
        waitListId: signup.waitListId,
        signUpId: signup.id,
        kind: "SOCIAL_FOLLOW",
        points: rewards.pointsFollow,
        eventKey: followEventKey(signup.id, body.network),
      });
      const current = await tx.signUp.findUnique({
        where: { id: signup.id },
        select: { points: true },
      });
      return { awarded: award.awarded, balance: current?.points ?? signup.points };
    });
    return NextResponse.json({
      awarded: result.awarded,
      network: body.network,
      points: result.awarded ? rewards.pointsFollow : 0,
      balance: result.balance,
    });
  } catch (error) {
    if (error instanceof PublicRateLimitError)
      return NextResponse.json(
        { message: error.message, error: error.message },
        { status: error.status, headers: { "Retry-After": error.status === 429 ? "3600" : "60" } },
      );
    console.error("Error claiming follow points:", error);
    return NextResponse.json({ message: "Failed to claim follow points" }, { status: 500 });
  }
}

// Returns the founder-configured follow networks, an empty array when the
// published page configures none, or null when the key predates this
// checkout (zero-config mode: any supported network pays out).
async function configuredFollowNetworks(db, waitListId) {
  try {
    const waitList = await db.waitList.findUnique({
      where: { id: waitListId },
      select: { publishedRevision: true },
    });
    if (!waitList?.publishedRevision) return null;
    const publication = await db.waitListPublicationRevision.findUnique({
      where: {
        waitListId_revision: { waitListId, revision: waitList.publishedRevision },
      },
      select: { snapshot: true },
    });
    const follows = publication?.snapshot?.statusPage?.socialFollows;
    if (follows === undefined) return null;
    if (!Array.isArray(follows)) return [];
    return follows
      .filter((entry) => entry && FOLLOW_NETWORKS.includes(entry.network))
      .map((entry) => entry.network);
  } catch {
    return null;
  }
}
