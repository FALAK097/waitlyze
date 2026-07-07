import { NextResponse } from "next/server";
import { validateApiKeyAndGetWaitlist } from "@/utils/api-key-auth";
import { getDeviceInfo } from "@/utils/server/device";
import { getGeoInfo, getIpAddress, getTimeZone } from "@/utils/server/geo";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { apiKey, waitlistId, email } = body;

    if (!apiKey || !waitlistId || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "apiKey, waitlistId, and email are required",
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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

    const existingSignUp = await prisma.signUp.findFirst({
      where: {
        email,
        waitListId: waitlistId,
      },
    });

    if (existingSignUp) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already registered for this waitlist",
          data: {
            rank: existingSignUp.rank,
            signupDate: existingSignUp.createdAt,
          },
        },
        { status: 409 }
      );
    }

    const { device, deviceType } = await getDeviceInfo();
    const ip = getIpAddress(request);
    const geo = getGeoInfo(request);

    let signupData = {
      uniqueUserId: crypto.randomUUID(),
      email,
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

    const signupCount = await prisma.signUp.count({
      where: { waitListId: waitlistId },
    });

    signupData.rank = signupCount + 1;

    const signUp = await prisma.signUp.create({
      data: signupData,
    });

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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
