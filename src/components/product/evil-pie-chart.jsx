"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

import { PIE_COLORS } from "@/components/product/analytics-palette";
import { ChartContainer } from "@/components/ui/chart";

const number = new Intl.NumberFormat();
const MAX_SLICES = 8;
const LABEL_COLOR = "var(--product-text-secondary, #5b6b7a)";
const LINE_COLOR = "var(--product-border-control, #b6c2cc)";

function ChannelTooltip({ active, payload }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="grid min-w-40 gap-2 rounded-lg border border-product-border-subtle bg-product-bg-surface p-2.5 text-xs text-product-text-primary shadow-xl">
      <p className="mb-px border-b border-product-border-subtle pb-1.5 text-caption font-semibold text-product-text-primary!">
        {row.label}
      </p>
      <div className="flex items-center gap-2">
        <i
          className="size-2 shrink-0 rounded-full bg-product-border-control data-[series=visitors]:bg-chart-1"
          data-series="visitors"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">Visitors</span>
        <strong className="shrink-0 tabular-nums">{number.format(row.visitors)}</strong>
      </div>
      <div className="flex items-center gap-2">
        <i
          className="size-2 shrink-0 rounded-full bg-product-border-control data-[series=signups]:bg-chart-2"
          data-series="signups"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">Signups</span>
        <strong className="shrink-0 tabular-nums">{number.format(row.signups)}</strong>
      </div>
    </div>
  );
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
  return (
    <g pointerEvents="none">
      <polyline
        points={`${sx},${sy} ${mx},${my} ${ex},${ey}`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth="1"
      />
      <text
        x={ex + (right ? 5 : -5)}
        y={ey}
        textAnchor={right ? "start" : "end"}
        dominantBaseline="central"
        fontSize="10.5"
        fontWeight="500"
        fill={LABEL_COLOR}
      >
        {payload.label}
      </text>
    </g>
  );
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
    .map((row, index) => ({ ...row, fill: PIE_COLORS[index % PIE_COLORS.length] }));
  const total = data.reduce((sum, row) => sum + row.value, 0);

  if (!data.length)
    return (
      <p className="grid h-61.5 place-items-center border-t border-product-border-subtle p-6 text-center text-xs text-product-text-secondary">
        No channel data in this period.
      </p>
    );

  return (
    <div className="grid h-full place-items-center px-2.5 py-1.5">
      <div className="relative h-full w-full max-w-95 [&_.recharts-surface]:pointer-events-auto [&_[data-chart]]:h-full [&_[data-chart]]:w-full">
        <ChartContainer config={{}} className="aspect-auto h-full w-full">
          <PieChart accessibilityLayer margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Tooltip content={<ChannelTooltip />} cursor={false} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="74%"
              paddingAngle={2}
              cornerRadius={4}
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive={false}
              label={PieLabel}
              labelLine={false}
            >
              {data.map((row) => (
                <Cell
                  key={row.label}
                  fill={row.fill}
                  fillOpacity={active ? (active === row.label ? 1 : 0.32) : 1}
                  onMouseEnter={() => setActive(row.label)}
                  onMouseLeave={() => setActive(null)}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        {active ? null : (
          <div
            className="pointer-events-none absolute inset-0 grid place-content-center text-center"
            aria-hidden="true"
          >
            <strong className="text-xl font-semibold tracking-tight text-product-text-primary">
              {number.format(total)}
            </strong>
            <span className="text-micro text-product-text-secondary">{metric}</span>
          </div>
        )}
      </div>
    </div>
  );
}
