"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { AnalyticsDimensionIcon } from "@/components/product/analytics-dimension-icon";

const number = new Intl.NumberFormat();
const COLORS = ["#72afe6", "#9ac8ed", "#bddcf3", "#d8e9f6", "#f09a7d", "#f5b8a3", "#9ca8b3", "#d3d9df"];

function ChannelTooltip({ active, payload }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return <div className="waitlist-analytics-tooltip">
    <p>{row.label}</p>
    <div className="waitlist-analytics-tooltip-value">
        <i style={{ "--cell-fill": row.fill }} aria-hidden="true" />
      <span>Visitors</span>
      <strong>{number.format(row.value)}</strong>
    </div>
    <div className="waitlist-analytics-tooltip-value">
      <span />
      <span>Share</span>
      <strong>{row.share}%</strong>
    </div>
  </div>;
}

export function EvilPieChart({ rows }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const data = rows.map((row, index) => ({ ...row, fill: COLORS[index % COLORS.length] }));

  if (!data.length) return <p className="waitlist-analytics-panel-empty">No channel data in this period.</p>;

  return <div className="evil-pie-layout">
    <div className="evil-pie-visual">
      <ChartContainer config={{}} className="aspect-auto h-full">
        <PieChart accessibilityLayer>
          <Tooltip content={<ChannelTooltip />} />
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius="53%" outerRadius="79%" paddingAngle={2} cornerRadius={4} stroke="#ffffff" strokeWidth={2} isAnimationActive={false}>
            {data.map((row) => <Cell key={row.label} fill={row.fill} />)}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="evil-pie-total" aria-hidden="true"><strong>{number.format(total)}</strong><span>visitors</span></div>
    </div>
    <ol className="evil-pie-legend">
      {data.map((row) => <li key={row.label}>
      <i style={{ "--cell-fill": row.fill }} aria-hidden="true" />
        <AnalyticsDimensionIcon label={row.label} />
        <span>{row.label}</span>
        <strong>{number.format(row.value)}</strong>
        <small>{row.share}%</small>
      </li>)}
    </ol>
  </div>;
}
