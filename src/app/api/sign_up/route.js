import prisma from "@/lib/prisma";
import geoip from "geoip-lite";

export const POST = async (req, res) => {
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
		const device = req.headers.get("user-agent");
		const geo = geoip.lookup(ip);

		let data = {
			email: body.email,
			device: device,
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
