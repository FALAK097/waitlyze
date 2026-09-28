import { NextResponse } from "next/server";
import { validateApiKeyAndGetWaitlist } from "@/utils/api-key-auth";
import { getDeviceInfo } from "@/utils/server/device";
import { getGeoInfo, getIpAddress, getTimeZone } from "@/utils/server/geo";
import prisma from "@/lib/prisma";
import { createSignUp } from "@/services/sign-up";
import { DuplicateSignupError, InvalidCampaignError } from "@/lib/campaigns/signups.mjs";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
    const { apiKey, waitlistId, email, referralCode } = body;

    if (!apiKey || !waitlistId || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "apiKey, waitlistId, and email are required",
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 }
      );
    }

    const auth = await validateApiKeyAndGetWaitlist(apiKey, waitlistId);
    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        { status: 401 }
      );
    }

    const { device, deviceType } = await getDeviceInfo();
    const ip = getIpAddress(request);
    const geo = getGeoInfo(request);

    let signupData = {
      uniqueUserId: crypto.randomUUID(),
      email: email.trim(),
      device,
      deviceType,
      waitListId: waitlistId,
      ipAddress: ip,
    };

    if (geo && (geo.city || geo.country || geo.timezone)) {
      const timezone = getTimeZone(
        geo.city,
        geo.country,
        geo.timezone
      );
      signupData = {
        ...signupData,
        city: geo.city,
        country: geo.country,
        latitude: geo.latitude?.toString(),
        longitude: geo.longitude?.toString(),
        timezone,
      };
    }

    const signUp = await createSignUp(signupData, referralCode);

    await prisma.impression.create({
      data: {
        uniqueUserId: signUp.uniqueUserId,
        device,
        deviceType,
        waitListId: waitlistId,
        ipAddress: ip,
        city: signupData.city,
        country: signupData.country,
        latitude: signupData.latitude,
        longitude: signupData.longitude,
        timezone: signupData.timezone,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined the waitlist!",
      data: {
        rank: signUp.rank,
      },
    });
  } catch (error) {
    if (error instanceof DuplicateSignupError) {
      const existing = await prisma.signUp.findUnique({
        where: { waitListId_emailNormalized: { waitListId: body.waitlistId, emailNormalized: body.email.trim().toLowerCase() } },
        select: { rank: true, createdAt: true },
      });
      return NextResponse.json({
        success: false,
        error: "Email already registered for this waitlist",
        data: { rank: existing?.rank, signupDate: existing?.createdAt },
      }, { status: 409 });
    }
    if (error instanceof InvalidCampaignError) {
      return NextResponse.json({ success: false, error: "This waitlist is not accepting signups" }, { status: 409 });
    }
    if (error instanceof TypeError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("Waitlist API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
