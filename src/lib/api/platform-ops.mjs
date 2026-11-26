import { createHash, randomBytes, randomUUID } from "node:crypto";

import { Resend } from "resend";

import { Prisma } from "@/generated/prisma/client";
import { getWorkspaceEntitlements, requireCapacity, requireFeature } from "@/lib/billing/plans.mjs";
import { createDraft, RESERVED_WAITLIST_SLUGS } from "@/lib/campaigns/create-draft.mjs";
import {
  normalizePhoneNumber,
  sanitizeCustomFieldAnswers,
  validatePhoneNumber,
} from "@/lib/campaigns/form-rules.mjs";
import { MARKETING_CONSENT_COPY } from "@/lib/campaigns/marketing-consent.mjs";
import {
  getCampaignPositions,
  getEligibleReferralCounts,
} from "@/lib/campaigns/referral-position.mjs";
import { saveDraftSnapshot } from "@/lib/campaigns/save-draft-snapshot.mjs";
import { findSignupByEmail } from "@/lib/campaigns/signup-lookup.mjs";
import { isUniqueConstraintError, toSqliteIso } from "@/lib/db/sqlite-helpers.mjs";
import { renderEmailMarkdown } from "@/lib/email-markdown.mjs";
import {
  AUTOMATION_DEFAULTS,
  ensureAutomationRecipes,
  normalizeAutomationConfig,
} from "@/lib/email/automations.mjs";
import { emailBrandFromSnapshot } from "@/lib/email/brand.mjs";
import {
  countEligibleRecipients,
  enqueueBroadcast,
  sampleEligibleEmails,
} from "@/lib/email/broadcast-queue.mjs";
import {
  legacyEmailContent,
  subscriberEmailHtml,
  validateComposerContent,
} from "@/lib/email/composer.mjs";
import { dispatchVerificationNow } from "@/lib/email/dispatch-now.mjs";
import { normalizeSegment } from "@/lib/email/segments.mjs";
import {
  CustomerSenderNotConnectedError,
  resolveTransactionalEmailSender,
} from "@/lib/email/sender-resolution.mjs";
import { createUnsubscribeToken, hashUnsubscribeToken } from "@/lib/email/unsubscribe.mjs";
import { interpolateVars, interpolateVarsHtml, seedPreviewVars } from "@/lib/email/variables.mjs";
import { emailStatusLabel } from "@/lib/emails/status-label.mjs";
import { emailTemplateType, normalizeEmailTemplate } from "@/lib/emails/templates.mjs";
import { senderForWaitlist } from "@/lib/emails/test-delivery.mjs";
import { env } from "@/lib/env.mjs";
import { normalizeSignupEmail } from "@/lib/normalize-email.mjs";
import prisma from "@/lib/prisma.js";
import {
  awardPoints,
  isFarmSuspect,
  referralEventKey,
  signupEventKey,
} from "@/lib/referrals/points.mjs";
import {
  checkRewardTierUnlocks,
  getPublishedRewards,
  summarizeSignupRewards,
} from "@/lib/referrals/rewards.mjs";
import { consumePublicBudget } from "@/lib/security/public-rate-limit.mjs";
import { snapshotTemplate, templateSnapshotSchema } from "@/lib/templates/catalog.mjs";
import { enqueueWebhookEvent } from "@/lib/webhooks/delivery.mjs";
import {
  AUDIT_ACTIONS,
  recordAuditEvent,
  recordWaitlistAuditEvent,
} from "@/lib/workspaces/audit.mjs";

export function publicBaseUrl() {
  return String(process.env.BETTER_AUTH_URL || "https://waitlyze.com").replace(/\/$/, "");
}

export function waitlistPublicUrl(publicSlug, customDomainHostname = null) {
  if (customDomainHostname) return `https://${customDomainHostname}`;
  if (!publicSlug) return null;
  return `${publicBaseUrl()}/w/${encodeURIComponent(publicSlug)}`;
}

export function subscriberReferralUrl(publicSlug, referralCode, customDomainHostname = null) {
  const base = waitlistPublicUrl(publicSlug, customDomainHostname);
  if (!base || !referralCode) return null;
  return `${base}?r=${encodeURIComponent(referralCode)}`;
}

export function parseTemplateSnapshotOrDefault(waitlist) {
  if (waitlist?.templateSnapshot) {
    const raw =
      typeof waitlist.templateSnapshot === "string"
        ? JSON.parse(waitlist.templateSnapshot)
        : waitlist.templateSnapshot;
    const parsed = templateSnapshotSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
  }
  return snapshotTemplate("simple");
}

export async function createDraftWaitlistOp({
  userId,
  workspaceId,
  name,
  description = "",
  websiteUrl = null,
  publicSlug,
  templateId = "simple",
  showReferrals = true,
  sendEmailsToSubscribers = true,
  creationKey,
}) {
  const slug =
    publicSlug ||
    `${
      String(name || "waitlist")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 36) || "waitlist"
    }-${randomBytes(2).toString("hex")}`;

  const draft = await createDraft(prisma, userId, workspaceId, {
    name,
    description: description || "",
    publicSlug: slug,
    templateId: templateId || "simple",
    showReferrals,
    sendEmailsToSubscribers,
    creationKey: creationKey || randomUUID(),
  });

  if (websiteUrl) {
    await prisma.waitList.update({
      where: { id: draft.id },
      data: { websiteUrl },
    });
  }

  await recordAuditEvent(prisma, {
    workspaceId,
    userId,
    action: AUDIT_ACTIONS.WAITLIST_CREATED,
    resourceType: "waitlist",
    resourceId: draft.id,
    resourceName: draft.name,
    detail: "Created via API / MCP",
  });

  return websiteUrl ? { ...draft, websiteUrl } : draft;
}

export async function updateWaitlistFieldsOp({ userId, waitlist, updates }) {
  const data = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.websiteUrl !== undefined) data.websiteUrl = updates.websiteUrl;
  if (updates.publicSlug !== undefined) {
    const slug = typeof updates.publicSlug === "string" ? updates.publicSlug.trim() : "";
    if (
      slug.length < 3 ||
      slug.length > 48 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      RESERVED_WAITLIST_SLUGS.has(slug)
    ) {
      throw new TypeError(
        "Slug must be 3 to 48 lowercase letters, numbers, or single hyphens and not reserved.",
      );
    }
    if (slug !== waitlist.publicSlug) {
      const taken = await prisma.waitList.findUnique({
        where: { publicSlug: slug },
        select: { id: true },
      });
      if (taken && taken.id !== waitlist.id) {
        throw Object.assign(new Error("This address is taken. Choose another."), { status: 409 });
      }
      data.publicSlug = slug;
    }
  }
  if (updates.buttonText !== undefined) data.buttonText = updates.buttonText;
  if (updates.successMessage !== undefined) data.successMessage = updates.successMessage;
  if (updates.fraudMode !== undefined) data.fraudMode = updates.fraudMode;
  if (updates.showReferrals !== undefined) data.showReferrals = updates.showReferrals;
  if (updates.sendEmailsToSubscribers !== undefined)
    data.sendEmailsToSubscribers = updates.sendEmailsToSubscribers;
  if (updates.showSocialProof !== undefined) data.showSocialProof = updates.showSocialProof;

  if (
    updates.templateId !== undefined ||
    updates.buttonText !== undefined ||
    updates.successMessage !== undefined
  ) {
    const baseSnapshot =
      updates.templateId !== undefined
        ? snapshotTemplate(updates.templateId)
        : parseTemplateSnapshotOrDefault(waitlist);
    const nextSnapshot = {
      ...baseSnapshot,
      ...(updates.buttonText !== undefined
        ? { form: { ...baseSnapshot.form, buttonText: updates.buttonText.slice(0, 40) } }
        : {}),
      ...(updates.successMessage !== undefined
        ? { statusPage: { ...baseSnapshot.statusPage, body: updates.successMessage.slice(0, 500) } }
        : {}),
    };
    await saveDraftSnapshot(
      prisma,
      userId,
      waitlist.workspaceId,
      waitlist.id,
      waitlist.templateRevision,
      nextSnapshot,
    );
  }

  return prisma.waitList.update({
    where: { id: waitlist.id },
    data,
  });
}

export async function updateWaitlistSnapshotOp({ userId, waitlist, snapshot, expectedRevision }) {
  const revision = expectedRevision ?? waitlist.templateRevision;
  const saved = await saveDraftSnapshot(
    prisma,
    userId,
    waitlist.workspaceId,
    waitlist.id,
    revision,
    snapshot,
  );
  return { ...saved, templateRevision: saved.revision };
}

export async function configureWaitlistFormRulesOp({ userId, waitlist, formPatch }) {
  const snapshot = parseTemplateSnapshotOrDefault(waitlist);
  const nextSnapshot = {
    ...snapshot,
    form: {
      ...snapshot.form,
      ...formPatch,
    },
  };
  const saved = await saveDraftSnapshot(
    prisma,
    userId,
    waitlist.workspaceId,
    waitlist.id,
    waitlist.templateRevision,
    nextSnapshot,
  );
  return {
    ...saved,
    templateRevision: saved.revision,
    form: saved.snapshot?.form ?? nextSnapshot.form,
  };
}

export async function configureWaitlistRewardsOp({ userId, waitlist, rewardsPatch, tiers }) {
  const snapshot = parseTemplateSnapshotOrDefault(waitlist);
  const sections = Array.isArray(snapshot.sections) ? [...snapshot.sections] : [];
  if (Array.isArray(tiers)) {
    const idx = sections.findIndex((s) => s.type === "referralRewards");
    if (tiers.length === 0 && idx >= 0) {
      sections[idx] = { ...sections[idx], visible: false };
    } else if (tiers.length > 0 && idx >= 0) {
      sections[idx] = { ...sections[idx], visible: true, items: tiers };
    } else if (tiers.length > 0) {
      const footerIdx = sections.findIndex((s) => s.type === "footer");
      const newSection = {
        id: "referral-rewards",
        type: "referralRewards",
        visible: true,
        variant: "default",
        heading: "Invite friends, unlock rewards",
        items: tiers,
      };
      if (footerIdx >= 0) sections.splice(footerIdx, 0, newSection);
      else sections.push(newSection);
    }
  }
  const nextSnapshot = {
    ...snapshot,
    sections,
    rewards: {
      ...snapshot.rewards,
      ...rewardsPatch,
    },
  };
  const saved = await saveDraftSnapshot(
    prisma,
    userId,
    waitlist.workspaceId,
    waitlist.id,
    waitlist.templateRevision,
    nextSnapshot,
  );
  return {
    ...saved,
    templateRevision: saved.revision,
    rewards: saved.snapshot?.rewards ?? nextSnapshot.rewards,
  };
}

export async function addSubscriberDirectOp({
  waitlist,
  email,
  referralCode,
  autoVerify = true,
  marketingConsent = false,
  phone,
  customFields,
  utmSource,
  utmMedium,
  utmCampaign,
  utmTerm,
  utmContent,
  referrer,
  landingPage,
  now = new Date(),
}) {
  const normalizedEmail = normalizeSignupEmail(email);
  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new TypeError("A valid email address is required.");
  }

  const existing = await findSignupByEmail(prisma, waitlist.id, email);
  if (existing) {
    const [summary, totalSignups] = await Promise.all([
      summarizeSignupRewards(prisma, waitlist.id, existing),
      prisma.signUp.count({ where: { waitListId: waitlist.id } }),
    ]);
    return {
      alreadyExists: true,
      subscriber: existing,
      position: summary.position ?? existing.rank,
      totalSignups,
      rewardSummary: summary,
    };
  }

  const snapshot = parseTemplateSnapshotOrDefault(waitlist);
  const phoneError = validatePhoneNumber(phone, snapshot.form);
  if (phoneError) throw new TypeError(phoneError);

  const customAnswerResult = sanitizeCustomFieldAnswers(snapshot.form, customFields);
  if (customAnswerResult.error) throw new TypeError(customAnswerResult.error);

  const [usage, entitlements] = await Promise.all([
    waitlist.workspaceId
      ? prisma.workspace.findUnique({
          where: { id: waitlist.workspaceId },
          select: { signupUsageCount: true },
        })
      : prisma.signUp.count({ where: { waitListId: waitlist.id } }),
    getWorkspaceEntitlements(prisma, waitlist.workspaceId, now),
  ]);
  const currentUsage = waitlist.workspaceId ? usage?.signupUsageCount || 0 : usage;
  requireCapacity({
    entitlements,
    feature: "subscribers",
    used: currentUsage,
    message: `The ${entitlements.plan === "FREE" ? "Free" : "Pro"} plan includes ${entitlements.subscribers} signups per workspace. Upgrade to add more subscribers.`,
  });

  if (!autoVerify) {
    const verificationSender = await resolveTransactionalEmailSender(prisma, {
      workspaceId: waitlist.workspaceId,
      waitListId: waitlist.id,
      platformSender: false,
    });
    if (!verificationSender) throw new CustomerSenderNotConnectedError();
  }

  let referrerSignUp = null;
  if (referralCode && waitlist.showReferrals) {
    referrerSignUp = await prisma.signUp.findFirst({
      where: {
        waitListId: waitlist.id,
        OR: [{ referralCode }, { uniqueUserId: referralCode }],
      },
      select: { id: true },
    });
  }

  const normalizedPhone = phone ? normalizePhoneNumber(phone) : null;
  const subscriber = await prisma.signUp.create({
    data: {
      waitListId: waitlist.id,
      uniqueUserId: `api_${randomUUID()}`,
      email: email.trim(),
      emailNormalized: normalizedEmail,
      points: 0,
      verifiedAt: autoVerify ? now : null,
      marketingConsentAt: marketingConsent ? now : null,
      phone: normalizedPhone || null,
      customFields: customAnswerResult.answers.length
        ? customAnswerResult.answers
        : customFields || null,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      utmTerm: utmTerm || null,
      utmContent: utmContent || null,
      referrer: referrer || null,
      landingPage: landingPage || null,
    },
  });

  if (waitlist.workspaceId) {
    await prisma.workspace.update({
      where: { id: waitlist.workspaceId },
      data: { signupUsageCount: { increment: 1 } },
    });
  }

  if (marketingConsent) {
    const token = createUnsubscribeToken(subscriber.id, waitlist.id);
    await prisma.signUp.update({
      where: { id: subscriber.id },
      data: { unsubscribeTokenHash: hashUnsubscribeToken(token) },
    });
    await prisma.marketingConsentEvent.create({
      data: {
        waitListId: waitlist.id,
        signUpId: subscriber.id,
        action: "OPTED_IN",
        source: "PUBLIC_SIGNUP",
        consentText: MARKETING_CONSENT_COPY,
        createdAt: now,
      },
    });
  }

  await enqueueWebhookEvent(prisma, {
    waitListId: waitlist.id,
    eventType: "signup.created",
    signupId: subscriber.id,
    now,
  });

  let referralRecord = null;
  if (referrerSignUp && referrerSignUp.id !== subscriber.id) {
    referralRecord = await prisma.referral.create({
      data: {
        signUpId: subscriber.id,
        referredById: referrerSignUp.id,
        reviewStatus: "CLEAR",
      },
    });
  }

  if (autoVerify) {
    await enqueueWebhookEvent(prisma, {
      waitListId: waitlist.id,
      eventType: "signup.verified",
      signupId: subscriber.id,
      now,
    });
    const { rewards, tiers } = await getPublishedRewards(prisma, waitlist.id);
    await awardPoints(prisma, {
      waitListId: waitlist.id,
      signUpId: subscriber.id,
      kind: "SIGNUP_VERIFIED",
      points: rewards.pointsSignup,
      eventKey: signupEventKey(subscriber.id),
    });

    if (referralRecord?.referredById) {
      await awardPoints(prisma, {
        waitListId: waitlist.id,
        signUpId: referralRecord.referredById,
        kind: "REFERRAL_CREDIT",
        points: rewards.pointsReferral,
        eventKey: referralEventKey(referralRecord.id),
      });
      await enqueueWebhookEvent(prisma, {
        waitListId: waitlist.id,
        eventType: "referral.completed",
        signupId: referralRecord.referredById,
        extra: { referredSignupId: subscriber.id },
        now,
      });
      const counts = await getEligibleReferralCounts(prisma, waitlist.id, [
        referralRecord.referredById,
      ]);
      await checkRewardTierUnlocks(prisma, {
        waitListId: waitlist.id,
        referrerId: referralRecord.referredById,
        triggeringSignupId: subscriber.id,
        verifiedReferrals: counts.get(referralRecord.referredById) ?? 0,
        tiers,
        now,
      });
    }

    try {
      await prisma.outboxEvent.create({
        data: {
          eventKey: `automation.trigger:signup-verified:${subscriber.id}`,
          type: "MARKETING_AUTOMATION_TRIGGER_REQUESTED",
          waitListId: waitlist.id,
          payload: { signUpId: subscriber.id },
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  } else {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const verification = await prisma.signUpVerification.create({
      data: {
        signUpId: subscriber.id,
        tokenHash,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    });
    const verificationEventKey = `signup.verify:${verification.id}`;
    await prisma.outboxEvent.create({
      data: {
        eventKey: verificationEventKey,
        type: "SIGNUP_VERIFICATION_REQUESTED",
        waitListId: waitlist.id,
        payload: {
          signUpId: subscriber.id,
          waitListId: waitlist.id,
          email: subscriber.email,
          token,
        },
      },
    });
    await dispatchVerificationNow(verificationEventKey);
  }

  const freshSubscriber = await prisma.signUp.findUnique({ where: { id: subscriber.id } });
  const [summary, totalSignups] = await Promise.all([
    summarizeSignupRewards(prisma, waitlist.id, freshSubscriber),
    prisma.signUp.count({ where: { waitListId: waitlist.id } }),
  ]);

  return {
    alreadyExists: false,
    subscriber: freshSubscriber,
    position: summary.position ?? null,
    totalSignups,
    rewardSummary: summary,
  };
}

export async function awardCustomPointsOp({
  waitlistId,
  email,
  signupId,
  event,
  pointsOverride,
  idempotencyKey = "once",
}) {
  const signup = signupId
    ? await prisma.signUp.findFirst({
        where: { id: signupId, waitListId: waitlistId },
        select: { id: true, waitListId: true, verifiedAt: true, ipAddress: true, points: true },
      })
    : await findSignupByEmail(prisma, waitlistId, email);
  if (!signup) {
    throw new Error("Subscriber not found.");
  }
  if (!signup.verifiedAt) {
    throw new TypeError("Points can only be awarded to verified subscribers.");
  }
  const eventKey = String(event || "")
    .trim()
    .toLowerCase();
  if (!/^[a-z0-9-]{1,40}$/.test(eventKey)) {
    throw new TypeError("Event key must be 1-40 chars (a-z, 0-9, -).");
  }
  const { rewards } = await getPublishedRewards(prisma, waitlistId);
  const configured = rewards.customEvents.find((entry) => entry.key === eventKey);
  let points = configured?.points ?? 0;
  const label = configured?.label ?? eventKey;
  if (pointsOverride !== undefined) {
    points = pointsOverride;
  } else if (!configured) {
    throw new TypeError(
      `Unknown custom event '${eventKey}'. Configure it in waitlist rewards or pass explicit points.`,
    );
  }
  let awarded = false;
  let balance = signup.points ?? 0;
  if (!(await isFarmSuspect(prisma, signup.ipAddress, new Date()))) {
    const result = await awardPoints(prisma, {
      waitListId: waitlistId,
      signUpId: signup.id,
      kind: "CUSTOM",
      points,
      eventKey: `custom-credit:${signup.id}:${eventKey}:${idempotencyKey}`,
    });
    awarded = result.awarded;
    balance = result.balance ?? balance;
  }
  return { awarded, event: eventKey, label, points: awarded ? points : 0, balance };
}

export async function sendBroadcastOp({
  userId,
  waitlist,
  broadcastId,
  segment,
  expectedRecipientCount,
  exact = false,
}) {
  const entitlements = await getWorkspaceEntitlements(prisma, waitlist.workspaceId);
  requireFeature(entitlements, "emailMarketing");

  if (!env.OUTBOX_DISPATCH_SECRET) {
    throw new Error("Email delivery is not configured on this server.");
  }
  await senderForWaitlist(waitlist.id);

  const seg = normalizeSegment(segment);
  const count = await enqueueBroadcast(prisma, {
    waitListId: waitlist.id,
    broadcastId,
    segment: seg,
    expectedRecipientCount,
    exact,
  });

  await recordWaitlistAuditEvent(prisma, {
    userId,
    waitListId: waitlist.id,
    action: AUDIT_ACTIONS.BROADCAST_SENT,
    resourceType: "broadcast",
    resourceId: broadcastId,
    detail: `Queued for ${count} opted-in subscriber${count === 1 ? "" : "s"} (${seg})`,
  });

  return { count, segment: seg };
}

export async function previewBroadcastRecipientsOp(waitListId, segment = "ALL") {
  const seg = normalizeSegment(segment);
  const [count, rows] = await Promise.all([
    countEligibleRecipients(prisma, waitListId, seg),
    sampleEligibleEmails(prisma, waitListId, seg, 5),
  ]);
  return {
    count,
    segment: seg,
    samples: rows.map(({ email }) => {
      const [local, domain] = String(email).split("@");
      return `${(local || "").slice(0, 1)}•••@${domain || ""}`;
    }),
  };
}

export async function scheduleBroadcastOp({
  userId,
  waitlist,
  broadcastId,
  segment = "ALL",
  scheduledAt,
}) {
  const entitlements = await getWorkspaceEntitlements(prisma, waitlist.workspaceId);
  requireFeature(entitlements, "emailMarketing");
  if (!env.OUTBOX_DISPATCH_SECRET) {
    throw new Error("Email delivery is not configured on this server.");
  }
  await senderForWaitlist(waitlist.id);
  const when = new Date(scheduledAt);
  if (!Number.isFinite(when.getTime()) || when.getTime() <= Date.now()) {
    throw new TypeError("Pick a future date and time to schedule.");
  }
  if (when.getTime() - Date.now() > 90 * 24 * 60 * 60 * 1000) {
    throw new TypeError("Schedule up to 90 days ahead.");
  }
  const seg = normalizeSegment(segment);
  const broadcast = await prisma.marketingBroadcast.findFirst({
    where: { id: broadcastId, waitListId: waitlist.id },
    select: { id: true, status: true, subject: true, body: true },
  });
  if (!broadcast || broadcast.status !== "DRAFT") {
    throw new TypeError("Only draft broadcasts can be scheduled.");
  }
  if (!String(broadcast.subject || "").trim() || !String(broadcast.body || "").trim()) {
    throw new TypeError("Add a subject and message before scheduling.");
  }
  const eligibleCount = await countEligibleRecipients(prisma, waitlist.id, seg);
  if (!eligibleCount) {
    throw new TypeError("There are no eligible subscribers in this segment right now.");
  }
  const updated = await prisma.marketingBroadcast.updateMany({
    where: { id: broadcastId, waitListId: waitlist.id, status: "DRAFT" },
    data: { status: "SCHEDULED", segment: seg, scheduledAt: when },
  });
  if (updated.count !== 1) throw new TypeError("Only draft broadcasts can be scheduled.");
  await recordWaitlistAuditEvent(prisma, {
    userId,
    waitListId: waitlist.id,
    action: AUDIT_ACTIONS.BROADCAST_SENT,
    resourceType: "broadcast",
    resourceId: broadcastId,
    detail: `Scheduled for ${eligibleCount} subscriber${eligibleCount === 1 ? "" : "s"} (${seg})`,
  });
  return { scheduledAt: when, segment: seg, eligibleCount };
}

export async function cancelBroadcastOp({ waitListId, broadcastId }) {
  const broadcast = await prisma.marketingBroadcast.findFirst({
    where: { id: broadcastId, waitListId },
    select: { id: true, status: true },
  });
  if (!broadcast) throw new Error("Broadcast not found.");
  if (broadcast.status === "SCHEDULED") {
    const claimed = await prisma.marketingBroadcast.updateMany({
      where: { id: broadcastId, waitListId, status: "SCHEDULED" },
      data: { status: "CANCELED", scheduledAt: null },
    });
    return { canceled: claimed.count === 1, previousStatus: "SCHEDULED" };
  }
  if (broadcast.status === "SENDING") {
    const claimed = await prisma.marketingBroadcast.updateMany({
      where: { id: broadcastId, waitListId, status: "SENDING" },
      data: { status: "CANCELED" },
    });
    if (claimed.count === 1) {
      const nowIso = toSqliteIso(new Date());
      await prisma.$executeRaw`
        UPDATE "outbox_events"
        SET "status" = 'FAILED', "processedAt" = ${nowIso}, "lockedAt" = NULL, "lastErrorCode" = 'BROADCAST_CANCELED'
        WHERE "type" = 'BROADCAST_EMAIL_REQUESTED'
          AND json_extract("payload", '$.broadcastId') = ${broadcastId}
          AND "status" = 'PENDING'`;
      await prisma.broadcastRecipient.updateMany({
        where: { broadcastId, status: { in: ["PENDING", "PROCESSING"] } },
        data: { status: "CANCELED", lastErrorCode: "BROADCAST_CANCELED" },
      });
      return { canceled: true, previousStatus: "SENDING" };
    }
  }
  return { canceled: false, previousStatus: broadcast.status };
}

export async function listAutomationRecipesOp(waitListId) {
  await ensureAutomationRecipes(prisma, waitListId);
  const recipes = await prisma.automationRecipe.findMany({
    where: { waitListId },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    orderBy: { createdAt: "asc" },
  });
  return recipes.map((recipe) => ({
    id: recipe.id,
    type: recipe.type,
    title: AUTOMATION_DEFAULTS[recipe.type]?.title || recipe.type,
    status: recipe.status,
    currentVersion: recipe.currentVersion,
    config: recipe.versions?.[0]?.config ?? null,
    updatedAt: recipe.updatedAt,
  }));
}

export async function saveAutomationRecipeOp({ waitlist, recipeId, data }) {
  const entitlements = await getWorkspaceEntitlements(prisma, waitlist.workspaceId);
  requireFeature(entitlements, "emailMarketing");
  const recipe = await prisma.automationRecipe.findFirst({
    where: { id: recipeId, waitListId: waitlist.id },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!recipe) throw new Error("Automation recipe not found.");
  const config = normalizeAutomationConfig(recipe.type, data);
  const currentVersion = recipe.versions[0];
  if (JSON.stringify(currentVersion?.config) === JSON.stringify(config)) {
    return { recipeId: recipe.id, type: recipe.type, version: recipe.currentVersion, config };
  }
  const version = recipe.currentVersion + 1;
  await prisma.automationRecipeVersion.create({
    data: { recipeId: recipe.id, version, config },
  });
  await prisma.automationRecipe.update({
    where: { id: recipe.id },
    data: { currentVersion: version },
  });
  return { recipeId: recipe.id, type: recipe.type, version, config };
}

export async function setAutomationStatusOp({ waitlist, recipeId, status }) {
  if (!["ENABLED", "PAUSED"].includes(status)) {
    throw new TypeError("Choose ENABLED or PAUSED.");
  }
  if (status === "ENABLED") {
    const entitlements = await getWorkspaceEntitlements(prisma, waitlist.workspaceId);
    requireFeature(entitlements, "emailMarketing");
    if (!env.OUTBOX_DISPATCH_SECRET) {
      throw new Error("Email delivery is not configured yet.");
    }
    await senderForWaitlist(waitlist.id);
  }
  const recipe = await prisma.automationRecipe.findFirst({
    where: { id: recipeId, waitListId: waitlist.id },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!recipe) throw new Error("Automation recipe not found.");
  if (status === "ENABLED") {
    normalizeAutomationConfig(recipe.type, recipe.versions[0]?.config);
    await prisma.automationRecipe.update({ where: { id: recipe.id }, data: { status: "ENABLED" } });
    return { id: recipe.id, type: recipe.type, status: "ENABLED" };
  }

  await prisma.automationRecipe.update({ where: { id: recipe.id }, data: { status: "PAUSED" } });
  const scheduledSteps = await prisma.automationRunStep.findMany({
    where: {
      run: { recipeId: recipe.id, status: { in: ["PENDING", "PROCESSING"] } },
      status: { in: ["PENDING", "PROCESSING"] },
    },
    select: { id: true, runId: true, outboxEventKey: true },
  });
  const scheduledKeys = scheduledSteps.map((step) => step.outboxEventKey);
  const pendingEvents = scheduledKeys.length
    ? await prisma.outboxEvent.findMany({
        where: { eventKey: { in: scheduledKeys }, status: "PENDING" },
        select: { eventKey: true },
      })
    : [];
  const cancelKeys = pendingEvents.map((e) => e.eventKey);
  const cancelSet = new Set(cancelKeys);
  const cancelSteps = scheduledSteps.filter((s) => cancelSet.has(s.outboxEventKey));
  if (cancelKeys.length) {
    await prisma.outboxEvent.updateMany({
      where: { eventKey: { in: cancelKeys }, status: "PENDING" },
      data: {
        status: "FAILED",
        processedAt: new Date(),
        payload: {},
        lastErrorCode: "AUTOMATION_PAUSED",
      },
    });
  }
  if (cancelSteps.length) {
    await prisma.automationRunStep.updateMany({
      where: {
        id: { in: cancelSteps.map((s) => s.id) },
        status: { in: ["PENDING", "PROCESSING"] },
      },
      data: { status: "CANCELED", finishedAt: new Date(), lastErrorCode: "AUTOMATION_PAUSED" },
    });
    await prisma.automationRun.updateMany({
      where: {
        id: { in: cancelSteps.map((s) => s.runId) },
        status: { in: ["PENDING", "PROCESSING"] },
      },
      data: { status: "CANCELED", finishedAt: new Date(), skipReason: "AUTOMATION_PAUSED" },
    });
  }
  return { id: recipe.id, type: recipe.type, status: "PAUSED" };
}

export function normalizeComposerInput(data) {
  if (data?.editorDocument && data?.renderedHtml && data?.renderedText) {
    return validateComposerContent(data);
  }
  const rawBody =
    typeof data?.body === "string"
      ? data.body
      : typeof data?.renderedText === "string"
        ? data.renderedText
        : typeof data?.text === "string"
          ? data.text
          : "";
  const trimmed = rawBody.trim();
  if (!trimmed) {
    throw new TypeError("Message body is required.");
  }
  const paragraphs = trimmed.split(/\n{2,}/).filter((p) => p.trim());
  const editorDocument = {
    type: "doc",
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: [{ type: "text", text: p.trim() }],
    })),
  };
  const renderedHtml =
    typeof data?.renderedHtml === "string" && data.renderedHtml.trim()
      ? data.renderedHtml
      : renderEmailMarkdown(trimmed);
  return validateComposerContent({
    editorDocument,
    renderedHtml,
    renderedText: trimmed,
  });
}

export async function upsertEmailTemplateOp({ waitlist, templateType, data }) {
  const entitlements = await getWorkspaceEntitlements(prisma, waitlist.workspaceId);
  requireFeature(entitlements, "emailMarketing");
  const enumType = emailTemplateType(templateType);
  if (!enumType) {
    throw new TypeError(
      "templateType must be one of: signup, offboarding, referral-congrats, launch-invite.",
    );
  }
  const content = normalizeComposerInput(data);
  if (
    typeof data.subject !== "string" ||
    !data.subject.trim() ||
    data.subject.length > 160 ||
    /[\r\n]/.test(data.subject)
  ) {
    throw new TypeError("Subject is required (max 160 chars, no newlines).");
  }
  const previewText = typeof data.previewText === "string" ? data.previewText.slice(0, 180) : "";
  const updated = await prisma.emailTemplate.upsert({
    where: { waitListId_type: { waitListId: waitlist.id, type: enumType } },
    update: {
      subject: data.subject.trim(),
      previewText,
      ...content,
    },
    create: {
      waitListId: waitlist.id,
      type: enumType,
      subject: data.subject.trim(),
      previewText,
      header: "",
      subHeader: "",
      mainBody: content.renderedText,
      subBody: "",
      ...content,
    },
  });
  return normalizeEmailTemplate(updated);
}

export async function listEmailLogsOp(waitListId) {
  const [runs, broadcasts] = await Promise.all([
    prisma.automationRun.findMany({
      where: { waitListId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        recipe: { select: { id: true, type: true } },
        signUp: { select: { email: true } },
        steps: { select: { status: true, lastErrorCode: true } },
      },
    }),
    prisma.marketingBroadcast.findMany({
      where: { waitListId, status: { not: "DRAFT" } },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        recipientCount: true,
        sentAt: true,
        updatedAt: true,
      },
    }),
  ]);
  const items = [
    ...runs.map((run) => ({
      id: `run-${run.id}`,
      targetId: run.recipe.id,
      kind: "Automation",
      title: AUTOMATION_DEFAULTS[run.recipe.type]?.title || run.recipe.type,
      recipient: run.signUp.email,
      status: emailStatusLabel(run.status),
      statusCode: run.status,
      reason: (run.skipReason || run.steps.find((step) => step.lastErrorCode)?.lastErrorCode || "")
        .toLowerCase()
        .replaceAll("_", " "),
      at: (run.finishedAt || run.scheduledAt || run.createdAt).toISOString(),
    })),
    ...broadcasts.map((broadcast) => ({
      id: `bc-${broadcast.id}`,
      targetId: broadcast.id,
      kind: "Broadcast",
      title: broadcast.name || broadcast.subject || "Untitled broadcast",
      recipient: `${broadcast.recipientCount} recipient${broadcast.recipientCount === 1 ? "" : "s"}`,
      status: emailStatusLabel(broadcast.status),
      statusCode: broadcast.status,
      reason: "",
      at: (broadcast.sentAt || broadcast.updatedAt).toISOString(),
    })),
  ];
  items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return items.slice(0, 100);
}

export async function listSubscribersOp({
  waitlist,
  status = "ALL",
  search = "",
  country = "",
  city = "",
  utmSource = "",
  device = "",
  sortBy = "createdAt",
  sortOrder = "desc",
  limit = 25,
  offset = 0,
}) {
  const where = {
    waitListId: waitlist.id,
    ...(status === "VERIFIED"
      ? { verifiedAt: { not: null } }
      : status === "UNVERIFIED"
        ? { verifiedAt: null }
        : {}),
    ...(search ? { email: { contains: search } } : {}),
    ...(country ? { country: { contains: country } } : {}),
    ...(city ? { city: { contains: city } } : {}),
    ...(utmSource ? { utmSource: { contains: utmSource } } : {}),
    ...(device
      ? { OR: [{ deviceType: { contains: device } }, { device: { contains: device } }] }
      : {}),
  };

  const selectFields = {
    id: true,
    email: true,
    phone: true,
    referralCode: true,
    points: true,
    country: true,
    city: true,
    deviceType: true,
    utmSource: true,
    utmMedium: true,
    utmCampaign: true,
    verifiedAt: true,
    marketingConsentAt: true,
    marketingUnsubscribedAt: true,
    createdAt: true,
  };

  let subscribers;
  let total;
  let precomputedPositions = null;

  if (sortBy === "position" && waitlist.showReferrals) {
    const direction = sortOrder === "asc" ? Prisma.raw("ASC") : Prisma.raw("DESC");
    const [count, ranked] = await Promise.all([
      prisma.signUp.count({ where }),
      prisma.$queryRaw`
        WITH referral_scores AS (
          SELECT referral."referredById" AS "referrerId", COUNT(*) AS score
          FROM "referrals" AS referral
          INNER JOIN "sign_ups" AS referred ON referred."id" = referral."signUpId"
          INNER JOIN "sign_ups" AS referrer
            ON referrer."id" = referral."referredById"
           AND referrer."waitListId" = referred."waitListId"
          WHERE referred."waitListId" = ${waitlist.id}
            AND referred."verifiedAt" IS NOT NULL
            AND referrer."verifiedAt" IS NOT NULL
            AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
            AND referral."referredById" IS NOT NULL
            AND referral."referredById" <> referral."signUpId"
          GROUP BY referral."referredById"
        ), ranked AS (
          SELECT signup."id",
            ROW_NUMBER() OVER (
              ORDER BY COALESCE(score.score, 0) DESC, REPLACE(signup."createdAt", ' ', 'T') ASC, signup."id" ASC
            ) AS position
          FROM "sign_ups" AS signup
          LEFT JOIN referral_scores AS score ON score."referrerId" = signup."id"
          WHERE signup."waitListId" = ${waitlist.id}
        )
        SELECT ranked."id", ranked.position
        FROM ranked
        INNER JOIN "sign_ups" AS s ON s."id" = ranked."id"
        WHERE s."waitListId" = ${waitlist.id}
          AND (${status} = 'ALL' OR (${status} = 'VERIFIED' AND s."verifiedAt" IS NOT NULL) OR (${status} = 'UNVERIFIED' AND s."verifiedAt" IS NULL))
          AND (${search} = '' OR LOWER(s."email") LIKE LOWER(${`%${search}%`}))
          AND (${country} = '' OR LOWER(COALESCE(s."country", '')) LIKE LOWER(${`%${country}%`}))
          AND (${city} = '' OR LOWER(COALESCE(s."city", '')) LIKE LOWER(${`%${city}%`}))
          AND (${utmSource} = '' OR LOWER(COALESCE(s."utmSource", '')) LIKE LOWER(${`%${utmSource}%`}))
          AND (${device} = '' OR LOWER(COALESCE(s."deviceType", '')) LIKE LOWER(${`%${device}%`}) OR LOWER(COALESCE(s."device", '')) LIKE LOWER(${`%${device}%`}))
        ORDER BY ranked.position ${direction}
        LIMIT ${limit} OFFSET ${offset}
      `,
    ]);
    total = count;
    precomputedPositions = new Map(ranked.map((r) => [r.id, Number(r.position)]));
    const ids = ranked.map((r) => r.id);
    const rows = ids.length
      ? await prisma.signUp.findMany({ where: { id: { in: ids } }, select: selectFields })
      : [];
    const byId = new Map(rows.map((r) => [r.id, r]));
    subscribers = ids.map((id) => byId.get(id)).filter(Boolean);
  } else {
    const orderBy =
      sortBy === "position"
        ? [{ createdAt: sortOrder }, { id: sortOrder }]
        : sortBy === "points"
          ? [{ points: sortOrder }, { id: "asc" }]
          : [{ createdAt: sortOrder }, { id: sortOrder }];
    [total, subscribers] = await Promise.all([
      prisma.signUp.count({ where }),
      prisma.signUp.findMany({
        where,
        select: selectFields,
        orderBy,
        take: limit,
        skip: offset,
      }),
    ]);
  }

  const ids = subscribers.map((s) => s.id);
  const [positions, referralCounts] = await Promise.all([
    precomputedPositions
      ? Promise.resolve(precomputedPositions)
      : getCampaignPositions(prisma, waitlist.id, ids),
    waitlist.showReferrals
      ? getEligibleReferralCounts(prisma, waitlist.id, ids)
      : Promise.resolve(new Map()),
  ]);

  return {
    total,
    items: subscribers.map((s) => ({
      id: s.id,
      email: s.email,
      phone: s.phone,
      referralCode: s.referralCode,
      position: positions.get(s.id) ?? null,
      points: s.points,
      referralCount: referralCounts.get(s.id) ?? 0,
      isVerified: Boolean(s.verifiedAt),
      verifiedAt: s.verifiedAt,
      marketingConsent: Boolean(s.marketingConsentAt && !s.marketingUnsubscribedAt),
      marketingUnsubscribedAt: s.marketingUnsubscribedAt,
      country: s.country,
      city: s.city,
      device: s.deviceType,
      utmSource: s.utmSource,
      utmMedium: s.utmMedium,
      utmCampaign: s.utmCampaign,
      createdAt: s.createdAt,
    })),
  };
}

export async function createOrUpdateBroadcastOp({ waitlist, broadcastId = null, data }) {
  const entitlements = await getWorkspaceEntitlements(prisma, waitlist.workspaceId);
  requireFeature(entitlements, "emailMarketing");

  const subject = typeof data?.subject === "string" ? data.subject.trim() : "";
  if (!subject || subject.length > 160 || /[\r\n]/.test(subject)) {
    throw new TypeError("Subject is required (max 160 chars, no newlines).");
  }
  const previewText =
    typeof data?.previewText === "string" ? data.previewText.trim().slice(0, 180) : "";
  const rawName = typeof data?.name === "string" ? data.name.trim().slice(0, 120) : "";
  const content = normalizeComposerInput({
    editorDocument: data?.editorDocument,
    renderedHtml: data?.renderedHtml,
    renderedText: data?.renderedText ?? data?.body ?? data?.text,
    body: data?.body,
    text: data?.text,
  });
  const segment = data?.segment ? normalizeSegment(data.segment) : "ALL";

  if (broadcastId) {
    const existing = await prisma.marketingBroadcast.findFirst({
      where: { id: broadcastId, waitListId: waitlist.id },
      select: { id: true, status: true },
    });
    if (!existing) throw new Error("Broadcast not found.");
    if (existing.status !== "DRAFT") {
      throw new TypeError("Only draft broadcasts can be edited.");
    }
    return prisma.marketingBroadcast.update({
      where: { id: existing.id },
      data: {
        ...(rawName ? { name: rawName } : {}),
        subject,
        previewText,
        body: content.renderedText,
        editorDocument: content.editorDocument,
        renderedHtml: content.renderedHtml,
        renderedText: content.renderedText,
        segment,
      },
    });
  }

  return prisma.marketingBroadcast.create({
    data: {
      waitListId: waitlist.id,
      name: rawName || subject.slice(0, 80),
      subject,
      previewText,
      body: content.renderedText,
      editorDocument: content.editorDocument,
      renderedHtml: content.renderedHtml,
      renderedText: content.renderedText,
      segment,
      status: "DRAFT",
    },
  });
}

export async function deleteBroadcastOp({ waitListId, broadcastId }) {
  const existing = await prisma.marketingBroadcast.findFirst({
    where: { id: broadcastId, waitListId },
    select: { id: true, status: true },
  });
  if (!existing) throw new Error("Broadcast not found.");
  if (!["DRAFT", "CANCELED"].includes(existing.status)) {
    throw new TypeError("Cancel scheduled or sending broadcasts before deleting.");
  }
  await prisma.marketingBroadcast.delete({ where: { id: existing.id } });
  return { deleted: true, id: existing.id };
}

export async function updateWaitlistSubscriberOp({ waitlist, subscriberId, updates }) {
  const existing = await prisma.signUp.findFirst({
    where: { id: subscriberId, waitListId: waitlist.id },
    select: {
      id: true,
      email: true,
      phone: true,
      customFields: true,
      verifiedAt: true,
      marketingConsentAt: true,
      marketingUnsubscribedAt: true,
      unsubscribeTokenHash: true,
    },
  });
  if (!existing) throw new Error("Subscriber not found.");

  const form = parseTemplateSnapshotOrDefault(waitlist).form;
  const data = {};
  if (typeof updates?.verified === "boolean") {
    data.verifiedAt = updates.verified ? existing.verifiedAt || new Date() : null;
  }
  if (typeof updates?.phone === "string") {
    const cleaned = updates.phone.trim();
    if (!cleaned) {
      data.phone = null;
    } else {
      const phoneError = validatePhoneNumber(cleaned, { ...form, collectPhone: true });
      if (phoneError) {
        throw new TypeError(phoneError);
      }
      data.phone = normalizePhoneNumber(cleaned) || cleaned;
    }
  } else if (updates?.phone === null) {
    data.phone = null;
  }
  if (updates?.customFields !== undefined) {
    if (updates.customFields === null) {
      data.customFields = null;
    } else if (typeof updates.customFields === "object") {
      const rawAnswers = Array.isArray(updates.customFields)
        ? updates.customFields
        : Object.entries(updates.customFields).map(([id, value]) => ({ id, value }));
      const sanitized = sanitizeCustomFieldAnswers(form, rawAnswers);
      if (sanitized.error) {
        throw new TypeError(sanitized.error);
      }
      data.customFields = sanitized.answers;
    } else {
      throw new TypeError("customFields must be an array or object.");
    }
  }
  let consentAction = null;
  if (typeof updates?.marketingConsent === "boolean") {
    const now = new Date();
    if (updates.marketingConsent) {
      data.marketingConsentAt = existing.marketingConsentAt || now;
      data.marketingUnsubscribedAt = null;
      if (!existing.unsubscribeTokenHash) {
        const token = createUnsubscribeToken(existing.id, waitlist.id);
        data.unsubscribeTokenHash = hashUnsubscribeToken(token);
      }
      consentAction = "OPTED_IN";
    } else {
      data.marketingUnsubscribedAt = now;
      consentAction = "OPTED_OUT";
    }
  }

  const updated = await prisma.signUp.update({
    where: { id: existing.id },
    data,
  });
  if (consentAction) {
    await prisma.marketingConsentEvent.create({
      data: {
        waitListId: waitlist.id,
        signUpId: existing.id,
        action: consentAction,
        source: consentAction === "OPTED_IN" ? "PUBLIC_SIGNUP" : "DASHBOARD_BULK",
        ...(consentAction === "OPTED_IN" ? { consentText: MARKETING_CONSENT_COPY } : {}),
      },
    });
  }
  const summary = await summarizeSignupRewards(prisma, waitlist.id, updated);
  return {
    id: updated.id,
    email: updated.email,
    phone: updated.phone,
    referralCode: updated.referralCode,
    position: summary.position ?? null,
    points: updated.points,
    referralCount: summary.referrals ?? 0,
    isVerified: Boolean(updated.verifiedAt),
    verifiedAt: updated.verifiedAt,
    marketingConsent: Boolean(updated.marketingConsentAt && !updated.marketingUnsubscribedAt),
    marketingUnsubscribedAt: updated.marketingUnsubscribedAt,
    customFields: updated.customFields,
    createdAt: updated.createdAt,
  };
}

export async function deleteWaitlistSubscriberOp({ waitlistId, subscriberId }) {
  const existing = await prisma.signUp.findFirst({
    where: { id: subscriberId, waitListId: waitlistId },
    select: { id: true, email: true },
  });
  if (!existing) throw new Error("Subscriber not found.");
  await prisma.signUp.delete({ where: { id: existing.id } });
  return { deleted: true, id: existing.id, email: existing.email };
}

export async function sendTestEmailDirectOp({
  userId,
  waitlist,
  kind,
  targetId = null,
  templateType = null,
  to,
}) {
  if (typeof to !== "string" || to.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
    throw new TypeError("Enter one valid test email address.");
  }
  const recipient = to.trim();
  const entitlements = await getWorkspaceEntitlements(prisma, waitlist.workspaceId);
  requireFeature(entitlements, "emailMarketing");

  await consumePublicBudget(prisma, {
    kind: "testEmail",
    campaignId: waitlist.workspaceId || waitlist.id,
    actorId: userId,
    email: recipient,
  });

  const waitlistRow = await prisma.waitList.findUnique({
    where: { id: waitlist.id },
    select: {
      id: true,
      name: true,
      templateSnapshot: true,
      publicationRevisions: { orderBy: { revision: "desc" }, take: 1, select: { snapshot: true } },
    },
  });
  if (!waitlistRow) throw new Error("Waitlist not found.");
  const publishedSnap = waitlistRow.publicationRevisions?.[0]?.snapshot ?? null;
  const brand = emailBrandFromSnapshot(publishedSnap ?? waitlistRow.templateSnapshot);
  const vars = seedPreviewVars(waitlistRow.name);

  let subject;
  let previewText = "";
  let html;
  let text;

  if (kind === "template") {
    const enumType = emailTemplateType(templateType);
    if (!enumType) {
      throw new TypeError(
        "templateType must be one of: signup, offboarding, referral-congrats, launch-invite.",
      );
    }
    const row = await prisma.emailTemplate.findUnique({
      where: { waitListId_type: { waitListId: waitlist.id, type: enumType } },
    });
    if (!row) throw new Error("Save this template before sending a test.");
    subject = `[Test] ${interpolateVars(row.subject || waitlistRow.name, vars)}`;
    previewText = interpolateVars(row.previewText || "", vars);
    const contentHtml = row.renderedHtml
      ? interpolateVarsHtml(row.renderedHtml, vars)
      : renderEmailMarkdown(interpolateVars(legacyEmailContent(row), vars));
    const contentText = interpolateVars(row.renderedText || legacyEmailContent(row), vars);
    html = subscriberEmailHtml({
      name: waitlistRow.name,
      content: contentHtml,
      previewText,
      unsubscribeUrl: vars.unsubscribe_url,
      brand,
    });
    text = `${contentText}\n\n${waitlistRow.name}`;
  } else if (kind === "broadcast") {
    if (typeof targetId !== "string" || !targetId) {
      throw new TypeError("targetId (broadcastId) is required for broadcast test emails.");
    }
    const broadcast = await prisma.marketingBroadcast.findFirst({
      where: { id: targetId, waitListId: waitlist.id },
    });
    if (!broadcast) throw new Error("Broadcast not found.");
    if (!String(broadcast.subject || "").trim()) {
      throw new TypeError("Broadcast has no subject.");
    }
    subject = `[Test] ${interpolateVars(broadcast.subject, vars)}`;
    previewText = interpolateVars(broadcast.previewText || "", vars);
    const contentHtml = broadcast.renderedHtml
      ? interpolateVarsHtml(broadcast.renderedHtml, vars)
      : renderEmailMarkdown(interpolateVars(broadcast.body || "", vars));
    const contentText = interpolateVars(broadcast.renderedText || broadcast.body || "", vars);
    html = subscriberEmailHtml({
      name: waitlistRow.name,
      content: contentHtml,
      previewText,
      unsubscribeUrl: vars.unsubscribe_url,
      brand,
    });
    text = `${contentText}\n\n${waitlistRow.name}`;
  } else if (kind === "automation") {
    if (typeof targetId !== "string" || !targetId) {
      throw new TypeError("targetId (recipeId) is required for automation test emails.");
    }
    const recipe = await prisma.automationRecipe.findFirst({
      where: { id: targetId, waitListId: waitlist.id },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!recipe) throw new Error("Automation recipe not found.");
    const cfg = normalizeAutomationConfig(recipe.type, recipe.versions[0]?.config);
    subject = `[Test] ${interpolateVars(cfg.subject, vars)}`;
    previewText = interpolateVars(cfg.previewText || "", vars);
    const contentHtml = cfg.renderedHtml
      ? interpolateVarsHtml(cfg.renderedHtml, vars)
      : renderEmailMarkdown(interpolateVars(cfg.renderedText || cfg.body || "", vars));
    const contentText = interpolateVars(cfg.renderedText || cfg.body || "", vars);
    html = subscriberEmailHtml({
      name: waitlistRow.name,
      content: contentHtml,
      previewText,
      unsubscribeUrl: vars.unsubscribe_url,
      brand,
    });
    text = `${contentText}\n\n${waitlistRow.name}`;
  } else {
    throw new TypeError("Unsupported test email kind.");
  }

  const provider = await senderForWaitlist(waitlist.id);
  if (!provider?.apiKey) {
    throw new Error("Connect a Resend sender before sending test emails.");
  }
  const { data: sendResult, error } = await new Resend(provider.apiKey).emails.send({
    from: provider.fromEmail,
    to: recipient,
    replyTo: provider.replyTo,
    subject,
    html,
    text,
  });
  if (error) {
    throw new Error(`Resend error: ${error.name} ${error.message}`);
  }
  return { sent: true, to: recipient, messageId: sendResult?.id ?? null };
}
