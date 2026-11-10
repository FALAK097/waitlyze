// scripts/upload-showcase-r2.mjs
import fs from "node:fs";
import path from "node:path";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "waitlyze";
const PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://assets.waitlyze.com";

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("Missing R2 credentials in environment");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const SHOWCASE_DIR = path.resolve("public/images/showcase");

const ASSETS = [
  { file: "analytics-4k.png", key: "showcase-analytics-4k.png", contentType: "image/png" },
  { file: "subscribers-4k.png", key: "showcase-subscribers-4k.png", contentType: "image/png" },
  { file: "emails-4k.png", key: "showcase-emails-4k.png", contentType: "image/png" },
  { file: "builder-4k.png", key: "showcase-builder-4k.png", contentType: "image/png" },
  {
    file: "public-waitlist-4k.png",
    key: "showcase-public-waitlist-4k.png",
    contentType: "image/png",
  },
  { file: "demo-4k.webm", key: "showcase-demo-4k.webm", contentType: "video/webm" },
];

async function main() {
  console.log(`Uploading showcase assets to R2 bucket "${R2_BUCKET_NAME}"...`);

  for (const asset of ASSETS) {
    const filePath = path.join(SHOWCASE_DIR, asset.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    const body = fs.readFileSync(filePath);
    const sizeKb = (body.length / 1024).toFixed(1);

    console.log(`Uploading ${asset.key} (${sizeKb} KB)...`);
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: asset.key,
        Body: body,
        ContentType: asset.contentType,
        CacheControl: "public, max-age=86400, stale-while-revalidate=604800",
      }),
    );

    console.log(`✓ Uploaded: ${PUBLIC_BASE_URL}/${asset.key}`);
  }

  console.log("All showcase assets uploaded successfully!");
}

main().catch((err) => {
  console.error("Failed to upload assets to R2:", err);
  process.exit(1);
});
