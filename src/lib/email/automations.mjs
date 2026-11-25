import { getCampaignPosition } from "../campaigns/referral-position.mjs";
import { isUniqueConstraintError } from "../db/sqlite-helpers.mjs";
import { emailBrandFromSnapshot } from "./brand.mjs";
import { interpolateEmail, subscriberEmailHtml, validateComposerContent } from "./composer.mjs";
import { applyKnownProviderEvents } from "./suppression.mjs";
import { createUnsubscribeToken } from "./unsubscribe.mjs";
import { interpolateVars, resolveSubscriberVars } from "./variables.mjs";

const EMAIL_STEP = "send_email";

export const AUTOMATION_DEFAULTS = {
  WELCOME: {
    title: "Welcome after confirmation",
    description: "Send a short welcome once a subscriber confirms their address.",
    trigger: "SIGNUP_VERIFIED",
    delayMinutes: 0,
    subject: "You’re on {{waitlist}}",
    body: "Thanks for confirming your email. You're on the {{waitlist}} list. Your personal link is {{referral_link}}. We'll keep you posted when there's news.",
  },
  REFERRAL_REMINDER: {
    title: "Referral reminder",
    description: "A single reminder for subscribers who have not referred anyone yet.",
    trigger: "SIGNUP_VERIFIED",
    delayMinutes: 1440,
    subject: "Share {{waitlist}} with a friend",
    body: "Know someone who would love this? Share your personal link: {{referral_link}}",
  },
  REFERRAL_MILESTONE: {
    title: "Referral milestone",
    description: "Celebrate when a subscriber reaches a verified referral goal.",
    trigger: "REFERRAL_VERIFIED",
    delayMinutes: 0,
    milestoneCount: 3,
    subject: "You helped {{waitlist}} grow",
    body: "You’ve brought {{referral_count}} people to {{waitlist}}. Thank you for sharing. Your personal link: {{referral_link}}",
  },
  WELCOME_FOLLOWUP: {
    title: "Welcome follow-up",
    description: "Second note in the welcome series for confirmed subscribers who opted in.",
    trigger: "SIGNUP_VERIFIED",
    delayMinutes: 4320,
    subject: "A quick tour of {{waitlist}}, {{name}}",
    body: "Hi {{name}}, you’re #{{position}} on {{waitlist}} with {{points}} points. Your personal link is {{referral_link}} - every friend who joins moves you up.",
  },
  LAUNCH_COUNTDOWN: {
    title: "Launch countdown",
    description: "Build anticipation in the final days before launch.",
    trigger: "SIGNUP_VERIFIED",
    delayMinutes: 10080,
    subject: "{{waitlist}} launches soon - you’re #{{position}}",
    body: "Hi {{name}}, launch day is close and you’re holding #{{position}} on {{waitlist}} with {{points}} points. Share {{referral_link}} to climb higher before we open the doors.",
  },
};

const ELIGIBLE_REFERRAL_STATUSES = ["CLEAR", "APPROVED"];
const cleanText = (value, max) =>
  typeof value === "string"
    ? value
        .trim()
        .replace(/[\r\n]+/g, " ")
        .slice(0, max)
    : "";

export function normalizeAutomationConfig(type, input) {
  const defaults = AUTOMATION_DEFAULTS[type];
  if (!defaults) throw new TypeError("Choose a supported automation recipe.");
  const delayMinutes = Number(input?.delayMinutes);
  if (!Number.isInteger(delayMinutes) || delayMinutes < 0 || delayMinutes > 10080)
    throw new TypeError("Choose a delay between 0 and 168 hours.");
  const config = {
    trigger: defaults.trigger,
    delayMinutes,
    subject: cleanText(input?.subject, 160),
    body: typeof input?.body === "string" ? input.body.trim().slice(0, 3000) : "",
  };
  if (!config.subject || !config.body)
    throw new TypeError("Add a subject and message before saving.");
  if (input?.editorDocument) Object.assign(config, validateComposerContent(input));
  if (type === "REFERRAL_MILESTONE") {
    const milestoneCount = Number(input?.milestoneCount);
    if (!Number.isInteger(milestoneCount) || milestoneCount < 1 || milestoneCount > 100)
      throw new TypeError("Choose a referral milestone between 1 and 100.");
    config.milestoneCount = milestoneCount;
  }
  return config;
}

export async function ensureAutomationRecipes(db, waitListId) {
  await Promise.all(
    Object.entries(AUTOMATION_DEFAULTS).map(([type, defaults]) =>
      db.automationRecipe.upsert({
        where: { waitListId_type: { waitListId, type } },
        update: {},
        create: {
          waitListId,
          type,
          versions: { create: { version: 1, config: normalizeAutomationConfig(type, defaults) } },
        },
      }),
    ),
  );
}

async function createRun(db, { recipe, version, waitListId, signUpId, triggerKey, config, now }) {
  const existing = await db.automationRun.findUnique({
    where: { recipeId_triggerKey: { recipeId: recipe.id, triggerKey } },
    select: { id: true },
  });
  if (existing) return false;

  const scheduledAt = new Date(now.getTime() + config.delayMinutes * 60_000);
  const outboxEventKey = `automation.step:${recipe.id}:${triggerKey}`;
  let run;
  try {
    run = await db.automationRun.create({
      data: {
        recipeId: recipe.id,
        recipeVersionId: version.id,
        waitListId,
        signUpId,
        triggerKey,
        scheduledAt,
        steps: {
          create: {
            stepKey: EMAIL_STEP,
            position: 0,
            availableAt: scheduledAt,
            outboxEventKey,
          },
        },
      },
      include: { steps: true },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return false;
    throw error;
  }
  const step = run.steps[0];
  try {
    await db.outboxEvent.create({
      data: {
        eventKey: step.outboxEventKey,
        type: "MARKETING_AUTOMATION_STEP_REQUESTED",
        waitListId,
        availableAt: step.availableAt,
        payload: { automationStepId: step.id },
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
  }
  return true;
}

async function getEnabledRecipeVersion(db, recipeId, type) {
  const recipe = await db.automationRecipe.findUnique({ where: { id: recipeId } });
  if (!recipe || recipe.status !== "ENABLED" || recipe.type !== type) return null;
  const version = await db.automationRecipeVersion.findUnique({
    where: { recipeId_version: { recipeId, version: recipe.currentVersion } },
  });
  if (!version) return null;
  return { recipe, version, config: normalizeAutomationConfig(type, version.config) };
}

export async function processAutomationTrigger(db, event, now = new Date()) {
  const payload = event?.payload;
  if (
    typeof payload?.signUpId !== "string" ||
    event.type !== "MARKETING_AUTOMATION_TRIGGER_REQUESTED"
  ) {
    throw new TypeError("Automation trigger is invalid.");
  }
  const signup = await db.signUp.findFirst({
    where: { id: payload.signUpId, waitListId: event.waitListId },
    include: { waitList: { select: { id: true, status: true } } },
  });
  if (!signup || signup.waitList.status !== "PUBLISHED" || !signup.verifiedAt) {
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: "DELIVERED",
        processedAt: now,
        lockedAt: null,
        payload: { signUpId: payload.signUpId },
        lastErrorCode: null,
      },
    });
    return { scheduled: 0 };
  }

  const recipes = await db.automationRecipe.findMany({
    where: { waitListId: event.waitListId, status: "ENABLED" },
    select: { id: true, type: true },
  });
  let scheduled = 0;
  const enabled = new Map(recipes.map((recipe) => [recipe.type, recipe.id]));

  if (signup.marketingConsentAt && !signup.marketingUnsubscribedAt) {
    for (const type of ["WELCOME", "WELCOME_FOLLOWUP", "REFERRAL_REMINDER", "LAUNCH_COUNTDOWN"]) {
      const recipeId = enabled.get(type);
      const current = recipeId ? await getEnabledRecipeVersion(db, recipeId, type) : null;
      if (!current) continue;
      const { recipe, version, config } = current;
      if (
        await createRun(db, {
          recipe,
          version,
          waitListId: event.waitListId,
          signUpId: signup.id,
          triggerKey: `signup-verified:${signup.id}`,
          config,
          now,
        })
      )
        scheduled++;
    }
  }

  const referral = await db.referral.findUnique({
    where: { signUpId: signup.id },
    select: { referredById: true, reviewStatus: true },
  });
  const milestoneRecipeId = enabled.get("REFERRAL_MILESTONE");
  const milestoneCurrent = milestoneRecipeId
    ? await getEnabledRecipeVersion(db, milestoneRecipeId, "REFERRAL_MILESTONE")
    : null;
  const milestoneRecipe = milestoneCurrent?.recipe;
  const milestoneVersion = milestoneCurrent?.version;
  if (
    referral?.referredById &&
    ELIGIBLE_REFERRAL_STATUSES.includes(referral.reviewStatus) &&
    milestoneVersion
  ) {
    const config = milestoneCurrent.config;
    const referrer = await db.signUp.findFirst({
      where: {
        id: referral.referredById,
        waitListId: event.waitListId,
        verifiedAt: { not: null },
        marketingConsentAt: { not: null },
        marketingUnsubscribedAt: null,
      },
      select: { id: true },
    });
    if (referrer) {
      const count = await db.referral.count({
        where: {
          referredById: referrer.id,
          reviewStatus: { in: ELIGIBLE_REFERRAL_STATUSES },
          signUp: { is: { waitListId: event.waitListId, verifiedAt: { not: null } } },
        },
      });
      if (
        count >= config.milestoneCount &&
        (await createRun(db, {
          recipe: milestoneRecipe,
          version: milestoneVersion,
          waitListId: event.waitListId,
          signUpId: referrer.id,
          triggerKey: `referral-milestone:${referrer.id}:${config.milestoneCount}`,
          config,
          now,
        }))
      )
        scheduled++;
    }
  }

  await db.outboxEvent.update({
    where: { id: event.id },
    data: {
      status: "DELIVERED",
      processedAt: now,
      lockedAt: null,
      payload: { signUpId: signup.id },
      lastErrorCode: null,
    },
  });
  return { scheduled };
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
}

function fillCopy(value, vars) {
  return interpolateVars(value, vars);
}

function automationHtml({ waitListName, body, unsubscribeUrl }) {
  const paragraphs = escapeHtml(body)
    .split(/\n{2,}/)
    .map((part) => `<p>${part.replaceAll("\n", "<br>")}</p>`)
    .join("");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="margin:0;background:#f5f5f1;color:#191919;font:16px/1.6 Arial,sans-serif"><main style="max-width:600px;margin:32px auto;padding:32px;background:#fff;border:1px solid #e8e8e2;border-radius:16px"><p style="margin:0 0 24px;color:#70706a;font-size:13px">${escapeHtml(waitListName)}</p>${paragraphs}<hr style="border:0;border-top:1px solid #e8e8e2;margin:32px 0"><p style="color:#70706a;font-size:13px">You’re receiving this because you opted in to updates about this waitlist.</p><p style="font-size:13px"><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe from updates</a></p></main></body></html>`;
}

export async function dispatchAutomationStep(
  db,
  event,
  payload,
  send,
  now,
  attempt,
  result,
  canSendMarketing = async () => true,
) {
  if (typeof payload?.automationStepId !== "string")
    throw new TypeError("Automation step is invalid.");
  const step = await db.automationRunStep.findUnique({
    where: { id: payload.automationStepId },
    include: {
      run: { include: { recipeVersion: true, recipe: true, waitList: true, signUp: true } },
    },
  });
  if (!step || step.outboxEventKey !== event.eventKey) {
    await db.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: "FAILED",
        processedAt: now,
        lockedAt: null,
        payload: {},
        lastErrorCode: "INVALID_AUTOMATION_STEP",
      },
    });
    result.failed++;
    return;
  }
  if (!(await canSendMarketing(step.run?.waitList?.workspaceId))) {
    await db.$transaction([
      db.automationRunStep.updateMany({
        where: { id: step.id, status: { in: ["PENDING", "PROCESSING"] } },
        data: { status: "SKIPPED", finishedAt: now, lastErrorCode: "PLAN_REQUIRES_PRO" },
      }),
      db.automationRun.updateMany({
        where: { id: step.runId, status: { in: ["PENDING", "PROCESSING"] } },
        data: { status: "SKIPPED", finishedAt: now, skipReason: "PLAN_REQUIRES_PRO" },
      }),
      db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          processedAt: now,
          lockedAt: null,
          payload: { automationStepId: step.id },
          lastErrorCode: "PLAN_REQUIRES_PRO",
        },
      }),
    ]);
    result.skipped++;
    return;
  }
  const recipeRecord = await db.automationRecipe.findUnique({
    where: { id: step.run.recipeId },
    select: { status: true },
  });
  let claimed = false;
  if (recipeRecord?.status === "ENABLED") {
    const stepClaim = await db.automationRunStep.updateMany({
      where: { id: step.id, status: { in: ["PENDING", "PROCESSING"] } },
      data: { status: "PROCESSING", lastErrorCode: null },
    });
    if (stepClaim.count === 1) {
      await db.automationRun.updateMany({
        where: { id: step.runId, status: { in: ["PENDING", "PROCESSING"] } },
        data: { status: "PROCESSING", startedAt: step.run.startedAt || now },
      });
      claimed = true;
    }
  }
  if (!claimed) {
    await db.$transaction([
      db.automationRunStep.updateMany({
        where: { id: step.id, status: { in: ["PENDING", "PROCESSING"] } },
        data: { status: "CANCELED", finishedAt: now, lastErrorCode: "AUTOMATION_PAUSED" },
      }),
      db.automationRun.updateMany({
        where: { id: step.runId, status: { in: ["PENDING", "PROCESSING"] } },
        data: { status: "CANCELED", finishedAt: now, skipReason: "AUTOMATION_PAUSED" },
      }),
      db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          processedAt: now,
          lockedAt: null,
          payload: { automationStepId: step.id },
          lastErrorCode: "AUTOMATION_CANCELED",
        },
      }),
    ]);
    result.skipped++;
    return;
  }

  const { run } = step;
  const { recipe, recipeVersion, signUp, waitList } = run;
  const type = recipe.type;
  const config = normalizeAutomationConfig(type, recipeVersion.config);
  const emailNormalized = String(signUp.emailNormalized || signUp.email)
    .trim()
    .toLowerCase();
  const suppression = waitList.workspaceId
    ? await db.emailSuppression.findUnique({
        where: {
          workspaceId_emailNormalized: { workspaceId: waitList.workspaceId, emailNormalized },
        },
      })
    : null;
  let reason =
    waitList.status !== "PUBLISHED"
      ? "WAITLIST_NOT_PUBLISHED"
      : !signUp.verifiedAt
        ? "EMAIL_NOT_VERIFIED"
        : !signUp.marketingConsentAt
          ? "CONSENT_REQUIRED"
          : signUp.marketingUnsubscribedAt
            ? "UNSUBSCRIBED"
            : suppression
              ? "SUPPRESSED"
              : null;

  let referralCount = 0;
  if (!reason && type === "REFERRAL_REMINDER") {
    referralCount = await db.referral.count({
      where: {
        referredById: signUp.id,
        reviewStatus: { in: ELIGIBLE_REFERRAL_STATUSES },
        signUp: { is: { waitListId: waitList.id, verifiedAt: { not: null } } },
      },
    });
    if (referralCount > 0) reason = "REFERRALS_ALREADY_VERIFIED";
  }
  if (!reason && type === "REFERRAL_MILESTONE") {
    referralCount = await db.referral.count({
      where: {
        referredById: signUp.id,
        reviewStatus: { in: ELIGIBLE_REFERRAL_STATUSES },
        signUp: { is: { waitListId: waitList.id, verifiedAt: { not: null } } },
      },
    });
    if (referralCount < config.milestoneCount) reason = "MILESTONE_NO_LONGER_MET";
  }

  if (reason) {
    await db.$transaction([
      db.automationRunStep.update({
        where: { id: step.id },
        data: { status: "SKIPPED", lastErrorCode: reason, finishedAt: now },
      }),
      db.automationRun.update({
        where: { id: run.id },
        data: { status: "SKIPPED", skipReason: reason, finishedAt: now },
      }),
      db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          processedAt: now,
          lockedAt: null,
          payload: { automationStepId: step.id },
          lastErrorCode: reason,
        },
      }),
    ]);
    result.skipped++;
    return;
  }

  const unsubscribeToken = createUnsubscribeToken(signUp.id, waitList.id);
  const baseUrl = String(process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");
  const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  // Position and referral-link vars are resolved per subscriber at send time
  // (server-side) so every automation carries personal data with fallbacks.
  const [position, totalSignups] = await Promise.all([
    type === "REFERRAL_MILESTONE" || type === "WELCOME_FOLLOWUP" || type === "LAUNCH_COUNTDOWN"
      ? getCampaignPosition(db, waitList.id, signUp.id)
      : Promise.resolve(null),
    db.signUp.count({ where: { waitListId: waitList.id } }),
  ]);
  if (type !== "REFERRAL_REMINDER" && type !== "REFERRAL_MILESTONE") {
    referralCount = await db.referral.count({
      where: {
        referredById: signUp.id,
        reviewStatus: { in: ELIGIBLE_REFERRAL_STATUSES },
        signUp: { is: { waitListId: waitList.id, verifiedAt: { not: null } } },
      },
    });
  }
  const vars = resolveSubscriberVars({
    waitlist: waitList,
    signup: signUp,
    position,
    referralCount,
    totalSignups,
  });

  try {
    const response = await send({
      to: signUp.email,
      subject: fillCopy(config.subject, vars)
        .replace(/[\r\n]+/g, " ")
        .slice(0, 200),
      html: config.renderedHtml
        ? subscriberEmailHtml({
            name: waitList.name || "Waitlist",
            content: interpolateEmail(config.renderedHtml, vars),
            unsubscribeUrl,
            brand: emailBrandFromSnapshot(waitList.templateSnapshot),
          })
        : automationHtml({
            waitListName: waitList.name || "Waitlist",
            body: fillCopy(config.body, vars),
            unsubscribeUrl,
          }),
      text: config.renderedText ? fillCopy(config.renderedText, vars) : undefined,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      idempotencyKey: event.eventKey,
      workspaceId: waitList.workspaceId,
      waitListId: waitList.id,
    });
    if (response?.error) throw response.error;
    const providerMessageId = response?.data?.id || response?.id;
    if (!providerMessageId)
      throw Object.assign(new Error("Provider accepted no message id"), {
        code: "MISSING_PROVIDER_ID",
      });
    await db.$transaction([
      db.automationRunStep.update({
        where: { id: step.id, status: "PROCESSING" },
        data: { status: "SENT", providerMessageId, finishedAt: now, lastErrorCode: null },
      }),
      db.automationRun.update({ where: { id: run.id }, data: { status: "SENT", finishedAt: now } }),
      db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "DELIVERED",
          providerMessageId,
          processedAt: now,
          lockedAt: null,
          payload: {
            automationStepId: step.id,
            recipientEmail: signUp.emailNormalized || signUp.email,
          },
          lastErrorCode: null,
        },
      }),
    ]);
    result.accepted++;
    try {
      await applyKnownProviderEvents(
        db,
        providerMessageId,
        waitList.workspaceId,
        signUp.emailNormalized || signUp.email,
      );
    } catch (error) {
      console.error(
        "Could not apply provider suppression event:",
        error?.message || "unknown error",
      );
    }
  } catch (error) {
    const code =
      String(error?.code || error?.name || "PROVIDER_ERROR")
        .replace(/[^A-Za-z0-9_.-]/g, "")
        .slice(0, 80) || "PROVIDER_ERROR";
    const currentRecipe = await db.automationRecipe.findUnique({
      where: { id: recipe.id },
      select: { status: true },
    });
    const retryable =
      error?.statusCode === 429 ||
      error?.statusCode >= 500 ||
      (error?.statusCode === 409 && error?.code === "concurrent_idempotent_requests") ||
      error?.name === "TypeError";
    const canRetry = retryable && attempt < 6 && currentRecipe?.status === "ENABLED";
    const canceled = retryable && currentRecipe?.status !== "ENABLED";
    const delay = Math.min(30_000 * 2 ** Math.min(attempt - 1, 6), 60 * 60 * 1000);
    await db.$transaction([
      db.automationRunStep.update({
        where: { id: step.id },
        data: {
          status: canRetry ? "PROCESSING" : canceled ? "CANCELED" : "FAILED",
          lastErrorCode: canceled ? "AUTOMATION_PAUSED" : code,
          ...(canRetry ? {} : { finishedAt: now }),
        },
      }),
      db.automationRun.update({
        where: { id: run.id },
        data: {
          status: canRetry ? "PROCESSING" : canceled ? "CANCELED" : "FAILED",
          ...(canceled ? { skipReason: "AUTOMATION_PAUSED" } : {}),
          ...(canRetry ? {} : { finishedAt: now }),
        },
      }),
      db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: canRetry ? "PENDING" : "FAILED",
          availableAt: canRetry ? new Date(now.getTime() + delay) : now,
          processedAt: canRetry ? null : now,
          lockedAt: null,
          payload: { automationStepId: step.id },
          lastErrorCode: canceled ? "AUTOMATION_PAUSED" : code,
        },
      }),
    ]);
    if (canRetry) result.retried++;
    else if (canceled) result.skipped++;
    else result.failed++;
  }
}
