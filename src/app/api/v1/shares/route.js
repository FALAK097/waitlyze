import prisma from "@/lib/prisma";
import { consumePublicBudget, PublicRateLimitError } from "@/lib/security/public-rate-limit.mjs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    if (typeof body?.waitListId !== "string" || !body.waitListId || body.waitListId.length > 128) return NextResponse.json({ message: "A valid waitlist is required." }, { status: 400 });
    if (typeof body?.code !== "string" || !body.code || body.code.length > 256) return NextResponse.json({ message: "A referral code is required." }, { status: 400 });
    await consumePublicBudget(prisma, { kind: "share", campaignId: body.waitListId, headers: request.headers });
    const waitList = await prisma.waitList.findUnique({ where: { id: body.waitListId }, select: { id: true } });
    if (!waitList) return NextResponse.json({ message: "A valid waitlist is required." }, { status: 400 });
    const share = await prisma.shareEvent.create({ data: { waitListId: body.waitListId, code: body.code } });
    return NextResponse.json({ id: share.id });
  } catch (error) {
    if (error instanceof PublicRateLimitError) return NextResponse.json({ message: error.message, error: error.message }, { status: error.status, headers: { "Retry-After": error.status === 429 ? "3600" : "60" } });
    console.error("Error creating share event:", error);
    return NextResponse.json({ message: "Failed to record share" }, { status: 500 });
  }
}
