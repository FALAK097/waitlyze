import { createHash, randomBytes } from "node:crypto";

const normalizeEmail = (email) => email.trim().toLowerCase();
const tokenDigest = (token) => createHash("sha256").update(token).digest("hex");

export class DuplicateSignupError extends Error {
  constructor() {
    super("You have already signed up!");
    this.name = "DuplicateSignupError";
  }
}

export class InvalidCampaignError extends Error {
  constructor() {
    super("Invalid WaitList ID");
    this.name = "InvalidCampaignError";
  }
}

export async function createCampaignSignup(db, input, referralId, { now = new Date(), verificationTtlMs = 24 * 60 * 60 * 1000 } = {}) {
  if (typeof input?.waitListId !== "string" || !input.waitListId ||
      typeof input.uniqueUserId !== "string" || !input.uniqueUserId.trim() || input.uniqueUserId.length > 256) {
    throw new TypeError("WaitList ID and unique user ID are required.");
  }
  if (typeof input.email !== "string" || input.email.length > 320) {
    throw new TypeError("A valid email address is required.");
  }
  const emailNormalized = normalizeEmail(input.email);
  if (!emailNormalized || !/^\S+@\S+\.\S+$/.test(emailNormalized)) {
    throw new TypeError("A valid email address is required.");
  }

  try {
    return await db.$transaction(async (tx) => {
      // Hold a share lock until the signup commits so a concurrent pause cannot
      // slip between the publication check and the subscriber insert.
      const published = await tx.$queryRaw`
        SELECT "id" FROM "wait_lists"
        WHERE "id" = ${input.waitListId} AND "status"::text = 'PUBLISHED'
        FOR SHARE
      `;
      if (published.length === 0) throw new InvalidCampaignError();

      const existing = await tx.signUp.findUnique({
        where: { waitListId_emailNormalized: { waitListId: input.waitListId, emailNormalized } },
        include: { referrals: true, referredBy: true },
      });
      if (existing) {
        if (existing.uniqueUserId === input.uniqueUserId) return existing;
        throw new DuplicateSignupError();
      }

      const signUp = await tx.signUp.create({
        data: {
          uniqueUserId: input.uniqueUserId,
          email: input.email.trim(),
          emailNormalized,
          waitListId: input.waitListId,
          impressionId: input.impressionId || null,
          device: input.device || null,
          deviceType: input.deviceType || null,
          city: input.city || null,
          country: input.country || null,
          timezone: input.timezone || null,
          ipAddress: input.ipAddress || null,
          latitude: input.latitude || null,
          longitude: input.longitude || null,
          verifiedAt: null,
        },
      });

      if (referralId && referralId !== input.uniqueUserId) {
        const referredBy = await tx.signUp.findFirst({
          where: { uniqueUserId: referralId, waitListId: input.waitListId },
          select: { id: true },
        });
        if (referredBy) {
          await tx.referral.create({ data: { signUpId: signUp.id, referredById: referredBy.id } });
        }
      }

      // Keep the established referral rank response stable. A later ranking
      // slice replaces this legacy full-campaign recalculation with a bounded
      // position service.
      const allSignUps = await tx.signUp.findMany({
        where: { waitListId: input.waitListId },
        include: { referrals: true, referredBy: true },
        orderBy: [{ rank: "asc" }],
      });
      const sorted = allSignUps.sort((left, right) => {
        const referrals = (right.referrals.length + right.referredBy.length) - (left.referrals.length + left.referredBy.length);
        if (referrals) return referrals;
        const created = left.createdAt.getTime() - right.createdAt.getTime();
        if (created) return created;
        return (left.rank ?? Number.POSITIVE_INFINITY) - (right.rank ?? Number.POSITIVE_INFINITY);
      });
      for (const [index, row] of sorted.entries()) {
        await tx.signUp.update({ where: { id: row.id }, data: { rank: index + 1 } });
      }

      const token = randomBytes(32).toString("base64url");
      const verification = await tx.signUpVerification.create({
        data: { signUpId: signUp.id, tokenHash: tokenDigest(token), expiresAt: new Date(now.getTime() + verificationTtlMs) },
      });
      await tx.outboxEvent.create({
        data: {
          eventKey: `signup.verify:${verification.id}`,
          type: "SIGNUP_VERIFICATION_REQUESTED",
          payload: { signUpId: signUp.id, waitListId: input.waitListId, email: signUp.email, token },
        },
      });

      return tx.signUp.findUnique({
        where: { id: signUp.id },
        include: { referrals: true, referredBy: true },
      });
    });
  } catch (error) {
    if (error?.code === "P2002") {
      const committed = await db.signUp.findUnique({
        where: { waitListId_emailNormalized: { waitListId: input.waitListId, emailNormalized } },
        include: { referrals: true, referredBy: true },
      });
      if (committed?.uniqueUserId === input.uniqueUserId) return committed;
      if (committed) throw new DuplicateSignupError();
    }
    throw error;
  }
}

export async function verifyCampaignSignup(db, token, { now = new Date() } = {}) {
  if (typeof token !== "string" || token.length < 32 || token.length > 128) return false;
  return db.$transaction(async (tx) => {
    const verification = await tx.signUpVerification.findUnique({
      where: { tokenHash: tokenDigest(token) },
      select: { id: true, signUpId: true, expiresAt: true, usedAt: true },
    });
    if (!verification || verification.usedAt || verification.expiresAt <= now) return false;

    const claimed = await tx.signUpVerification.updateMany({
      where: { id: verification.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;
    await tx.signUp.updateMany({ where: { id: verification.signUpId, verifiedAt: null }, data: { verifiedAt: now } });
    return true;
  });
}
