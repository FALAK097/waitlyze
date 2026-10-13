"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";

const chartConfig = {
  visitors: { label: "Visitors", color: "var(--product-text-secondary)" },
  signups: { label: "Signups", color: "var(--product-success-text)" },
};
const number = new Intl.NumberFormat();

function ActivityTooltip({ active, payload, label, formatDate }) {
  if (!active || !payload?.length) return null;

  return <div className="waitlist-analytics-tooltip">
    <p>{formatDate(label, { month: "long", day: "numeric", year: "numeric" })}</p>
    {payload.map((entry) => <div className="waitlist-analytics-tooltip-value" key={entry.dataKey}>
      <i data-series={entry.dataKey} aria-hidden="true" />
      <span>{chartConfig[entry.dataKey]?.label ?? entry.name}</span>
      <strong>{number.format(entry.value)}</strong>
    </div>)}
  </div>;
}

// Adapted from the Evil Charts Recharts area-chart recipe. Keep the focused
// gradient treatment and accessible Recharts layer; omit motion and brush UI.
export function EvilAreaChart({ series, focusedSeries, formatDate }) {
  const chartId = useId().replaceAll(":", "");
  const isOtherSeriesFocused = (name) => Boolean(focusedSeries && focusedSeries !== name);

  return <ChartContainer config={chartConfig}>
    <AreaChart data={series} margin={{ top: 8, right: 12, left: -18, bottom: 0 }} accessibilityLayer>
      <defs>
        <linearGradient id={`${chartId}-visitors`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--product-text-secondary)" stopOpacity="0.16" />
          <stop offset="95%" stopColor="var(--product-text-secondary)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${chartId}-signups`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--product-success-text)" stopOpacity="0.26" />
          <stop offset="95%" stopColor="var(--product-success-text)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} stroke="var(--product-border-subtle)" />
      <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={28} tickFormatter={(value) => formatDate(value)} />
      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={42} />
      <Tooltip content={<ActivityTooltip formatDate={formatDate} />} cursor={{ stroke: "var(--product-border-control)", strokeDasharray: "3 3" }} />
      <Area dataKey="visitors" name="visitors" type="monotone" stroke="var(--product-text-secondary)" fill={`url(#${chartId}-visitors)`} fillOpacity={isOtherSeriesFocused("visitors") ? 0.2 : 1} strokeOpacity={isOtherSeriesFocused("visitors") ? 0.35 : 1} strokeWidth={focusedSeries === "visitors" ? 2.5 : 1.5} activeDot={{ r: 4, strokeWidth: 2, fill: "var(--product-bg-surface)" }} isAnimationActive={false} />
      <Area dataKey="signups" name="signups" type="monotone" stroke="var(--product-success-text)" fill={`url(#${chartId}-signups)`} fillOpacity={isOtherSeriesFocused("signups") ? 0.12 : 1} strokeOpacity={isOtherSeriesFocused("signups") ? 0.35 : 1} strokeWidth={focusedSeries === "signups" ? 2.5 : 2} activeDot={{ r: 4, strokeWidth: 2, fill: "var(--product-bg-surface)" }} isAnimationActive={false} />
    </AreaChart>
  </ChartContainer>;
}
