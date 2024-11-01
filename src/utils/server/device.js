import { headers } from "next/headers";

export const getDeviceInfo = () => {
	const headersList = headers();
	const userAgent = headersList.get("user-agent") ?? "";
	// Detecting mobile, tablet, or desktop
	const isMobile = /mobile/i.test(userAgent);
	const isTablet = /tablet/i.test(userAgent);
	const device = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

	// Detecting device type like android, ios, windows, mac, linux, other
	const isAndroid = /android/i.test(userAgent);
	const isIos = /iPhone|iPad|iPod/i.test(userAgent);
	const isWindows = /windows/i.test(userAgent);
	const isMac = /macintosh/i.test(userAgent);
	const isLinux = /linux/i.test(userAgent) && !isAndroid;
	const isOther = !isAndroid && !isIos && !isWindows && !isMac && !isLinux;

	const deviceType = isAndroid
		? "android"
		: isIos
			? "ios"
			: isWindows
				? "windows"
				: isMac
					? "mac"
					: isLinux
						? "linux"
						: isOther
							? "other"
							: "unknown";

	return { device, deviceType };
};
