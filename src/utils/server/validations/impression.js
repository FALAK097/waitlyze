import { cookies } from "next/headers";

const checkIfImpressionExists = async (waitListId) => {
	const cookieStore = cookies();
	const uniqueUserId = cookieStore.get("hypeSession");
	const signUp = await prisma.impression.findFirst({
		where: {
			uniqueUserId: uniqueUserId.value,
			waitListId,
		},
	});
	return signUp;
};

const checkIfRequestIsValid = async (body) => {
	if (!body.waitListId) {
		return Response.json(
			{
				message: "WaitList ID is required",
			},
			{ status: 400 },
		);
	}
	const isValidWaitList = await prisma.waitList.findUnique({
		where: {
			id: body.waitListId,
		},
	});
	if (!isValidWaitList) {
		return Response.json(
			{
				message: "Invalid WaitList ID",
			},
			{ status: 400 },
		);
	}
};

export const validateRequest = async (body) => {
	let validator = await checkIfRequestIsValid(body);
	// If validator is not null, return the validator
	if (validator) return validator;
	validator = await checkIfImpressionExists(body.waitListId);
	// If validator is not null, return the validator
	if (validator) {
		return Response.json(
			{
				message: "You have already signed up!",
			},
			{
				status: 403,
			},
		);
	}
};
