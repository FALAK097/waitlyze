import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env.mjs";
import { r2 } from "@/lib/r2";
import { checkRateLimit } from "@/lib/rate-limit";
import { normalizeUploadedImage } from "@/lib/uploads/image.mjs";

export async function POST(req) {
  try {
    // 1. Auth check
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Rate limit check (10 uploads per user per hour)
    const isAllowed = checkRateLimit(userId, 10, 60 * 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again in an hour." },
        { status: 429 },
      );
    }

    // 3. Parse form data
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 4. File size check (4MB)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds the 4MB limit" }, { status: 400 });
    }

    // 5. Allowed MIME types (images only)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
    }

    // 6. Read file data into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 7. Generate a unique key
    const image = await normalizeUploadedImage(buffer);
    const uniqueKey = `${userId}-${nanoid()}.${image.extension}`;

    // 8. Upload to R2
    const uploadParams = {
      Bucket: env.R2_BUCKET_NAME,
      Key: uniqueKey,
      Body: image.data,
      ContentType: image.contentType,
    };

    await r2.send(new PutObjectCommand(uploadParams));

    // 9. Return URL & Key
    const url = `${env.NEXT_PUBLIC_R2_PUBLIC_URL}/${uniqueKey}`;
    return NextResponse.json({ url, key: uniqueKey });
  } catch (error) {
    if (error instanceof TypeError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    // 1. Auth check
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Parse request body
    const body = await req.json();
    const { key } = body;
    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
    }

    // 3. Security check: Only allow users to delete their own uploaded files
    if (!key.startsWith(`${userId}-`)) {
      return NextResponse.json({ error: "Unauthorized to delete this file" }, { status: 403 });
    }

    // 4. Delete from R2
    const deleteParams = {
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    };

    await r2.send(new DeleteObjectCommand(deleteParams));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
