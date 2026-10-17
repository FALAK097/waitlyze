import { indicatorBackground } from "@/components/evilcharts/ui/echarts-chart";

export const roundnessClass = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
};

export const tooltipVariantClass = {
  default: "bg-background",
  "frosted-glass": "bg-background/50 backdrop-blur-md",
};

// The standard series indicator swatch — a rounded square filled with the
// series' solid var or multi-stop gradient (indicatorBackground). A chart drops
// this into a tooltipRow's `indicatorHtml`.
export function tooltipIndicatorHtml(key, colorsCount) {
  return `<div class="h-2.5 w-2.5 shrink-0 rounded-[2px]" style="background:${indicatorBackground(key, colorsCount)}"></div>`;
}

// One tooltip row: indicator swatch + label/value pair. `dimmed` is a class
// fragment (e.g. " opacity-30") appended to the row so the selection/hover dim
// stays byte-identical to the inlined markup.
export function tooltipRow(
  {
    indicatorHtml,
    labelText,
    valueText,
    dimmed
  }
) {
  return `<div class="flex w-full flex-wrap items-center gap-2${dimmed}">
          ${indicatorHtml}
          <div class="flex flex-1 items-center justify-between gap-4 leading-none">
            <span class="text-muted-foreground">${labelText}</span>
            <span class="text-foreground font-mono font-medium tabular-nums">${valueText}</span>
          </div>
        </div>`;
}

// The outer tooltip surface — border, padding, shadow, roundness + variant
// classes — wrapping the axis label and the composed rows.
export function tooltipShell(
  {
    label,
    body,
    roundness,
    variant
  }
) {
  return `<div class="grid min-w-32 items-start gap-1.5 border border-border/50 px-2.5 py-1.5 text-xs shadow-xl ${roundnessClass[roundness]} ${tooltipVariantClass[variant]}">
      <div class="font-medium text-primary">${label}</div>
      <div class="grid gap-1.5">${body}</div>
    </div>`;
}

// Maps the TooltipPosition prop onto the ECharts tooltip `position` field.
// "variable" → undefined (default follow-both-axes, current behavior); "fixed" →
// a callback that centers the tooltip on the pointer's X but pins it near the
// top (fixed Y).
export function resolveTooltipPosition(position) {
  if (position === "variable") return undefined;
  return (point, _params, _dom, _rect, size) => [point[0] - size.contentSize[0] / 2, 8];
}

// The chart-agnostic tooltip option fields (show, trigger, confine,
// background/border/padding/extraCssText, axisPointer, position). The chart
// supplies only `formatter` and spreads this in. `axisPointerColor` is the
// pre-resolved cursor-line color, so this helper needs no live token read.
export function tooltipBaseOption(params) {
  const { present, cursor, position, axisPointerColor, strokeWidth } = params;

  return {
    show: present,
    trigger: "axis",
    confine: true,
    displayTransition: false,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    extraCssText: "box-shadow:none;",
    axisPointer: cursor
      ? {
          type: "line",
          lineStyle: {
            color: axisPointerColor,
            width: strokeWidth,
            type: [3, 3],
          },
        }
      : { type: "none" },
    position: resolveTooltipPosition(position),
  };
}
