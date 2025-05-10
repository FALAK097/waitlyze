import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const checkIfImpressionExists = async (waitListId, hypeSession) => {
	const signUp = await prisma.impression.findFirst({
		where: {
			uniqueUserId: hypeSession,
			waitListId,
		},
	});
	return signUp;
};

const checkIfRequestIsValid = async (body) => {
	if (!body.waitListId) {
		return NextResponse.json(
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
		return NextResponse.json(
			{
				message: "Invalid WaitList ID",
			},
			{ status: 400 },
		);
	}
};

export const validateRequest = async (body) => {
	let validator = await checkIfRequestIsValid(body);
	if (validator) return validator;
	validator = await checkIfImpressionExists(body.waitListId, body.hypeSession);
	if (validator) {
		return NextResponse.json(
			{
				message: "You have already signed up!",
			},
			{
				status: 403,
			},
		);
	}
};
