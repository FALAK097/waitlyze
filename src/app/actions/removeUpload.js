"use server";
import { r2 } from "@/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env.mjs";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
    return { success: true, message: "Upload removed" };
  } catch (error) {
    console.error("Failed to remove upload:", error);
    return { success: false, message: "Failed to remove upload" };
  }
};
