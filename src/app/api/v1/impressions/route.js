import { createImpression } from "@/services/impressions";
import { getDeviceInfo } from "@/utils/server/device";
import { getGeoInfo, getIpAddress, getTimeZone } from "@/utils/server/geo";
import { validateRequest } from "@/utils/server/validations/impression";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const validator = await validateRequest(body);
    if (validator) return validator;

    const { device, deviceType } = await getDeviceInfo();
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
