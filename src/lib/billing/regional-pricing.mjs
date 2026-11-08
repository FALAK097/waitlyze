import "server-only";
import { unstable_cache } from "next/cache";

import { createDodoClient } from "@/lib/billing/dodo.mjs";
import { env } from "@/lib/env.mjs";

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

const cachedPreview = unstable_cache(
  async (country, monthlyProductId, annualProductId, environment) => {
    const client = createDodoClient();
    const preview = await client.checkoutSessions.preview(
      {
        product_cart: [
          { product_id: monthlyProductId, quantity: 1 },
          { product_id: annualProductId, quantity: 1 },
        ],
        billing_address: { country },
      },
      { timeout: 5000 },
    );
    return {
      country: preview.billing_country || country,
      prices: Object.fromEntries(
        preview.product_cart.map((item) => [
          item.product_id,
          { amount: item.discounted_price, currency: item.currency },
        ]),
      ),
      environment,
    };
  },
  ["dodo-regional-pricing-v1"],
  { revalidate: 3600 },
);

function formatRoundedCurrency(amount, currency) {
  if (!Number.isFinite(amount) || amount < 0 || !/^[A-Z]{3}$/.test(currency || "")) return null;
  const fractionDigits = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits;
  const wholeAmount = Math.round(amount / 10 ** fractionDigits);
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(wholeAmount);
}

function countryFlag(country) {
  if (!/^[A-Z]{2}$/.test(country) || country === "XX") return null;
  return String.fromCodePoint(...[...country].map((letter) => 127397 + letter.charCodeAt(0)));
}

/** Returns Dodo's actual PPP/adaptive-currency preview for the request country. */
export async function getRegionalPricing(countryCode) {
  const country = typeof countryCode === "string" ? countryCode.toUpperCase() : "";
  const flag = countryFlag(country);
  if (!flag || !env.DODO_PRO_MONTHLY_PRODUCT_ID || !env.DODO_PRO_ANNUAL_PRODUCT_ID) return null;

  try {
    const preview = await cachedPreview(
      country,
      env.DODO_PRO_MONTHLY_PRODUCT_ID,
      env.DODO_PRO_ANNUAL_PRODUCT_ID,
      env.DODO_PAYMENTS_ENVIRONMENT || "test_mode",
    );
    const monthly = preview.prices[env.DODO_PRO_MONTHLY_PRODUCT_ID];
    const annual = preview.prices[env.DODO_PRO_ANNUAL_PRODUCT_ID];
    if (!monthly || !annual || monthly.currency !== annual.currency) return null;
    const currency = monthly.currency;
    const monthlyFormatted = formatRoundedCurrency(monthly.amount, currency);
    const annualFormatted = formatRoundedCurrency(annual.amount, currency);
    if (!monthlyFormatted || !annualFormatted) return null;
    const resolvedCountry = preview.country;
    return {
      country: countryNames.of(resolvedCountry) || resolvedCountry,
      flag: countryFlag(resolvedCountry) || flag,
      currency,
      zeroFormatted: formatRoundedCurrency(0, currency),
      monthly: { amount: monthly.amount, formatted: monthlyFormatted },
      annual: { amount: annual.amount, formatted: annualFormatted },
    };
  } catch {
    // Pricing page should remain available if Dodo preview is temporarily down.
    return null;
  }
}
