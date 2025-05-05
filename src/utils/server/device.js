import { headers } from "next/headers";

export const getDeviceInfo = () => {
	try {
		const headersList = headers();
		const userAgent = headersList.get("user-agent") || "";

		// Basic device detection
		const isMobile = /mobile|iphone|ipad|android/i.test(userAgent);
		const isTablet = /tablet|ipad/i.test(userAgent);

		let deviceType = "desktop";
		if (isTablet) deviceType = "tablet";
		else if (isMobile) deviceType = "mobile";

		return {
			device: userAgent,
			deviceType: deviceType,
		};
	} catch (error) {
		console.error("Error getting device info:", error);
		return {
			device: "unknown",
			deviceType: "unknown",
		};
	}
};
