"use server";
import { utapi } from "../server/uploadthing";

export const removeUpload = async (logoKey) => {
	try {
		await utapi.deleteFiles(logoKey);
		return { success: true, message: "Upload removed" };
	} catch (error) {
		return { success: false, message: "Failed to remove upload" };
	}
};
