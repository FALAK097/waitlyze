import { createSignUp } from "@/services/sign-up";
import { getDeviceInfo } from "@/utils/server/device";
import { getGeoInfo, getIpAddress, getTimeZone } from "@/utils/server/geo";
import { validateRequest } from "@/utils/server/validations/sign-up";

export const GET = async (req, _) => {
	// get signup id from params
	const signUpId = req.nextUrl.searchParams.get("signUpId");
	if (!signUpId) {
		return Response.json(
			{
				message: "Sign up ID is required",
			},
			{ status: 400 },
		);
	}

	const signUp = await prisma.signUp.findUnique({
		where: {
			id: signUpId,
		},
	});

	if (!signUp) {
		return Response.json(
			{
				message: "Sign up not found",
			},
			{ status: 404 },
		);
	}

	return Response.json({ signUp });
};

export const POST = async (req, _) => {
	// TODO: Remove this fake delay after implementing email verification, signup confirmation to User & Signed Up user
	await new Promise((resolve) => setTimeout(resolve, 1500));
	try {
		const body = await req.json();
		const validator = await validateRequest(body);
		if (validator) return validator;
		const ip = getIpAddress();

		const { device, deviceType } = getDeviceInfo();

		const geo = getGeoInfo();

		const hypeSession = body.hypeSession;

		if (!hypeSession) {
			return Response.json(
				{
					message: "Unique User ID is required",
				},
				{
					status: 400,
				},
			);
		}

		const impression = await prisma.impression.findFirst({
			where: {
				AND: [
					{
						waitListId: body.waitListId,
					},
					{
						uniqueUserId: hypeSession,
					},
				],
			},
		});

		let data = {
			uniqueUserId: hypeSession,
			email: body.email,
			device: device,
			deviceType: deviceType,
			waitListId: body.waitListId,
			ipAddress: ip,
			impressionId: impression?.id,
		};

		if (geo) {
			const { city, country, latitude, longitude } = geo;
			const timezone = await getTimeZone(geo?.city);
			data = { ...data, city, country, latitude, longitude, timezone };
		}

		const signUp = await createSignUp(data, body?.referralId);
		return Response.json({ message: "Signed up successfully", signUp });
	} catch (error) {
		console.error("Error in sign up route", error);
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
