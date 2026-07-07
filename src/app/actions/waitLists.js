"use server";
import prisma from "@/lib/prisma";
import { removeUpload } from "./removeUpload";
import { requireAuth, verifyWaitlistOwnership } from "@/lib/auth-utils";

export const removeImage = async (logoKey, waitListId) => {
	const user = await requireAuth();
	if (!user) {
		return { success: false, message: "Unauthorized" };
	}

	const owned = await verifyWaitlistOwnership(waitListId, user.id);
	if (!owned) {
		return { success: false, message: "Unauthorized" };
	}

	const response = {
		success: false,
		message: "Failed to remove image",
	};
	try {
		await removeUpload(logoKey);
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
