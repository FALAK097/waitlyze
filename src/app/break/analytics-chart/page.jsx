import { notFound } from "next/navigation";

import AnalyticsChartBreakHarness from "./analytics-chart-harness";

export const metadata = { robots: { index: false, follow: false } };

export default function AnalyticsChartBreakPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <AnalyticsChartBreakHarness />;
}
