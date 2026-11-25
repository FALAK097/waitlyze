import { v1Error } from "@/lib/api/v1-auth.mjs";
import { WorkspacePlanError } from "@/lib/billing/plans.mjs";
import { DraftCreationError } from "@/lib/campaigns/create-draft.mjs";
import { PublicationConflict } from "@/lib/campaigns/publication.mjs";
import { DraftRevisionConflict } from "@/lib/campaigns/save-draft-snapshot.mjs";
import {
  DuplicateSignupError,
  FraudLimitError,
  InvalidCampaignError,
} from "@/lib/campaigns/signups.mjs";
import { CustomerSenderNotConnectedError } from "@/lib/email/sender-resolution.mjs";
import { AccessError } from "@/lib/workspaces/service.mjs";

/**
 * Maps domain/operation errors from shared platform helpers into structured v1 API responses.
 */
export function mapOpError(error, budget = null) {
  if (error instanceof AccessError) {
    return v1Error(error.status === 404 ? 404 : 403, "FORBIDDEN", error.message, undefined, budget);
  }
  if (error instanceof WorkspacePlanError) {
    return v1Error(
      402,
      error.code || "PLAN_REQUIRED",
      error.message,
      { feature: error.feature },
      budget,
    );
  }
  if (error instanceof DraftCreationError) {
    return v1Error(
      error.status || 400,
      error.code || "INVALID_REQUEST",
      error.message,
      undefined,
      budget,
    );
  }
  if (error instanceof DraftRevisionConflict || error instanceof PublicationConflict) {
    return v1Error(409, error.code || "CONFLICT", error.message, undefined, budget);
  }
  if (error instanceof DuplicateSignupError) {
    return v1Error(409, "DUPLICATE_SIGNUP", error.message, undefined, budget);
  }
  if (error instanceof InvalidCampaignError) {
    return v1Error(404, "NOT_FOUND", error.message, undefined, budget);
  }
  if (error instanceof FraudLimitError) {
    return v1Error(429, "RATE_LIMITED", error.message, undefined, budget);
  }
  if (
    error instanceof CustomerSenderNotConnectedError ||
    error?.code === "SENDER_NEEDS_ATTENTION"
  ) {
    return v1Error(409, error.code || "SENDER_NOT_CONFIGURED", error.message, undefined, budget);
  }
  if (error instanceof TypeError) {
    return v1Error(400, "INVALID_REQUEST", error.message, undefined, budget);
  }
  const msg = error?.message || "Internal server error.";
  const isNotFound = /not found/i.test(msg);
  return v1Error(
    isNotFound ? 404 : 400,
    isNotFound ? "NOT_FOUND" : "OPERATION_FAILED",
    msg,
    undefined,
    budget,
  );
}
