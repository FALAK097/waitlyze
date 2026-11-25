import { createHash, randomBytes, randomUUID } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import { getWorkspaceEntitlements, requireCapacity } from "@/lib/billing/plans.mjs";
import { isUniqueConstraintError, toSqliteIso } from "@/lib/db/sqlite-helpers.mjs";
import { dispatchOffboardNow, dispatchVerificationNow } from "@/lib/email/dispatch-now.mjs";
import { hasCustomerEmailSender } from "@/lib/email/sender-resolution.mjs";
import { emailLookupForms, normalizeSignupEmail } from "@/lib/normalize-email.mjs";
import prisma from "@/lib/prisma.js";
import { AUDIT_ACTIONS, recordWaitlistAuditEvent } from "@/lib/workspaces/audit.mjs";
import { validateSignupEmail } from "@/utils/server/email-validation.mjs";

const MAX_IMPORT_ROWS = 500;
const MAX_BATCH = 500;
const OFFBOARD_EVENT = "OFFBOARD_EMAIL_REQUESTED";

export async function importSubscribersJsonOp({ waitlist, rows }) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_IMPORT_ROWS) {
    throw new TypeError(`Provide between 1 and ${MAX_IMPORT_ROWS} subscriber objects.`);
  }

  const seen = new Set();
  const candidates = [];
  let invalid = 0;

  for (const row of rows) {
    const email = typeof row?.email === "string" ? row.email.trim() : "";
    if (!email || validateSignupEmail(email)) {
      invalid += 1;
      continue;
    }
    const normalized = normalizeSignupEmail(email);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    const country =
      typeof row?.country === "string" && /^[A-Za-z]{2}$/.test(row.country.trim())
        ? row.country.trim().toUpperCase()
        : null;
    const points =
      Number.isInteger(row?.points) && row.points >= 0 ? Math.min(row.points, 1_000_000) : 0;
    const verifiedAt = row?.verified === true ? new Date() : null;
    candidates.push({
      email,
      emailNormalized: normalized,
      country,
      points,
      verifiedAt,
      referredBy: typeof row?.referredBy === "string" ? row.referredBy.trim() : "",
      utmSource: typeof row?.utmSource === "string" ? row.utmSource.slice(0, 120) : null,
    });
  }

  if (candidates.length === 0) {
    return { ok: true, imported: 0, duplicates: 0, invalid, referralsLinked: 0 };
  }

  const existing = await prisma.signUp.findMany({
    where: {
      waitListId: waitlist.id,
      emailNormalized: {
        in: [...new Set(candidates.flatMap((row) => emailLookupForms(row.email)))],
      },
    },
    select: { emailNormalized: true },
  });
  const known = new Set(existing.map((r) => r.emailNormalized));
  const fresh = candidates.filter(
    (row) => !emailLookupForms(row.email).some((form) => known.has(form)),
  );
  const duplicates = candidates.length - fresh.length;

  if (fresh.length === 0) {
    return { ok: true, imported: 0, duplicates, invalid, referralsLinked: 0 };
  }

  const [usage, entitlements] = await Promise.all([
    waitlist.workspaceId
      ? prisma.workspace.findUnique({
          where: { id: waitlist.workspaceId },
          select: { signupUsageCount: true },
        })
      : prisma.signUp.count({ where: { waitListId: waitlist.id } }),
    getWorkspaceEntitlements(prisma, waitlist.workspaceId),
  ]);
  const currentUsage = waitlist.workspaceId ? usage?.signupUsageCount || 0 : usage;
  requireCapacity({
    entitlements,
    feature: "subscribers",
    used: currentUsage,
    requested: fresh.length,
    message: `This import would exceed the ${entitlements.plan === "FREE" ? "Free" : "Pro"} workspace signup limit.`,
  });

  const stamp = randomUUID();
  let imported = 0;
  const insertedRows = [];
  for (let idx = 0; idx < fresh.length; idx += 100) {
    const chunk = fresh.slice(idx, idx + 100).map((row, offset) => ({
      email: row.email,
      emailNormalized: row.emailNormalized,
      uniqueUserId: `import:${stamp}:${idx + offset}`,
      waitListId: waitlist.id,
      country: row.country,
      points: row.points,
      utmSource: row.utmSource,
      ...(row.verifiedAt ? { verifiedAt: row.verifiedAt } : {}),
    }));
    const result = await prisma.signUp.createMany({ data: chunk });
    imported += result.count;
    if (result.count > 0) {
      insertedRows.push(
        ...(await prisma.signUp.findMany({
          where: {
            waitListId: waitlist.id,
            uniqueUserId: { in: chunk.map((r) => r.uniqueUserId) },
          },
          select: { id: true, emailNormalized: true, referralCode: true },
        })),
      );
    }
  }

  if (waitlist.workspaceId && imported > 0) {
    await prisma.workspace.update({
      where: { id: waitlist.workspaceId },
      data: { signupUsageCount: { increment: imported } },
    });
  }

  let referralsLinked = 0;
  const withReferrer = fresh.filter((r) => r.referredBy);
  if (withReferrer.length > 0 && insertedRows.length > 0) {
    const byEmail = new Map(insertedRows.map((r) => [r.emailNormalized, r]));
    const keys = [...new Set(withReferrer.map((r) => r.referredBy))];
    const matches = await prisma.signUp.findMany({
      where: {
        waitListId: waitlist.id,
        OR: [
          { emailNormalized: { in: keys.flatMap((k) => emailLookupForms(k)) } },
          { referralCode: { in: keys } },
        ],
      },
      select: { id: true, emailNormalized: true, referralCode: true },
    });
    const refByEmail = new Map(matches.map((m) => [m.emailNormalized, m]));
    const refByCode = new Map(matches.map((m) => [m.referralCode, m]));
    for (const row of withReferrer) {
      const newcomer = byEmail.get(row.emailNormalized);
      const referrer =
        emailLookupForms(row.referredBy)
          .map((f) => refByEmail.get(f))
          .find(Boolean) || refByCode.get(row.referredBy);
      if (newcomer && referrer && referrer.id !== newcomer.id) {
        try {
          await prisma.referral.create({
            data: { signUpId: newcomer.id, referredById: referrer.id },
          });
          referralsLinked++;
        } catch (err) {
          if (!isUniqueConstraintError(err)) throw err;
        }
      }
    }
  }

  return { ok: true, imported, duplicates, invalid, referralsLinked };
}

export async function bulkAudienceActionOp({ waitlist, userId, actorLabel, action, ids }) {
  if (!["offboard", "resubscribe", "delete"].includes(action)) {
    throw new TypeError("Action must be offboard, resubscribe, or delete.");
  }
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_BATCH) {
    throw new TypeError(`Provide between 1 and ${MAX_BATCH} subscriber IDs.`);
  }
  const uniqueIds = [...new Set(ids)];

  if (action === "delete") {
    const targets = await prisma.signUp.findMany({
      where: { id: { in: uniqueIds }, waitListId: waitlist.id },
      select: { id: true, email: true },
    });
    if (!targets.length) return { action, deleted: 0, referralsSevered: 0 };
    const targetIds = targets.map((t) => t.id);
    const referralsSevered = await prisma.referral.count({
      where: {
        OR: [{ signUpId: { in: targetIds } }, { referredById: { in: targetIds } }],
        signUp: { waitListId: waitlist.id },
      },
    });
    const deleted = await prisma.signUp.deleteMany({
      where: { id: { in: targetIds }, waitListId: waitlist.id },
    });
    await recordWaitlistAuditEvent(prisma, {
      userId,
      waitListId: waitlist.id,
      action: AUDIT_ACTIONS.AUDIENCE_BULK_DELETED,
      resourceType: "audience",
      detail: `${actorLabel} deleted ${deleted.count} signup(s) (${referralsSevered} referral edge(s) severed)`,
    });
    return { action, deleted: deleted.count, referralsSevered };
  }

  const resubscribe = action === "resubscribe";
  const now = new Date();
  const entitlements = await getWorkspaceEntitlements(prisma, waitlist.workspaceId);
  const canEmail =
    !resubscribe &&
    entitlements.emailMarketing &&
    (await hasCustomerEmailSender(prisma, {
      workspaceId: waitlist.workspaceId,
      waitListId: waitlist.id,
    }));

  const targets = await prisma.signUp.findMany({
    where: { id: { in: uniqueIds }, waitListId: waitlist.id },
    select: { id: true, marketingUnsubscribedAt: true },
  });
  const eligibleIds = (
    resubscribe
      ? targets.filter((r) => r.marketingUnsubscribedAt)
      : targets.filter((r) => !r.marketingUnsubscribedAt)
  ).map((r) => r.id);

  let flippedIds = [];
  const eventKeys = [];
  if (eligibleIds.length) {
    await prisma.signUp.updateMany({
      where: {
        id: { in: eligibleIds },
        waitListId: waitlist.id,
        ...(resubscribe
          ? { marketingUnsubscribedAt: { not: null } }
          : { marketingUnsubscribedAt: null }),
      },
      data: { marketingUnsubscribedAt: resubscribe ? null : now },
    });
    const reread = await prisma.signUp.findMany({
      where: { id: { in: eligibleIds }, waitListId: waitlist.id },
      select: { id: true, marketingUnsubscribedAt: true },
    });
    flippedIds = resubscribe
      ? reread.filter((r) => !r.marketingUnsubscribedAt).map((r) => r.id)
      : reread
          .filter((r) => r.marketingUnsubscribedAt?.getTime() === now.getTime())
          .map((r) => r.id);
    if (flippedIds.length) {
      await prisma.marketingConsentEvent.createMany({
        data: flippedIds.map((signUpId) => ({
          waitListId: waitlist.id,
          signUpId,
          action: resubscribe ? "OPTED_IN" : "OPTED_OUT",
          source: "DASHBOARD_BULK",
          consentText: resubscribe
            ? `Bulk offboard undone by ${actorLabel}`
            : `Bulk offboard by ${actorLabel}`,
          createdAt: now,
        })),
      });
    }
    if (resubscribe && flippedIds.length) {
      await prisma.$executeRaw`
        UPDATE "outbox_events" SET "status" = 'FAILED', "processedAt" = ${toSqliteIso(now)},
          "lockedAt" = NULL, "lastErrorCode" = 'OFFBOARD_UNDONE'
        WHERE "waitListId" = ${waitlist.id} AND "type" = ${OFFBOARD_EVENT}
          AND "status" = 'PENDING' AND json_extract("payload", '$.signUpId') IN (${Prisma.join(flippedIds)})`;
    } else if (!resubscribe && canEmail && flippedIds.length) {
      const template = await prisma.emailTemplate.findUnique({
        where: { waitListId_type: { waitListId: waitlist.id, type: "OFFBOARDING" } },
        select: { id: true },
      });
      if (template) {
        for (const signUpId of flippedIds) {
          const eventKey = `offboard:${waitlist.id}:${signUpId}`;
          try {
            await prisma.outboxEvent.create({
              data: {
                eventKey,
                type: OFFBOARD_EVENT,
                waitListId: waitlist.id,
                payload: { signUpId, waitListId: waitlist.id },
              },
            });
            eventKeys.push(eventKey);
          } catch (err) {
            if (!isUniqueConstraintError(err)) throw err;
          }
        }
        if (eventKeys.length) {
          await dispatchOffboardNow(eventKeys);
        }
      }
    }
  }

  await recordWaitlistAuditEvent(prisma, {
    userId,
    waitListId: waitlist.id,
    action: resubscribe
      ? AUDIT_ACTIONS.AUDIENCE_BULK_RESUBSCRIBED
      : AUDIT_ACTIONS.AUDIENCE_BULK_OFFBOARDED,
    resourceType: "audience",
    detail: `${actorLabel} ${resubscribe ? "resubscribed" : "offboarded"} ${flippedIds.length} signup(s)`,
  });

  return {
    action,
    matched: targets.length,
    processed: flippedIds.length,
    processedIds: flippedIds,
    emailsQueued: eventKeys.length,
  };
}

export async function retryVerificationOp({ waitlist, signupIds }) {
  if (!Array.isArray(signupIds) || signupIds.length === 0 || signupIds.length > 25) {
    throw new TypeError("Provide between 1 and 25 subscriber IDs.");
  }
  if (waitlist.status !== "PUBLISHED") {
    throw new TypeError("Waitlist must be PUBLISHED to send confirmation emails.");
  }
  await hasCustomerEmailSender(prisma, {
    workspaceId: waitlist.workspaceId,
    waitListId: waitlist.id,
  });

  let queued = 0;
  let skipped = 0;
  for (const signupId of new Set(signupIds)) {
    const signup = await prisma.signUp.findFirst({
      where: { id: signupId, waitListId: waitlist.id },
      select: { id: true, email: true, emailNormalized: true, verifiedAt: true },
    });
    if (!signup || signup.verifiedAt) {
      skipped++;
      continue;
    }
    if (waitlist.workspaceId) {
      const suppressed = await prisma.emailSuppression.findUnique({
        where: {
          workspaceId_emailNormalized: {
            workspaceId: waitlist.workspaceId,
            emailNormalized: signup.emailNormalized || signup.email.trim().toLowerCase(),
          },
        },
        select: { id: true },
      });
      if (suppressed) {
        skipped++;
        continue;
      }
    }
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.signUpVerification.upsert({
      where: { signUpId: signup.id },
      create: { signUpId: signup.id, tokenHash, expiresAt },
      update: { tokenHash, expiresAt, usedAt: null },
    });
    const eventKey = `signup.verify:${randomUUID()}`;
    await prisma.outboxEvent.create({
      data: {
        eventKey,
        type: "SIGNUP_VERIFICATION_REQUESTED",
        waitListId: waitlist.id,
        payload: {
          signUpId: signup.id,
          waitListId: waitlist.id,
          email: signup.email,
          token,
          manualRetry: true,
        },
      },
    });
    await dispatchVerificationNow(eventKey);
    queued++;
  }
  return { queued, skipped };
}
