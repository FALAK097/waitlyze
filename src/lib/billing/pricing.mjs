const formatUsd = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

const proMonthlyUsd = 15;
const proAnnualUsd = 119;
const proAnnualMonthlyEquivalentUsd = proAnnualUsd / 12;

const bfcmPercentOff = 40;
const proAnnualPromoUsd = Number((proAnnualUsd * (1 - bfcmPercentOff / 100)).toFixed(2));
const proAnnualPromoMonthlyEquivalentUsd = proAnnualPromoUsd / 12;

export const WAITLYZE_BFCM_PROMO = Object.freeze({
  id: "bfcm-2026",
  name: "Black Friday Cyber Monday Sale",
  code: "BFCM2026",
  percentOff: bfcmPercentOff,
  applicableInterval: "annual",
  startsAt: "2026-11-22T00:00:00.000Z",
  expiresAt: "2026-12-03T23:59:59.999Z",
});

export function isBfcmPromoActive(now = new Date()) {
  const timestamp = now instanceof Date ? now.getTime() : new Date(now).getTime();
  if (Number.isNaN(timestamp)) return false;
  return (
    timestamp >= Date.parse(WAITLYZE_BFCM_PROMO.startsAt) &&
    timestamp <= Date.parse(WAITLYZE_BFCM_PROMO.expiresAt)
  );
}

export const WAITLYZE_PRICING = Object.freeze({
  currency: "USD",
  free: Object.freeze({ amount: 0, formatted: formatUsd(0) }),
  pro: Object.freeze({
    monthly: Object.freeze({ amount: proMonthlyUsd, formatted: formatUsd(proMonthlyUsd) }),
    annual: Object.freeze({
      amount: proAnnualUsd,
      formatted: formatUsd(proAnnualUsd),
      monthlyEquivalentFormatted: formatUsd(proAnnualMonthlyEquivalentUsd),
      promo: Object.freeze({
        code: WAITLYZE_BFCM_PROMO.code,
        percentOff: bfcmPercentOff,
        amount: proAnnualPromoUsd,
        formatted: formatUsd(proAnnualPromoUsd),
        monthlyEquivalentFormatted: formatUsd(proAnnualPromoMonthlyEquivalentUsd),
        totalSavingsVsMonthlyPercent: Math.round(
          (1 - proAnnualPromoUsd / (proMonthlyUsd * 12)) * 100,
        ),
      }),
    }),
    annualSavingsPercent: Math.round((1 - proAnnualUsd / (proMonthlyUsd * 12)) * 100),
  }),
});
