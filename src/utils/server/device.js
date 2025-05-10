import { headers } from "next/headers";

export async function getDeviceInfo() {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";

    const isMobile = /mobile|iphone|android/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent);

    let deviceType = "desktop";
    if (isTablet) deviceType = "tablet";
    else if (isMobile) deviceType = "mobile";

    return {
      device: userAgent,
      deviceType,
    };
  } catch (error) {
    console.error("Error getting device info:", error);
    return {
      device: "unknown",
      deviceType: "unknown",
    };
  }
}
