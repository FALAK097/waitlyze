const formatUsd = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

const proMonthlyUsd = 15;
const proAnnualUsd = 50;

export const WAITLYZE_PRICING = Object.freeze({
  currency: "USD",
  free: Object.freeze({ amount: 0, formatted: formatUsd(0) }),
  pro: Object.freeze({
    monthly: Object.freeze({ amount: proMonthlyUsd, formatted: formatUsd(proMonthlyUsd) }),
    annual: Object.freeze({ amount: proAnnualUsd, formatted: formatUsd(proAnnualUsd) }),
    annualSavingsPercent: Math.round((1 - proAnnualUsd / (proMonthlyUsd * 12)) * 100),
  }),
});
