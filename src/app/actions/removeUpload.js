"use server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env.mjs";
import { r2 } from "@/lib/r2";
import { purgePublicAsset } from "@/lib/uploads/public-cache";

export const removeUpload = async (logoKey) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    if (!logoKey || typeof logoKey !== "string" || !logoKey.startsWith(`${session.user.id}-`)) {
      return { success: false, message: "Invalid file key" };
    }

    const deleteParams = {
      Bucket: env.R2_BUCKET_NAME,
      Key: logoKey,
    };

    await r2.send(new DeleteObjectCommand(deleteParams));
    // Remove any edge-cached copy so the public URL stops serving the image.
    await purgePublicAsset(logoKey);
    return { success: true, message: "Upload removed" };
  } catch (error) {
    console.error("Failed to remove upload:", error);
    return { success: false, message: "Failed to remove upload" };
  }
};
