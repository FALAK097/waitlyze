import {
  checkCountryRules,
  checkEmailDomainRules,
  getPublishedFormConfig,
  pickCustomFields,
  resolveSuccessRedirect,
  sanitizeCustomFieldAnswers,
  validatePhoneNumber,
} from "@/lib/campaigns/form-rules.mjs";
import { getCampaignPosition } from "@/lib/campaigns/referral-position.mjs";
import { findSignupByEmail } from "@/lib/campaigns/signup-lookup.mjs";
import prisma from "@/lib/prisma";
import { TurnstileMisconfiguredError, verifyTurnstileToken } from "@/lib/security/turnstile.mjs";
import { validateSignupEmail } from "@/utils/server/email-validation.mjs";

// Builds the "already signed up" success payload. Duplicates resolve to the
// existing signup's position + referral link (HTTP 200) instead of erroring,
// in the exact shape of a fresh signup with outcome "returning" so browser
// clients render the cockpit identically.
//
// Anti-enumeration note: this is deliberately a membership oracle — probing an
// email reveals whether it joined this waitlist. That is the documented
// trade-off for the "return my position" UX. It stays sane because (a) the
// route applies per-email/IP public rate limiting before reaching here, (b)
// the response reveals nothing beyond what the thank-you page would show its
// owner (position, referral link), and (c) no cross-waitlist information
// leaks: unknown emails fall through to normal creation.
export const duplicateSignupResponse = async (waitListId, email) => {
  const existing =
    (await findSignupByEmail(prisma, waitListId, email, {
      referrals: true,
      referredBy: true,
    })) ??
    (await prisma.signUp.findFirst({
      where: {
        waitListId,
        emailNormalized: null,
        email: { equals: typeof email === "string" ? email.trim() : "", mode: "insensitive" },
      },
      include: { referrals: true, referredBy: true },
    }));
  if (!existing) return null;
  const rank = await getCampaignPosition(prisma, waitListId, existing.id);
  const referrals = Array.isArray(existing.referrals) ? existing.referrals : [];
  const redirectUrl = resolveSuccessRedirect(await getPublishedFormConfig(prisma, waitListId));
  return Response.json(
    {
      message: "You're already on this waitlist. Here are your current details.",
      signUp: {
        id: existing.id,
        email: existing.email,
        uniqueUserId: existing.uniqueUserId,
        waitListId: existing.waitListId,
        rank,
        verified: !!existing.verifiedAt,
        outcome: "returning",
        referralCount: referrals.length,
        referralCode: existing.referralCode,
        ...(redirectUrl ? { redirectUrl } : {}),
      },
    },
    { status: 200 },
  );
};

const checkIfRequestIsValid = async (body, context = {}) => {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof body.waitListId !== "string" ||
    !body.waitListId ||
    body.waitListId.length > 128 ||
    typeof body.hypeSession !== "string" ||
    !body.hypeSession.trim() ||
    body.hypeSession.length > 256
  ) {
    return Response.json(
      { message: "A valid waitlist and browser identifier are required." },
      { status: 400 },
    );
  }
  if (typeof body.email !== "string" || !body.email.trim()) {
    return Response.json(
      {
        message: "Email is required",
      },
      {
        status: 400,
      },
    );
  }
  const emailError = validateSignupEmail(body.email);
  if (emailError) {
    return Response.json({ message: emailError }, { status: 400 });
  }
  if (!body.waitListId) {
    return Response.json(
      {
        message: "WaitList ID is required",
      },
      { status: 400 },
    );
  }
  const isValidWaitList = await prisma.waitList.findUnique({
    where: {
      id: body.waitListId,
      status: "PUBLISHED",
    },
  });
  if (!isValidWaitList) {
    return Response.json(
      {
        message: "Invalid WaitList ID",
      },
      { status: 400 },
    );
  }
  // Per-form join rules, enforced pre-DB so rejected signups never touch the
  // signup transaction. createCampaignSignup re-checks the same rules inside
  // the transaction as the authority for paths that skip this validator.
  const form = await getPublishedFormConfig(prisma, body.waitListId);
  if (form) {
    const domainError = checkEmailDomainRules(form, body.email);
    if (domainError) return Response.json({ message: domainError }, { status: 400 });
    const countryError = checkCountryRules(form, context.country);
    if (countryError) return Response.json({ message: countryError }, { status: 400 });
    const phoneError = validatePhoneNumber(body.phone, form);
    if (phoneError) return Response.json({ message: phoneError }, { status: 400 });
    const fields = sanitizeCustomFieldAnswers(form, pickCustomFields(body));
    if (fields.error) return Response.json({ message: fields.error }, { status: 400 });
    if (form.requireTurnstile) {
      if (typeof body.turnstileToken !== "string" || !body.turnstileToken) {
        return Response.json(
          { message: "Complete the verification challenge and try again." },
          { status: 400 },
        );
      }
      let verified = false;
      try {
        verified = await verifyTurnstileToken(body.turnstileToken, { ip: context.ip });
      } catch (error) {
        if (error instanceof TurnstileMisconfiguredError) {
          console.error("Turnstile misconfigured for waitlist", body.waitListId);
          return Response.json(
            { message: "Signups are temporarily unavailable. Please try again later." },
            { status: 500 },
          );
        }
        throw error;
      }
      if (!verified) {
        return Response.json(
          { message: "Verification challenge failed. Please try again." },
          { status: 400 },
        );
      }
    }
  }
};

export const validateRequest = async (body, context = {}) => {
  let validator = await checkIfRequestIsValid(body, context);
  // If validator is not null, return the validator
  if (validator) return validator;
  const normalizedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const existing = await findSignupByEmail(prisma, body.waitListId, body.email);
  // Legacy rows saved before email normalization carry a null
  // emailNormalized, which the indexed lookup above cannot see — fall back to
  // a raw case-insensitive match so those addresses still resolve instead of
  // erroring or doubling.
  const legacy =
    existing ??
    (await prisma.signUp.findFirst({
      where: {
        waitListId: body.waitListId,
        emailNormalized: null,
        email: { equals: body.email.trim(), mode: "insensitive" },
      },
    }));
  // Same-browser + same-email retries pass through so the transaction can
  // return them idempotently; any other existing signup resolves here to its
  // current position + referral link instead of a 403.
  if (
    legacy &&
    !(
      legacy.uniqueUserId === body.hypeSession &&
      (legacy.emailNormalized ?? legacy.email.trim().toLowerCase()) === normalizedEmail
    )
  ) {
    return duplicateSignupResponse(body.waitListId, body.email);
  }
};
