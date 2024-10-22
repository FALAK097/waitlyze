import { createImpression } from "@/services/impressions";
import { getDeviceInfo } from "@/utils/server/device";
import { getGeoInfo, getIpAddress } from "@/utils/server/geo";
import { validateRequest } from "@/utils/server/validations/impression";
import { cookies } from "next/headers";

export const POST = async (req, res) => {
	// TODO: Remove this fake delay after implementing email verification, signup confirmation to User & Signed Up user
	await new Promise((resolve) => setTimeout(resolve, 1500));
	try {
		const body = await req.json();
		const validator = await validateRequest(body);
		if (validator) return validator;
		const ip = getIpAddress(req);

		const { device, deviceType } = getDeviceInfo();

		const geo = getGeoInfo(ip);

		const cookieStore = cookies();
		const uniqueUserId = cookieStore.get("hypeSession");

		let data = {
			uniqueUserId: uniqueUserId.value,
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

		await createImpression(data);
		return Response.json({ message: "Impression created successfully" });
	} catch (error) {
		console.error(error);
		return Response.json(
			{
				message: "Failed to create an Impression",
			},
			{
				status: 500,
			},
		);
	}
};
