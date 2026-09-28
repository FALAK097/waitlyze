import prisma from "@/lib/prisma";
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
  return NextResponse.json({ message: "Email verified successfully." });
};
