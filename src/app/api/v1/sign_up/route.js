import prisma from "@/lib/prisma";
import { createSignUp } from "@/services/sign-up";
import { getDeviceInfo } from "@/utils/server/device";
import { getGeoInfo, getIpAddress, getTimeZone } from "@/utils/server/geo";
import { validateRequest } from "@/utils/server/validations/sign-up";
import { NextResponse } from "next/server";

export const GET = async (req) => {
  const signUpId = req.nextUrl.searchParams.get("signUpId");
  if (!signUpId) {
    return NextResponse.json(
      { message: "Sign up ID is required" },
      { status: 400 }
    );
  }

  const signUp = await prisma.signUp.findUnique({ where: { id: signUpId, waitList: { status: "PUBLISHED" } } });

  if (!signUp) {
    return NextResponse.json({ message: "Sign up not found" }, { status: 404 });
  }

  return NextResponse.json({ signUp });
};

export const POST = async (req) => {
  try {
    const body = await req.json();
    const validator = await validateRequest(body);
    if (validator) return validator;

    const { device, deviceType } = await getDeviceInfo();
    const ip = getIpAddress(req);
    const geo = getGeoInfo(req);

    const hypeSession = body.hypeSession;

    if (!hypeSession) {
      return NextResponse.json(
        { message: "Unique User ID is required" },
        { status: 400 }
      );
    }

    const impression = await prisma.impression.findFirst({
      where: {
        waitListId: body.waitListId,
        uniqueUserId: hypeSession,
      },
    });

    let data = {
      uniqueUserId: hypeSession,
      email: body.email,
      device,
      deviceType,
      waitListId: body.waitListId,
      ipAddress: ip,
      impressionId: impression?.id,
    };

    if (geo && (geo.city || geo.country || geo.timezone)) {
      const timezone = getTimeZone(
        geo.city,
        geo.country,
        geo.timezone
      );
      data = {
        ...data,
        city: geo.city,
        country: geo.country,
        latitude: geo.latitude?.toString(),
        longitude: geo.longitude?.toString(),
        timezone,
      };
    }

    const signUp = await createSignUp(data, body?.referralId);
    return NextResponse.json({ message: "Signed up successfully", signUp });
  } catch (error) {
    console.error("Error in sign up route", error);
    return NextResponse.json({ message: "Failed to sign up" }, { status: 500 });
  }
};
