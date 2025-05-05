import { userAgent } from "next/server";

export const getDeviceInfo = (request) => {
	const { device, os } = userAgent(request);

	// Map device type from userAgent helper
	const deviceType = os.name?.toLowerCase() ?? "unknown";

	return {
		// device.type returns 'mobile', 'tablet', etc.
		device: device.type ?? "desktop",
		deviceType,
	};
};
