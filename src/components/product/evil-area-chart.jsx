"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
    <ComposedChart data={series} margin={{ top: 16, right: 10, left: 0, bottom: 0 }} accessibilityLayer>
      <defs>
        <linearGradient id="analytics-visitors-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#72afe6" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#72afe6" stopOpacity="0.025" />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} stroke="#e2e8ed" strokeDasharray="3 4" />
      <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={32} tickMargin={10} tickFormatter={(value) => formatDate(value)} tick={{ fill: "#4e5255", fontSize: 11 }} />
      <YAxis yAxisId="visitors" allowDecimals={false} tickLine={false} axisLine={false} width={42} tick={{ fill: "#4e5255", fontSize: 11 }} />
      <YAxis yAxisId="signups" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} width={38} tick={{ fill: "#4e5255", fontSize: 11 }} />
      <Tooltip content={<ActivityTooltip formatDate={formatDate} />} cursor={{ stroke: "#d4d6d8", strokeDasharray: "3 3" }} />
      <Bar yAxisId="signups" dataKey="signups" name="signups" fill="#ee9477" fillOpacity={0.74} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
      <Area yAxisId="visitors" dataKey="visitors" name="visitors" type="monotone" stroke="#4b95d1" fill="url(#analytics-visitors-fill)" fillOpacity={1} strokeOpacity={1} strokeWidth={2.25} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }} isAnimationActive={false} />
    </ComposedChart>
  </ChartContainer>;
}
