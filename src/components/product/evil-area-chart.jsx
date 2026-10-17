"use client";

import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

const chartConfig = {
  visitors: { label: "Visitors", color: "#4b95d1" },
  signups: { label: "Signups", color: "#ee9477" },
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

export function EvilAreaChart({ series, formatDate }) {
  return <ChartContainer config={chartConfig} className="aspect-auto h-80">
    <AreaChart data={series} margin={{ top: 18, right: 14, left: 0, bottom: 0 }} accessibilityLayer>
      <defs>
        <linearGradient id="analytics-visitors-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4b95d1" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#4b95d1" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="analytics-signups-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ee9477" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#ee9477" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} stroke="#e8edf1" strokeDasharray="0" />
      <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={28} tickMargin={12} tickFormatter={(value) => formatDate(value)} tick={{ fill: "#6b7280", fontSize: 11 }} dy={4} />
      <YAxis yAxisId="visitors" allowDecimals={false} tickLine={false} axisLine={false} width={40} tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(value) => number.format(value)} />
      <YAxis yAxisId="signups" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} width={36} tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(value) => number.format(value)} />
      <Tooltip content={<ActivityTooltip formatDate={formatDate} />} cursor={{ stroke: "#c5cdd6", strokeWidth: 1, strokeDasharray: "4 4" }} />
      <Area yAxisId="visitors" dataKey="visitors" name="visitors" type="monotone" stroke="#4b95d1" fill="url(#analytics-visitors-fill)" strokeWidth={2} strokeOpacity={0.9} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#4b95d1" }} isAnimationActive={false} />
      <Area yAxisId="signups" dataKey="signups" name="signups" type="monotone" stroke="#ee9477" fill="url(#analytics-signups-fill)" strokeWidth={2} strokeOpacity={0.9} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#ee9477" }} isAnimationActive={false} />
    </AreaChart>
  </ChartContainer>;
}
