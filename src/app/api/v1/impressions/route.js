import prisma from "@/lib/prisma";
import { consumePublicBudget, PublicRateLimitError } from "@/lib/security/public-rate-limit.mjs";
import { createImpression } from "@/services/impressions";
import { getDeviceInfo } from "@/utils/server/device";
import { getGeoInfo, getIpAddress, getTimeZone } from "@/utils/server/geo";
import { pickAttribution } from "@/utils/server/attribution.mjs";
import { validateRequest } from "@/utils/server/validations/impression";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    if (typeof body?.waitListId !== "string" || !body.waitListId || body.waitListId.length > 128) return NextResponse.json({ message: "A valid waitlist is required." }, { status: 400 });
    await consumePublicBudget(prisma, { kind: "impression", campaignId: body.waitListId, headers: request.headers });
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
      ...pickAttribution(body),
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
        region: geo.region,
        country: geo.country,
        latitude: geo.latitude?.toString(),
        longitude: geo.longitude?.toString(),
        timezone,
      };
    }

    const impression = await createImpression(data);
    return NextResponse.json({ id: impression.id, waitListId: impression.waitListId });
  } catch (error) {
    if (error instanceof PublicRateLimitError) return NextResponse.json({ message: error.message, error: error.message }, { status: error.status, headers: { "Retry-After": error.status === 429 ? "3600" : "60" } });
    console.error("Error creating impression:", error);
    return NextResponse.json(
      { message: "Failed to create impression" },
      { status: 500 }
    );
  }
}
