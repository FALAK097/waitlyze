"use server";
import { utapi } from "../server/uploadthing";

export const removeUpload = async (logoKey) => {
	try {
		await utapi.deleteFiles(logoKey);
		return { sucess: true, message: "Upload removed" };
	} catch (error) {
		return { sucess: false, message: "Failed to remove upload" };
	}
};
