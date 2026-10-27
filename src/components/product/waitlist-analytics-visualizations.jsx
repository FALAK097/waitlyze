import dynamic from "next/dynamic";
import { useState } from "react";

import { EvilBarRows } from "@/components/product/evil-bar-chart";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const number = new Intl.NumberFormat("en-US");

export const EvilAreaChart = dynamic(
  () => import("@/components/product/evil-area-chart").then((module) => module.EvilAreaChart),
  {
    loading: () => (
      <div
        className="flex min-h-70 items-end gap-3 px-5 py-6"
        role="status"
        aria-label="Loading activity chart"
      />
    ),
  },
);
export const EvilPieChart = dynamic(
  () => import("@/components/product/evil-pie-chart").then((module) => module.EvilPieChart),
  {
    loading: () => (
      <div
        className="grid h-61.5 place-items-center border-t border-product-border-subtle p-6 text-center text-xs text-product-text-secondary"
        role="status"
        aria-label="Loading channel chart"
      />
    ),
  },
);
export const EvilWorldMap = dynamic(
  () => import("@/components/product/evil-world-map").then((module) => module.EvilWorldMap),
  {
    loading: () => (
      <div
        className="grid h-61.5 place-items-center border-t border-product-border-subtle p-6 text-center text-xs text-product-text-secondary"
        role="status"
        aria-label="Loading visitor map"
      />
    ),
  },
);

const FUNNEL_WIDTH = 900;
const FUNNEL_HEIGHT = 200;
const FUNNEL_GAP = 8;

function funnelSegmentPath(normStart, normEnd, width, scale) {
  const center = FUNNEL_HEIGHT / 2;
  const startHeight = normStart * FUNNEL_HEIGHT * 0.44 * scale;
  const endHeight = normEnd * FUNNEL_HEIGHT * 0.44 * scale;
  const control = width * 0.55;

  return [
    `M 0 ${center - startHeight}`,
    `C ${control} ${center - startHeight}, ${width - control} ${center - endHeight}, ${width} ${center - endHeight}`,
    `L ${width} ${center + endHeight}`,
    `C ${width - control} ${center + endHeight}, ${control} ${center + startHeight}, 0 ${center + startHeight}`,
    "Z",
  ].join(" ");
}

export function FunnelChart({ data, showValues = true, showPercentage = true, showLabels = true }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  if (!data.length) return null;

  const firstValue = data[0]?.value ?? 0;
  const scaleValue = Math.max(firstValue, ...data.map((stage) => stage.value), 1);
  const norms = data.map((stage) => Math.max(stage.value, 0) / scaleValue);
  const segmentWidth = (FUNNEL_WIDTH - FUNNEL_GAP * (data.length - 1)) / data.length;
  const layerScales = [1, 0.65, 0.3];
  const layerOpacities = [0.18, 0.5, 0.84];

  return (
    <div className="analytics-funnel relative mt-1 w-full overflow-visible px-3 pt-1 pb-2">
      <svg
        aria-hidden="true"
        className="analytics-funnel__svg pointer-events-none"
        data-analytics-chart
        preserveAspectRatio="none"
        role="presentation"
        viewBox={`0 0 ${FUNNEL_WIDTH} ${FUNNEL_HEIGHT}`}
      >
        {data.map((stage, index) => {
          const normStart = norms[index] ?? 0;
          const normEnd = norms[Math.min(index + 1, data.length - 1)] ?? normStart;
          const x = (segmentWidth + FUNNEL_GAP) * index;
          const dimmed = hoveredIndex !== null && hoveredIndex !== index;

          return (
            <g
              key={stage.label}
              className="transition-opacity duration-150"
              opacity={dimmed ? 0.42 : 1}
              transform={`translate(${x}, 0)`}
            >
              {layerScales.map((layerScale, layerIndex) => (
                <path
                  key={`ring-${layerScale}`}
                  d={funnelSegmentPath(normStart, normEnd, segmentWidth, layerScale)}
                  fill="var(--product-green-700)"
                  opacity={layerOpacities[layerIndex]}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {data.map((stage, index) => {
        const percentage =
          firstValue > 0 ? `${Math.round((stage.value / firstValue) * 100)}%` : "-";
        const dimmed = hoveredIndex !== null && hoveredIndex !== index;
        const detail = stage.detail ? ` ${stage.detail}.` : "";

        return (
          <TooltipProvider key={stage.label} delay={100}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    aria-label={`${stage.label}: ${number.format(stage.value)}, ${percentage} of visitors.${detail}`}
                    data-analytics-funnel-stage
                    variant="analytics-funnel-trigger"
                    size="analytics-funnel-trigger"
                    className="group"
                    onBlur={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(index)}
                    onPointerEnter={() => setHoveredIndex(index)}
                    onPointerLeave={() => setHoveredIndex(null)}
                    style={{
                      "--funnel-stage-left": `${(index / data.length) * 100}%`,
                      "--funnel-stage-width": `${100 / data.length}%`,
                      "--funnel-stage-opacity": dimmed ? 0.62 : 1,
                    }}
                  />
                }
              >
                {showValues ? (
                  <span className="grid place-items-center text-xs leading-none font-semibold text-product-text-primary tabular-nums">
                    {number.format(stage.value)}
                  </span>
                ) : null}
                {showPercentage ? (
                  <span className="grid place-items-center">
                    <span className="ring-product-green-700/10 rounded-full bg-product-accent-solid px-2.5 py-1 text-micro leading-none font-semibold text-product-accent-label tabular-nums shadow-sm ring-1 group-focus-visible:ring-2 group-focus-visible:ring-product-focus group-focus-visible:ring-offset-2">
                      {percentage}
                    </span>
                  </span>
                ) : null}
                {showLabels ? (
                  <span className="grid place-items-center px-1 text-center text-xs leading-tight font-medium text-product-text-primary">
                    {stage.label}
                  </span>
                ) : null}
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-60 whitespace-normal">
                <span className="grid gap-1">
                  <strong>{stage.label}</strong>
                  <span>
                    {number.format(stage.value)} · {percentage} of visitors
                  </span>
                  {stage.detail ? <span>{stage.detail}</span> : null}
                </span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

export function EmailDeliveryChart({ emails, formatDate }) {
  const totals = emails.reduce(
    (result, email) => ({
      total: result.total + email.total,
      delivered: result.delivered + email.delivered,
      failed: result.failed + email.failed,
    }),
    { total: 0, delivered: 0, failed: 0 },
  );
  const inProgress = Math.max(totals.total - totals.delivered - totals.failed, 0);

  return (
    <>
      <dl className="grid grid-cols-3 border-y border-product-border-subtle">
        {[
          { label: "Delivered", value: totals.delivered, tone: "text-product-success-text" },
          { label: "Failed", value: totals.failed, tone: "text-product-danger-text" },
          { label: "In progress", value: inProgress, tone: "text-product-text-secondary" },
        ].map((item) => (
          <div
            key={item.label}
            className="grid gap-0.5 px-4 py-3 first:border-0 [&+div]:border-s [&+div]:border-product-border-subtle"
          >
            <dt className="text-micro text-product-text-secondary">{item.label}</dt>
            <dd className={`text-sm font-semibold tabular-nums ${item.tone}`}>
              {number.format(item.value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 px-4 pt-4 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h4 className="text-xs font-semibold text-product-text-primary">Delivery by broadcast</h4>
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-product-text-secondary">
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full bg-product-success-text" />
              Delivered
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full bg-product-danger-text" />
              Failed
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="bg-product-neutral-300 size-2 rounded-full" />
              In progress
            </li>
          </ul>
        </div>

        <ol className="grid gap-4">
          {emails.map((email) => {
            const delivered = Math.max(email.delivered, 0);
            const failed = Math.max(email.failed, 0);
            const total = Math.max(email.total, 0);
            const barTotal = Math.max(total, delivered + failed, 1);
            const remaining = Math.max(barTotal - delivered - failed, 0);
            const pending = Math.max(total - delivered - failed, 0);
            const date = email.sentAt
              ? formatDate(email.sentAt.slice(0, 10), {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Date unavailable";

            return (
              <li key={email.id} className="grid min-w-0 gap-2">
                <div className="flex min-w-0 items-baseline justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate font-medium text-product-text-primary">
                    {email.name}
                  </span>
                  <span className="shrink-0 text-micro text-product-text-secondary">{date}</span>
                </div>
                <div
                  aria-hidden="true"
                  className="flex h-3 overflow-hidden rounded-full bg-product-bg-inset"
                >
                  <span
                    className="analytics-email-bar__segment h-full bg-product-success-text"
                    style={{ "--email-bar-width": `${(delivered / barTotal) * 100}%` }}
                  />
                  <span
                    className="analytics-email-bar__segment h-full bg-product-danger-text"
                    style={{ "--email-bar-width": `${(failed / barTotal) * 100}%` }}
                  />
                  {remaining > 0 ? (
                    <span
                      className="analytics-email-bar__segment bg-product-neutral-300 h-full"
                      style={{ "--email-bar-width": `${(remaining / barTotal) * 100}%` }}
                    />
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-micro text-product-text-secondary">
                  <span>
                    <strong className="font-semibold text-product-success-text">
                      {number.format(delivered)}
                    </strong>{" "}
                    delivered
                  </span>
                  <span>
                    <strong className="font-semibold text-product-danger-text">
                      {number.format(failed)}
                    </strong>{" "}
                    failed
                  </span>
                  {pending > 0 ? (
                    <span>
                      <strong className="font-semibold text-product-text-primary">
                        {number.format(pending)}
                      </strong>{" "}
                      in progress
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}

export function RankedBars({ rows, empty, kind, metric = "visitors", limit = 5 }) {
  if (!rows.length)
    return (
      <p className="grid h-61.5 place-items-center border-t border-product-border-subtle p-6 text-center text-xs text-product-text-secondary">
        {empty}
      </p>
    );
  const sorted = [...rows]
    .sort((a, b) => {
      const avalue = metric === "signups" ? a.signups : a.visitors;
      const bvalue = metric === "signups" ? b.signups : b.visitors;
      return bvalue - avalue || b.visitors - a.visitors || b.signups - a.signups;
    })
    .slice(0, limit);
  return <EvilBarRows rows={sorted} kind={kind} metric={metric} />;
}
