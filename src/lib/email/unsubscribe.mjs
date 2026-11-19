import { createHash, createHmac } from "node:crypto";

export function createUnsubscribeToken(
  signUpId,
  waitListId,
  secret = process.env.MARKETING_UNSUBSCRIBE_SECRET || process.env.BETTER_AUTH_SECRET,
) {
  if (!secret) throw new Error("Unsubscribe signing secret is not configured.");
  return createHmac("sha256", secret)
    .update(`waitlyze:unsubscribe:v1:${waitListId}:${signUpId}`)
    .digest("base64url");
}

export function hashUnsubscribeToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function unsubscribeFromMarketing(db, token, { now = new Date() } = {}) {
  if (typeof token !== "string" || token.length < 32 || token.length > 128) return false;
  const signup = await db.signUp.findUnique({
    where: { unsubscribeTokenHash: hashUnsubscribeToken(token) },
    select: { id: true, waitListId: true, marketingUnsubscribedAt: true },
  });
  if (!signup) return false;
  if (signup.marketingUnsubscribedAt) return true;
  const updated = await db.signUp.updateMany({
    where: { id: signup.id, marketingUnsubscribedAt: null },
    data: { marketingUnsubscribedAt: now },
  });
  if (updated.count) {
    await db.marketingConsentEvent.create({
      data: {
        waitListId: signup.waitListId,
        signUpId: signup.id,
        action: "OPTED_OUT",
        source: "PUBLIC_UNSUBSCRIBE",
        createdAt: now,
      },
    });
  }
  return true;
}
