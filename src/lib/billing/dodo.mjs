import "server-only";
import DodoPayments from "dodopayments";

import { env } from "@/lib/env.mjs";

export class DodoConfigurationError extends Error {
  constructor(message = "Dodo Payments is not configured for this environment.") {
    super(message);
    this.name = "DodoConfigurationError";
  }
}

export function createDodoClient({ requireWebhookKey = false } = {}) {
  if (!env.DODO_PAYMENTS_API_KEY)
    throw new DodoConfigurationError("Dodo Payments API credentials are not configured.");
  if (env.NODE_ENV === "production" && !env.DODO_PAYMENTS_ENVIRONMENT)
    throw new DodoConfigurationError(
      "Set DODO_PAYMENTS_ENVIRONMENT explicitly before enabling billing.",
    );
  if (requireWebhookKey && !env.DODO_PAYMENTS_WEBHOOK_KEY)
    throw new DodoConfigurationError("Dodo Payments webhook verification is not configured.");
  const environment = env.DODO_PAYMENTS_ENVIRONMENT || "test_mode";
  if (
    (environment === "test_mode" && !env.DODO_PAYMENTS_API_KEY.startsWith("dodo_test_")) ||
    (environment === "live_mode" && !env.DODO_PAYMENTS_API_KEY.startsWith("dodo_live_"))
  )
    throw new DodoConfigurationError("Dodo API key does not match the configured environment.");

  return new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    environment,
    ...(env.DODO_PAYMENTS_WEBHOOK_KEY ? { webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY } : {}),
  });
}

export function dodoProductId(interval) {
  const productId =
    interval === "monthly"
      ? env.DODO_PRO_MONTHLY_PRODUCT_ID
      : interval === "annual"
        ? env.DODO_PRO_ANNUAL_PRODUCT_ID
        : null;
  if (!productId) throw new DodoConfigurationError("This billing option is not configured yet.");
  return productId;
}

export function dodoBillingInterval(productId) {
  if (productId && productId === env.DODO_PRO_MONTHLY_PRODUCT_ID) return "MONTHLY";
  if (productId && productId === env.DODO_PRO_ANNUAL_PRODUCT_ID) return "ANNUAL";
  return null;
}
