import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { getCampaignPosition } from "@/lib/campaigns/referral-position.mjs";
import { verifyCampaignSignup } from "@/lib/campaigns/signups.mjs";
import prisma from "@/lib/prisma";
import { summarizeSignupRewards } from "@/lib/referrals/rewards.mjs";

export const POST = async (req) => {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "A verification token is required." }, { status: 400 });
  }
  if (typeof body?.token !== "string") {
    return NextResponse.json({ message: "A verification token is required." }, { status: 400 });
  }
  const verified = await verifyCampaignSignup(prisma, body.token);
  if (!verified) {
    return NextResponse.json(
      { message: "This verification link is invalid, expired, or already used." },
      { status: 400 },
    );
  }
  const tokenHash = createHash("sha256").update(body.token).digest("hex");
  const verification = await prisma.signUpVerification.findUnique({
    where: { tokenHash },
    select: {
      signUp: {
        select: {
          id: true,
          referralCode: true,
          points: true,
          waitList: { select: { id: true, name: true, publicSlug: true, showReferrals: true } },
        },
      },
    },
  });
  const signUp = verification?.signUp;
  const campaign = signUp?.waitList;
  let referral = null;
  if (campaign?.showReferrals && campaign.publicSlug) {
    const [position, summary] = await Promise.all([
      getCampaignPosition(prisma, campaign.id, signUp.id),
      summarizeSignupRewards(prisma, campaign.id, {
        id: signUp.id,
        points: signUp.points ?? 0,
      }),
    ]);
    referral = {
      waitListName: campaign.name || "the waitlist",
      position,
      displayPosition: summary.displayPosition ?? position,
      points: summary.points,
      nextReward: summary.nextReward,
      unlockedRewards: summary.unlockedRewards,
      hideCounts: summary.hideCounts,
      showPoints: summary.showPoints,
      showProgress: summary.showProgress,
      path: `/w/${encodeURIComponent(campaign.publicSlug)}?r=${encodeURIComponent(signUp.referralCode)}`,
    };
  }
  return NextResponse.json({
    message: "Email verified successfully.",
    ...(referral ? { referral } : {}),
  });
};
