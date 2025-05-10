import { createImpression } from "@/services/impressions";
import { getDeviceInfo } from "@/utils/server/device";
import { getGeoInfo, getIpAddress, getTimeZone } from "@/utils/server/geo";
import { validateRequest } from "@/utils/server/validations/impression";
import { NextResponse } from "next/server";

export async function POST(request) {
  // TODO: Remove this fake delay after implementing email verification, signup confirmation to User & Signed Up user
  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    const body = await request.json();
    const validator = await validateRequest(body);
    if (validator) return validator;

    const { device, deviceType } = await getDeviceInfo(request);
    const ip = getIpAddress(request);
    const geo = getGeoInfo(request);

    if (!body.hypeSession) {
      return NextResponse.json(
        { message: "Unique User ID is required" },
        { status: 400 }
      );
    }

    const uniqueUserId = body.hypeSession;

    let data = {
      uniqueUserId,
      device,
      deviceType,
      waitListId: body.waitListId,
      ipAddress: ip,
    };

    if (geo) {
      const { city, country, latitude, longitude } = geo;
      const timezone = await getTimeZone(city);
      data = { ...data, city, country, latitude, longitude, timezone };
    }

    const impression = await createImpression(data);
    return NextResponse.json(impression);
  } catch (error) {
    console.error("Error creating impression:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create impression" },
      { status: 500 }
    );
  }
}
