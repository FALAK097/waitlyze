import prisma from "@/lib/prisma";
import { createHash } from "node:crypto";
import { getCampaignPosition } from "@/lib/campaigns/referral-position.mjs";
import { verifyCampaignSignup } from "@/lib/campaigns/signups.mjs";
import { NextResponse } from "next/server";

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
    return NextResponse.json({ message: "This verification link is invalid, expired, or already used." }, { status: 400 });
  }
  const tokenHash = createHash("sha256").update(body.token).digest("hex");
  const verification = await prisma.signUpVerification.findUnique({
    where: { tokenHash },
    select: { signUp: { select: { id: true, referralCode: true, waitList: { select: { id: true, name: true, publicSlug: true, showReferrals: true } } } } },
  });
  const signUp = verification?.signUp;
  const campaign = signUp?.waitList;
  const referral = campaign?.showReferrals && campaign.publicSlug
    ? {
        waitListName: campaign.name || "the waitlist",
        position: await getCampaignPosition(prisma, campaign.id, signUp.id),
        path: `/w/${encodeURIComponent(campaign.publicSlug)}?r=${encodeURIComponent(signUp.referralCode)}`,
      }
    : null;
  return NextResponse.json({ message: "Email verified successfully.", ...(referral ? { referral } : {}) });
};
