import prisma from "@/lib/prisma";
import geoip from "geoip-lite";

export const POST = async (req, res) => {
	// TODO: Remove this fake delay after implementing email verification, signup confirmation to User & Signed Up user
	await new Promise((resolve) => setTimeout(resolve, 1500));
	try {
		const body = await req.json();
		const validator = checkIfRequestIsValid(body);
		if (validator) {
			return validator;
		}
		const signUp = await checkIfEmailExists(body.email, body.waitListId);
		if (signUp) {
			return Response.json(
				{
					message: "You have already signed up!",
				},
				{
					status: 400,
				},
			);
		}
		const ip = (req.headers.get("x-forwarded-for") ?? "127.0.0.1").split(
			",",
		)[0];
		const userAgent = req.headers.get("user-agent");

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

		// Assuming geoip.lookup is defined elsewhere
		const geo = geoip.lookup(ip);

		let data = {
			email: body.email,
			device: device,
			deviceType: deviceType,
			waitListId: body.waitListId,
			ipAddress: ip,
		};

		if (geo) {
			const { city, country, ll, timezone } = geo;
			let [latitude, longitude] = ll;
			latitude = latitude.toString();
			longitude = longitude.toString();
			data = { ...data, city, country, latitude, longitude, timezone };
		}

		await prisma.signUp.create({ data });
		return Response.json({ message: "Signed up successfully" });
	} catch (error) {
		console.error(error);
		return Response.json(
			{
				message: "Failed to sign up",
			},
			{
				status: 500,
			},
		);
	}
};

const checkIfEmailExists = async (email, waitListId) => {
	const signUp = await prisma.signUp.findFirst({
		where: {
			email,
			waitListId,
		},
	});
	return signUp;
};

const checkIfRequestIsValid = (body) => {
	if (!body.email) {
		return Response.json(
			{
				message: "Email is required",
			},
			{
				status: 400,
			},
		);
	}
	if (!body.waitListId) {
		return Response.json(
			{
				message: "WaitList ID is required",
			},
			{ status: 400 },
		);
	}
};
