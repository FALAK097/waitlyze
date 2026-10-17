"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
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
    <BarChart data={series} margin={{ top: 18, right: 14, left: 0, bottom: 0 }} accessibilityLayer barGap={0} barCategoryGap="18%">
      <CartesianGrid vertical={false} stroke="#e8edf1" strokeDasharray="0" />
      <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={28} tickMargin={12} tickFormatter={(value) => formatDate(value)} tick={{ fill: "#6b7280", fontSize: 11 }} dy={4} />
      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(value) => number.format(value)} />
      <Tooltip content={<ActivityTooltip formatDate={formatDate} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
      <Bar dataKey="visitors" name="visitors" stackId="activity" fill="#4b95d1" radius={[0, 0, 0, 0]} isAnimationActive={false} />
      <Bar dataKey="signups" name="signups" stackId="activity" fill="#ee9477" radius={[3, 3, 0, 0]} isAnimationActive={false} />
    </BarChart>
  </ChartContainer>;
}
