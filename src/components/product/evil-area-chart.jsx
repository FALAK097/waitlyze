"use client";

import { EChartsComposedChart } from "@/components/evilcharts/charts/echarts-composed-chart";
import { SERIES_COLORS } from "@/components/product/analytics-palette";

const chartConfig = {
  visitors: { label: "Visitors", colors: { light: [SERIES_COLORS.visitors], dark: [SERIES_COLORS.visitors] } },
  signups: { label: "Signups", colors: { light: [SERIES_COLORS.signups], dark: [SERIES_COLORS.signups] } },
};

const number = new Intl.NumberFormat();

export function EvilAreaChart({ series, formatDate }) {
  return <EChartsComposedChart
    className="h-80 w-full"
    xDataKey="date"
    data={series}
    config={chartConfig}
    curveType="monotone"
    animationType="left-to-right"
    barCategoryGap="28%"
  >
    <EChartsComposedChart.Grid />
    <EChartsComposedChart.XAxis dataKey="date" tickFormatter={(value) => formatDate(value)} />
    <EChartsComposedChart.YAxis tickFormatter={(value) => number.format(value)} />
    <EChartsComposedChart.Legend isClickable />
    <EChartsComposedChart.Tooltip />
    <EChartsComposedChart.Bar dataKey="visitors" radius={3} isClickable />
    <EChartsComposedChart.Line dataKey="signups" curveType="monotone" isClickable>
      <EChartsComposedChart.ActiveDot variant="colored-border" />
      <EChartsComposedChart.Dot variant="default" />
    </EChartsComposedChart.Line>
  </EChartsComposedChart>;
}
