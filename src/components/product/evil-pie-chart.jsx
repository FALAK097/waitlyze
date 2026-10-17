"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

const number = new Intl.NumberFormat();
const MAX_SLICES = 8;
const COLORS = ["#5b9bd1", "#7bb0dc", "#9cc6e7", "#bcd9f1", "#e8907a", "#f0ab95", "#9ca8b3", "#d3d9df"];
const LABEL_COLOR = "var(--product-text-secondary, #5b6b7a)";
const LINE_COLOR = "var(--product-border-control, #b6c2cc)";

function ChannelTooltip({ active, payload }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return <div className="waitlist-analytics-tooltip">
    <p className="waitlist-analytics-tooltip-title">{row.label}</p>
    <div className="waitlist-analytics-tooltip-value">
      <i data-series="visitors" aria-hidden="true" />
      <span>Visitors</span>
      <strong>{number.format(row.visitors)}</strong>
    </div>
    <div className="waitlist-analytics-tooltip-value">
      <i data-series="signups" aria-hidden="true" />
      <span>Signups</span>
      <strong>{number.format(row.signups)}</strong>
    </div>
  </div>;
}

function PieLabel({ cx, cy, midAngle, outerRadius, payload }) {
  const RADIAN = Math.PI / 180;
  const cos = Math.cos(-midAngle * RADIAN);
  const sin = Math.sin(-midAngle * RADIAN);
  const start = outerRadius + 5;
  const elbow = outerRadius + 15;
  const end = outerRadius + 20;
  const sx = cx + start * cos;
  const sy = cy + start * sin;
  const mx = cx + elbow * cos;
  const my = cy + elbow * sin;
  const ex = cx + end * cos;
  const ey = cy + end * sin;
  const right = cos >= 0;
  return <g pointerEvents="none">
    <polyline points={`${sx},${sy} ${mx},${my} ${ex},${ey}`} fill="none" stroke={LINE_COLOR} strokeWidth="1" />
    <text x={ex + (right ? 5 : -5)} y={ey} textAnchor={right ? "start" : "end"} dominantBaseline="central" fontSize="10.5" fontWeight="500" fill={LABEL_COLOR}>
      {payload.label}
    </text>
  </g>;
}

export function EvilPieChart({ rows, metric = "visitors" }) {
  const [active, setActive] = useState(null);
  const data = rows
    .map((row) => ({
      ...row,
      value: metric === "signups" ? row.signups : row.visitors,
      share: metric === "signups" ? row.signupsShare : row.visitorsShare,
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_SLICES)
    .map((row, index) => ({ ...row, fill: COLORS[index % COLORS.length] }));
  const total = data.reduce((sum, row) => sum + row.value, 0);

  if (!data.length) return <p className="waitlist-analytics-panel-empty">No channel data in this period.</p>;

  return <div className="evil-pie-layout">
    <div className="evil-pie-visual">
      <ChartContainer config={{}} className="aspect-auto h-full w-full">
        <PieChart accessibilityLayer margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Tooltip content={<ChannelTooltip />} cursor={false} />
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius="52%" outerRadius="74%" paddingAngle={2} cornerRadius={4} stroke="#ffffff" strokeWidth={2} isAnimationActive={false} label={PieLabel} labelLine={false}>
            {data.map((row) => <Cell key={row.label} fill={row.fill} fillOpacity={active ? (active === row.label ? 1 : 0.32) : 1} onMouseEnter={() => setActive(row.label)} onMouseLeave={() => setActive(null)} />)}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="evil-pie-total" aria-hidden="true"><strong>{number.format(total)}</strong><span>{metric}</span></div>
    </div>
  </div>;
}
