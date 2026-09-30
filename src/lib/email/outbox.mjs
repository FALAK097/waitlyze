const MAX_ATTEMPTS = 6;
const STALE_LOCK_MS = 5 * 60 * 1000;
const RETRY_BASE_MS = 30 * 1000;
const transient = (error) => error?.statusCode === 429 || error?.statusCode >= 500 || (error?.statusCode === 409 && error?.code === "concurrent_idempotent_requests") || error?.name === "TypeError";
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function verificationHtml({ campaignName, url }) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Confirm your spot</title><body style="margin:0;background:#f5f5f1;color:#191919;font:16px/1.6 Arial,sans-serif"><main style="max-width:560px;margin:48px auto;padding:32px;background:white;border:1px solid #e8e8e2;border-radius:16px"><p style="margin:0 0 24px;color:#70706a;font-size:13px">WAITLYZE</p><h1 style="font-size:26px;line-height:1.2">Confirm your email</h1><p>Confirm this address to secure your place on <strong>${escapeHtml(campaignName)}</strong>.</p><p style="margin:28px 0"><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#d7ff64;color:#191919;text-decoration:none;font-weight:700">Confirm email</a></p><p style="color:#70706a;font-size:13px">This link expires in 24 hours. If you did not request a spot, you can ignore this email.</p></main></body></html>`;
}

function safePayload(payload) {
  if (!payload || typeof payload !== "object" || typeof payload.signUpId !== "string" || typeof payload.token !== "string") return null;
  return payload;
}

async function applyKnownProviderEvents(db, providerMessageId, workspaceId, recipient) {
  if (!workspaceId) return;
  const events = await db.emailProviderEvent.findMany({ where: { providerMessageId, OR: [{ type: "email.complained" }, { type: "email.bounced", isPermanent: true }] }, orderBy: { type: "asc" } });
  for (const event of events) {
    const normalized = normalizeEmail(recipient);
    if (!normalized) continue;
    await db.emailSuppression.upsert({
      where: { workspaceId_emailNormalized: { workspaceId, emailNormalized: normalized } },
      create: { workspaceId, emailNormalized: normalized, reason: event.type === "email.complained" ? "COMPLAINT" : "BOUNCE" },
      update: { reason: event.type === "email.complained" ? "COMPLAINT" : "BOUNCE" },
    });
  }
}

export async function dispatchPendingOutboxEvents(db, { send, now = new Date(), batchSize = 20 } = {}) {
  if (typeof send !== "function") throw new TypeError("A provider send function is required.");
  const staleBefore = new Date(now.getTime() - STALE_LOCK_MS);
  const events = await db.outboxEvent.findMany({
    where: { availableAt: { lte: now }, OR: [{ status: "PENDING" }, { status: "PROCESSING", lockedAt: { lt: staleBefore } }] },
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }], take: batchSize,
  });
  const result = { accepted: 0, retried: 0, failed: 0, skipped: 0 };
  for (const event of events) {
    const claimed = await db.outboxEvent.updateMany({
      where: { id: event.id, OR: [{ status: "PENDING" }, { status: "PROCESSING", lockedAt: { lt: staleBefore } }] },
      data: { status: "PROCESSING", lockedAt: now, attempts: { increment: 1 } },
    });
    if (claimed.count !== 1) continue;
    const payload = safePayload(event.payload);
    const attempt = event.attempts + 1;
    if (event.type !== "SIGNUP_VERIFICATION_REQUESTED" || !payload) {
      await db.outboxEvent.update({ where: { id: event.id }, data: { status: "FAILED", processedAt: now, lockedAt: null, lastErrorCode: "UNSUPPORTED_EVENT" } });
      result.failed++;
      continue;
    }
    const [signup, verification, waitList] = await Promise.all([
      db.signUp.findUnique({ where: { id: payload.signUpId }, select: { id: true, email: true, emailNormalized: true, verifiedAt: true } }),
      db.signUpVerification.findFirst({ where: { signUpId: payload.signUpId, usedAt: null, expiresAt: { gt: now } }, select: { id: true } }),
      db.waitList.findUnique({ where: { id: event.waitListId || payload.waitListId }, select: { id: true, name: true, publicSlug: true, status: true, workspaceId: true } }),
    ]);
    if (!signup || signup.verifiedAt || !verification || !waitList || waitList.status !== "PUBLISHED") {
      await db.outboxEvent.update({ where: { id: event.id }, data: { status: "FAILED", processedAt: now, lockedAt: null, payload: { signUpId: payload.signUpId, waitListId: waitList?.id || event.waitListId }, lastErrorCode: "SIGNUP_NOT_SENDABLE" } });
      result.skipped++;
      continue;
    }
    const suppressed = waitList.workspaceId && await db.emailSuppression.findUnique({ where: { workspaceId_emailNormalized: { workspaceId: waitList.workspaceId, emailNormalized: normalizeEmail(signup.emailNormalized || signup.email) } } });
    if (suppressed) {
      await db.outboxEvent.update({ where: { id: event.id }, data: { status: "FAILED", processedAt: now, lockedAt: null, payload: { signUpId: payload.signUpId, waitListId: waitList.id }, lastErrorCode: "RECIPIENT_SUPPRESSED" } });
      result.skipped++;
      continue;
    }
    try {
      const response = await send({
        to: signup.email,
        subject: `Confirm your spot on ${waitList.name || "the waitlist"}`,
        html: verificationHtml({ campaignName: waitList.name || "the waitlist", url: `${String(process.env.BETTER_AUTH_URL || "").replace(/\/$/, "")}/verify/${encodeURIComponent(payload.token)}${waitList.publicSlug ? `?returnTo=${encodeURIComponent(`/w/${waitList.publicSlug}`)}` : ""}` }),
        idempotencyKey: event.eventKey,
      });
      if (response?.error) throw response.error;
      const providerMessageId = response?.data?.id || response?.id;
      if (!providerMessageId) throw Object.assign(new Error("Provider accepted no message id"), { code: "MISSING_PROVIDER_ID" });
      await db.outboxEvent.update({ where: { id: event.id }, data: { status: "DELIVERED", providerMessageId, processedAt: now, lockedAt: null, payload: { signUpId: payload.signUpId, waitListId: waitList.id }, lastErrorCode: null } });
      result.accepted++;
      await applyKnownProviderEvents(db, providerMessageId, waitList.workspaceId, signup.emailNormalized || signup.email);
    } catch (error) {
      const code = String(error?.code || error?.name || "PROVIDER_ERROR").replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 80) || "PROVIDER_ERROR";
      const canRetry = transient(error) && attempt < MAX_ATTEMPTS;
      const delay = Math.min(RETRY_BASE_MS * (2 ** Math.min(attempt - 1, 6)), 60 * 60 * 1000);
      await db.outboxEvent.update({ where: { id: event.id }, data: { status: canRetry ? "PENDING" : "FAILED", availableAt: canRetry ? new Date(now.getTime() + delay) : now, processedAt: canRetry ? null : now, lockedAt: null, payload: canRetry ? payload : { signUpId: payload.signUpId, waitListId: waitList.id }, lastErrorCode: code } });
      if (canRetry) result.retried++; else result.failed++;
    }
  }
  return result;
}
