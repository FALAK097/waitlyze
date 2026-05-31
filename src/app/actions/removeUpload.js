"use server";
import { r2 } from "@/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env.mjs";

export const removeUpload = async (logoKey) => {
  try {
    if (!logoKey || typeof logoKey !== "string") {
      return { success: false, message: "Invalid file key" };
    }

    const deleteParams = {
      Bucket: env.R2_BUCKET_NAME,
      Key: logoKey,
    };

    await r2.send(new DeleteObjectCommand(deleteParams));
    return { success: true, message: "Upload removed" };
  } catch (error) {
    console.error("Failed to remove upload:", error);
    return { success: false, message: "Failed to remove upload" };
  }
};
