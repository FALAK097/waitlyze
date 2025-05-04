import { createImpression } from "@/services/impressions";
import { getDeviceInfo } from "@/utils/server/device";
import { getGeoInfo, getIpAddress, getTimeZone } from "@/utils/server/geo";
import { validateRequest } from "@/utils/server/validations/impression";

export const POST = async (req, res) => {
	// TODO: Remove this fake delay after implementing email verification, signup confirmation to User & Signed Up user
	await new Promise((resolve) => setTimeout(resolve, 1500));
	try {
		const body = await req.json();
		const validator = await validateRequest(body);
		if (validator) return validator;
		const ip = getIpAddress();

		const { device, deviceType } = getDeviceInfo();

		const geo = getGeoInfo();

		if (!body.hypeSession) {
			return Response.json(
				{
					message: "Unique User ID is required",
				},
				{
					status: 400,
				},
			);
		}

		const uniqueUserId = body.hypeSession;

		let data = {
			uniqueUserId: uniqueUserId,
			device: device,
			deviceType: deviceType,
			waitListId: body.waitListId,
			ipAddress: ip,
		};

		if (geo) {
			const { city, country, latitude, longitude } = geo;
			const timezone = await getTimeZone(geo?.city);
			data = { ...data, city, country, latitude, longitude, timezone };
		}

		const impression = await createImpression(data);
		return Response.json(impression);
	} catch (error) {
		console.error("Error creating impression:", error);
		return Response.json(
			{ message: error.message || "Failed to create impression" },
			{ status: 500 },
		);
	}
};
