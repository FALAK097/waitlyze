import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function encryptionKey() {
  const key = Buffer.from(process.env.WEBHOOK_SECRET_ENCRYPTION_KEY || "", "base64");
  if (key.length !== 32) throw new Error("WEBHOOK_SECRET_ENCRYPTION_KEY must be base64-encoded 32-byte key material.");
  return key;
}

export function encryptIntegrationSecret(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return { secretCiphertext: ciphertext.toString("base64"), secretIv: iv.toString("base64"), secretTag: cipher.getAuthTag().toString("base64") };
}

export function decryptIntegrationSecret(record) {
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(record.secretIv, "base64"));
  decipher.setAuthTag(Buffer.from(record.secretTag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(record.secretCiphertext, "base64")), decipher.final()]).toString("utf8");
}
