"use server";
import prisma from "@/lib/prisma";
import { removeUpload } from "./removeUpload";

export const removeImage = async (logoKey, waitListId) => {
	const response = {
		success: false,
		message: "Failed to remove image",
	};
	try {
		const response = await removeUpload(logoKey);
		await prisma.waitList.update({
			where: {
				id: waitListId,
			},
			data: {
				logoUrl: "",
				logoKey: "",
			},
		});
		response.success = true;
		response.message = "Image removed successfully";
	} catch (error) {
		console.error("Error removing image:", error);
		response.message = "An error occurred while removing the image";
	}
	return response;
};
