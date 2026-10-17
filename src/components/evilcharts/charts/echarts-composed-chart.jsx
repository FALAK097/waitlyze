"use client";;
import {
  DEFAULT_ECHARTS_RENDERER,
  buildChartCss,
  flattenColor,
  getColorsCount,
  resolveColors,
  seriesPaint,
  withAlpha,
} from "@/components/evilcharts/ui/echarts-chart";
import { tooltipBaseOption, tooltipIndicatorHtml, tooltipRow, tooltipShell } from "@/components/evilcharts/ui/echarts-tooltip";
import { Brush, buildBrushDataZoom, syncBrushOverlay } from "@/components/evilcharts/ui/echarts-brush";
import { DataZoomComponent, GridComponent, TooltipComponent } from "echarts/components";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { dotItemStyle, dotStyle, sampleGradient } from "@/components/evilcharts/ui/echarts-dot";
import { BarChart, LineChart } from "echarts/charts";
import { LegendOverlay } from "@/components/evilcharts/ui/echarts-legend";
import { motion, useReducedMotion } from "motion/react";
import * as echarts from "echarts/core";

// Modular registration keeps the bundle lean — only the pieces a composed chart
// needs. A composed chart mixes `BarChart` and `LineChart` series in one grid.
// `DataZoomComponent` bundles both the slider (brush footer) and inside (wheel/
// drag) zoom; the brush's frame/handles/labels are raw zrender elements, NOT the
// graphic component (never registered) — see syncBrushOverlay.
echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, DataZoomComponent]);

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STROKE_WIDTH = 2; // line stroke width — the Recharts twin draws lines at 2px
const AXIS_POINTER_WIDTH = 1; // tooltip cursor line
const DEFAULT_BAR_RADIUS = 4; // bar corner radius, matching the Recharts twin
const LOADING_ANIMATION_DURATION = 2000; // shimmer loop, in milliseconds
const REVEAL_DURATION = 1000; // intro draw-in length, in milliseconds
// The bar entrance is a per-datum grow-in staggered by `animationType`, exactly
// like the ECharts bar chart. Unlike the line's clip (which ECharts hardcodes to
// linear left-to-right), bars are independent rectangles, so the direction values
// are honored via a per-datum `animationDelay`.
const BAR_GROW_DURATION = 500; // per-bar grow-in length, in milliseconds
const BAR_STAGGER = 50; // delay between consecutive bars in the reveal, in milliseconds
// NOTE: the LINE intro runs ECharts' RAW default entrance — lines trace in
// left-to-right. Custom easing/direction was tried and abandoned for the line:
// ECharts hardcodes the line-entrance clip to linear and ignores animationEasing
// at every level (verified empirically). The `animationType` direction values are
// kept as recharts-parity aliases and drive the BAR stagger.
const LOADING_DEFAULT_BARS = 12;
const DASH_PATTERN = [5, 5]; // dashed stroke — the twin uses "5 5"
const DASH_PERIOD = 10; // sum of DASH_PATTERN — the animated sweep travels one period per second

// ─────────────────────────────────────────────────────────────────────────────
// Theme knobs — every neutral line in the chart draws from these. Base colors
// come from the consumer's CSS tokens (resolved from the live DOM), so only the
// opacity factors live here. Factors MULTIPLY the token's own alpha — a border
// token that is already 10%-white stays subtle. Tune here, not in the builder.
// ─────────────────────────────────────────────────────────────────────────────
// Recharts draws its grid at border/50, but SVG dashes render pixel-crisp while
// canvas at 2× DPR spreads a 1px line across device pixels — roughly halving
// perceived intensity. Using the border token's full alpha lands both engines at
// the same apparent brightness.
const GRID_LINE_OPACITY = 1; // dashed y-axis split lines, × border alpha
const AXIS_POINTER_OPACITY = 1; // tooltip cursor line, × border alpha
// The skeleton bars are CLIPPED to a small sweeping window — only the bars inside
// it are painted, everything outside is fully transparent, like a clip-path
// sliding diagonally across the chart.
const LOADING_BAR_MAX_OPACITY = 0.22; // skeleton bar fill inside the window, × foreground alpha
const LOADING_LINE_MAX_OPACITY = 0.5; // skeleton line stroke inside the window, × foreground alpha
const LOADING_LINE_WIDTH = 2; // skeleton line stroke width
const LOADING_SHIMMER_BAND = 0.2; // window half-width, fraction of chart width
const LOADING_SHIMMER_FEATHER = 0.2; // eased edge softening of the clip window
const BRUSH_STROKE_OPACITY = 0.5; // mini-chart series stroke
const BRUSH_FILL_OPACITY = 0.15; // mini-chart series fade, at the top stop
const BRUSH_FILLER_OPACITY = 0; // selected-range wash — evil-brush draws none
// Glow — the canvas analogue of the Recharts feGaussianBlur filters.
// Bars: a soft outer canvas shadow. The Recharts BarGlowFilter blurs the fill at
// stdDeviation 8 and merges it under the shape, so the halo is generous and soft;
// a canvas shadowBlur reproduces that. shadowColor is sampled PER-DATUM for
// multi-color bars (§sampleGradient) so the halo follows the palette, not a single
// wrong tint.
const BAR_GLOW_BLUR = 16; // bar glow radius, canvas shadowBlur
const BAR_GLOW_OPACITY = 0.6; // bar glow strength, × series color alpha
// Lines: SILENT copies of the stroke stacked UNDER the real line, all at the SAME
// NARROW WIDTH so they stay hidden beneath it — the visible halo is entirely each
// copy's canvas `shadowBlur`. Widening the copies instead (the obvious approach)
// paints concentric contour rings, because a translucent stroke has a hard edge
// and every extra layer adds another visible boundary; a shadow is a true gaussian
// and several at different radii sum to a smooth falloff. The copies keep the
// series gradient so the bright core tracks the line's color; the shadow itself is
// one flat tone (a canvas shadow cannot be a gradient), which only tints the soft
// outer bloom. Matches the line chart's GLOW_LAYERS.
const LINE_GLOW_LAYERS = [
  { width: 2, opacity: 0.9, blur: 5 }, // × series color alpha
  { width: 2, opacity: 0.6, blur: 12 },
  { width: 2, opacity: 0.38, blur: 24 },
  { width: 2, opacity: 0.22, blur: 42 },
];
// The dim applied to unselected series once one series is selected. Line strokes
// and dots drop to SELECTION_DIM (0.3, matching the Recharts twin); bar FILLS
// recede further to SELECTION_DIM_FILL so a dimmed column fades back like the area
// chart's dimmed fill while thin strokes and dots stay legible.
const SELECTION_DIM = 0.3;
const SELECTION_DIM_FILL = 0.15;

/**
 * A single bar series. Declares its own fill variant, radius, glow, and
 * clickability. Renders nothing — the root reads these props to build the
 * ECharts bar series.
 */
const Bar = () => null;

/**
 * A single line series. Declares its own stroke/curve/glow/clickability and,
 * optionally, resting/active point markers via composed <Dot> / <ActiveDot>.
 * Renders nothing — the root reads these props to build the ECharts line series.
 */
const Line = () => null;

/** Declares the resting point marker for the enclosing <Line>. Renders nothing. */
const Dot = () => null;

/** Declares the hovered/active point marker for the enclosing <Line>. Renders nothing. */
const ActiveDot = () => null;

/** Presence shows the x-axis category labels. Renders nothing. */
const XAxis = () => null;

/** Presence shows the y value axis. Renders nothing. */
const YAxis = () => null;

/** Presence shows the dashed horizontal split lines. Renders nothing. */
const Grid = () => null;

/** Presence enables the hover tooltip. Renders nothing. */
const Tooltip = () => null;

/** Presence enables the HTML legend overlay. Renders nothing. */
const Legend = () => null;

function collectConfig(children) {
  const bars = [];
  const lines = [];
  let xAxis = { present: false, hideDots: false };
  let yAxis = { present: false, hideDots: false };
  let showGrid = false;
  let tooltip = {
    present: false,
    variant: "default",
    roundness: "lg",
    cursor: true,
    position: "variable",
  };
  let legend = {
    present: false,
    variant: "rounded-square",
    align: "right",
    verticalAlign: "top",
    isClickable: false,
  };
  let brush = { present: false };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type;

    if (type === Bar) {
      const props = child.props;
      bars.push({
        dataKey: props.dataKey,
        variant: props.variant ?? "default",
        radius: props.radius ?? DEFAULT_BAR_RADIUS,
        glow: props.glow ?? false,
        animationType: props.animationType,
        isClickable: props.isClickable ?? false,
        enableHoverHighlight: props.enableHoverHighlight ?? false,
        barProps: props.barProps,
      });
    } else if (type === Line) {
      const props = child.props;
      let dotVariant = "none";
      let activeDotVariant = "none";
      Children.forEach(props.children, (dotChild) => {
        if (!isValidElement(dotChild)) return;
        if (dotChild.type === Dot) {
          dotVariant = (dotChild.props).variant ?? "default";
        } else if (dotChild.type === ActiveDot) {
          activeDotVariant = (dotChild.props).variant ?? "default";
        }
      });
      lines.push({
        dataKey: props.dataKey,
        strokeVariant: props.strokeVariant ?? "solid",
        curveType: props.curveType,
        animationType: props.animationType,
        connectNulls: props.connectNulls ?? false,
        glow: props.glow ?? false,
        isClickable: props.isClickable ?? false,
        dotVariant,
        activeDotVariant,
        lineProps: props.lineProps,
      });
    } else if (type === XAxis) {
      const props = child.props;
      xAxis = {
        present: true,
        dataKey: props.dataKey,
        tickFormatter: props.tickFormatter,
        label: props.label,
        hideDots: props.hideDots ?? false,
      };
    } else if (type === YAxis) {
      const props = child.props;
      yAxis = {
        present: true,
        dataKey: props.dataKey,
        tickFormatter: props.tickFormatter,
        label: props.label,
        hideDots: props.hideDots ?? false,
      };
    } else if (type === Grid) {
      showGrid = true;
    } else if (type === Tooltip) {
      const props = child.props;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        defaultIndex: props.defaultIndex,
        cursor: props.cursor ?? true,
        position: props.position ?? "variable",
      };
    } else if (type === Legend) {
      const props = child.props;
      legend = {
        present: true,
        variant: props.variant ?? "rounded-square",
        align: props.align ?? "right",
        verticalAlign: props.verticalAlign ?? "top",
        isClickable: props.isClickable ?? false,
      };
    } else if (type === Brush) {
      const props = child.props;
      brush = {
        present: true,
        height: props.height,
        formatLabel: props.formatLabel,
        onChange: props.onChange,
      };
    }
  });

  return { bars, lines, xAxis, yAxis, showGrid, tooltip, legend, brush };
}

// Color plumbing (ChartConfig, getColorsCount, distributeColors, buildChartCss,
// normalizeColor, withAlpha, ResolvedColors, resolveColors, seriesPaint) now
// lives in @/registry/ui/echarts-chart and is imported at the top of this file.

// ─────────────────────────────────────────────────────────────────────────────
// Bar fills — the ECharts analogue of the Recharts bar variants. Bars are opaque
// colored shapes (unlike the translucent area fills), so these paint at full
// strength. Each is applied per-bar: ECharts gradient itemStyle defaults to
// `global: false`, so the gradient coordinates are relative to EACH bar's own
// bounding box — exactly what recharts' objectBoundingBox patterns do.
// ─────────────────────────────────────────────────────────────────────────────

// Diagonal two-tone hatch, tinted with the bar's color. The stripe is drawn
// STRAIGHT (a vertical bar in a 5px tile) and the pattern itself is rotated 45° —
// zrender applies pattern transforms the same way ECharts decals do. Baking the
// diagonal into the tile would clip the stroke at the corners and read as
// periodic gaps once tiled. Tiles render at devicePixelRatio and scale back down
// so the texture stays crisp on retina canvases.
function barHatchPattern(color) {
  if (typeof document === "undefined") return null;
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const period = 5;
  const stripe = 1.5;
  canvas.width = period * dpr;
  canvas.height = period * dpr;
  ctx.scale(dpr, dpr);

  // Dimmed field with a full-strength stripe every 5px — the recharts hatch mask
  // is exactly this (background at 30% alpha, stripe at full).
  ctx.fillStyle = withAlpha(color, 0.3);
  ctx.fillRect(0, 0, period, period);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, stripe, period);

  return {
    image: canvas,
    repeat: "repeat",
    rotation: -Math.PI / 4,
    scaleX: 1 / dpr,
    scaleY: 1 / dpr,
  };
}

// A vertical top→bottom gradient through the series color slots (recharts'
// VerticalColorGradient). A single color collapses to a solid string.
function verticalColorGradient(slots) {
  if (slots.length <= 1) return slots[0] ?? "rgba(120, 120, 120, 1)";
  return new echarts.graphic.LinearGradient(
    0,
    0,
    0,
    1,
    slots.map((color, i) => ({ offset: i / (slots.length - 1), color })),
  );
}

// Resolves a bar variant into an ECharts fill. Multi-color configs (only the
// `default` variant appears multi-color in practice) run the full vertical color
// gradient; the horizontal-split / textured variants are authored single-color in
// the twin, so they tint from the first slot.
function barFillPaint(variant, slots) {
  const base = slots[0] ?? "rgba(120, 120, 120, 1)";
  const multi = slots.length > 1;

  switch (variant) {
    case "gradient": {
      // Bar color faded toward the baseline — full near the top (≤20%), gone by
      // 90% — recharts' GradientPattern mask, expressed directly as vertical alpha.
      const fade = (t) => (t <= 0.2 ? 1 : t >= 0.9 ? 0 : 1 - (t - 0.2) / 0.7);
      if (multi) {
        return new echarts.graphic.LinearGradient(
          0,
          0,
          0,
          1,
          slots.map((color, i) => {
            const t = i / (slots.length - 1);
            return { offset: t, color: withAlpha(color, fade(t)) };
          }),
        );
      }
      return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: withAlpha(base, 1) },
        { offset: 0.2, color: withAlpha(base, 1) },
        { offset: 0.9, color: withAlpha(base, 0) },
        { offset: 1, color: withAlpha(base, 0) },
      ]);
    }
    case "duotone":
    case "duotone-reverse": {
      // Horizontal two-tone split: one half full strength, the other at 40%.
      const reverse = variant === "duotone-reverse";
      const dim = withAlpha(base, 0.4);
      const left = reverse ? base : dim;
      const right = reverse ? dim : base;
      return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: left },
        { offset: 0.5, color: left },
        { offset: 0.5, color: right },
        { offset: 1, color: right },
      ]);
    }
    case "stripped": {
      // A faint wash (0.4 → 0.1 down the bar) under a bright top edge — the
      // canvas analogue of recharts' low-opacity gradient plus its solid top
      // strip. The strip lives inside the gradient (a full-alpha stop in the top
      // ~5%) since ECharts bars can't carry a separate top-only fill.
      return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: withAlpha(base, 1) },
        { offset: 0.05, color: withAlpha(base, 0.4) },
        { offset: 1, color: withAlpha(base, 0.1) },
      ]);
    }
    case "hatched":
      return barHatchPattern(base) ?? base;
    case "default":
    default:
      return verticalColorGradient(slots);
  }
}

// Dot helpers (DotStyle, dotItemStyle, DOT_SIZES, dotStyle, sampleGradient) now
// live in @/registry/ui/echarts-dot and are imported at the top of this file.

// Brush overlays + the dataZoom slider builder (BrushRange, BrushGeometry,
// BrushOverlayElements, syncBrushOverlay, buildBrushDataZoom) now live in
// @/registry/ui/echarts-brush and are imported at the top of this file. The
// per-chart mini-series (which differ per chart type) are still built below.

// ─────────────────────────────────────────────────────────────────────────────
// Curve mapping — linear → straight, step → step:"middle", everything else →
// smooth. Recharts "step" is d3's curveStep: the transition happens at the
// MIDPOINT between points, so each dot sits centered on its plateau.
// ─────────────────────────────────────────────────────────────────────────────

function curveConfig(curveType) {
  if (curveType === "step") return { smooth: false, step: "middle" };
  if (curveType === "linear") return { smooth: false, step: false };
  return { smooth: true, step: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Selection dim (§ recharts getOpacity / getBarOpacity) — a series dims only when
// ANOTHER series is selected; the selected (or no-selection) series stays at full
// strength. Line strokes and dots use seriesDim (0.3); bar FILLS use seriesFillDim
// (0.15) so the dimmed columns recede further than the lines, like the area
// chart's dimmed fill.
// ─────────────────────────────────────────────────────────────────────────────

function seriesDim(selected, key) {
  return selected === null || selected === key ? 1 : SELECTION_DIM;
}

function seriesFillDim(selected, key) {
  return selected === null || selected === key ? 1 : SELECTION_DIM_FILL;
}

function seriesLabel(config, key) {
  const label = config[key]?.label;
  return typeof label === "string" ? label : key;
}

// How many stagger steps a bar at `index` waits before it grows in — the order
// encoded by `animationType`. Bars are independent rectangles, so (unlike the
// line's single left-to-right clip) the direction values are honored here via a
// per-datum `animationDelay`. Ported verbatim from the ECharts bar chart.
function barStaggerDelay(type, index, count) {
  if (type === "none" || count <= 0) return 0;
  const last = count - 1;
  const center = last / 2;
  let step;
  switch (type) {
    case "right-to-left":
      step = last - index;
      break;
    case "center-out":
      step = Math.abs(index - center);
      break;
    case "edges-in":
      step = center - Math.abs(index - center);
      break;
    default: // left-to-right
      step = index;
  }
  return step * BAR_STAGGER;
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton helpers
// ─────────────────────────────────────────────────────────────────────────────

// Skeleton data as a smooth random walk in a comfortable band — reads like a
// resting chart instead of raw noise spikes.
function getLoadingData(points) {
  const rows = [];
  let value = 30 + Math.random() * 20;
  for (let i = 0; i < points; i++) {
    value = Math.min(58, Math.max(16, value + (Math.random() - 0.5) * 16));
    rows.push(Math.round(value));
  }
  return rows;
}

// Gradient stops forming a hard clip window around `center`: full `peak` alpha
// inside, zero outside, with a small feather so the edge isn't aliased.
// `center` may run outside [0, 1] so the window fully enters and exits the frame.
function shimmerWindowStops(center, color, peak) {
  const half = LOADING_SHIMMER_BAND;
  const feather = LOADING_SHIMMER_FEATHER;

  const alphaAt = (x) => {
    const dist = Math.abs(x - center);
    if (dist <= half - feather) return peak;
    if (dist >= half) return 0;
    // Sine-eased falloff — a linear ramp still reads as a hard cut.
    return peak * Math.sin(((1 - (dist - (half - feather)) / feather) * Math.PI) / 2);
  };

  const offsets = [
    0,
    center - half,
    center - half + feather,
    center,
    center + half - feather,
    center + half,
    1,
  ]
    .filter((x) => x >= 0 && x <= 1)
    .sort((a, b) => a - b);

  const stops = [];
  for (const offset of offsets) {
    if (stops.length === 0 || offset - stops[stops.length - 1].offset > 1e-4) {
      stops.push({ offset, color: withAlpha(color, alphaAt(offset)) });
    }
  }
  return stops;
}

// Grid insets plus the footer band reserved for the brush. ECharts 6 contains
// axis labels automatically (the legacy `containLabel` flag now only triggers a
// deprecation warning).
function buildChartLayout(
  {
    legendSlot,
    xAxisSlot,
    showBrush,
    brushHeight
  }
) {
  const legendTop = legendSlot.present && legendSlot.verticalAlign === "top";
  const legendBottom = legendSlot.present && legendSlot.verticalAlign === "bottom";
  // Clearance covers the x-axis labels plus the same breathing room the
  // Recharts twin leaves between them and the brush. An x-axis TITLE renders
  // below the labels (nameGap), so it needs its own band above the brush frame.
  const brushGap = showBrush ? brushHeight + 30 + (xAxisSlot.label ? 22 : 0) : 0;

  return {
    grid: {
      left: 8,
      right: 8,
      top: legendTop ? 42 : 16,
      bottom: 8 + brushGap + (legendBottom ? 34 : 0),
    },
    brushBottom: legendBottom ? 34 : 6,
  };
}

function buildMainAxes(ctx) {
  const { xAxisSlot, yAxisSlot, showGrid, isLoading, bars, categories, loadingData } = ctx;
  const { tokens } = ctx.resolved;

  const axisLabelColor = tokens.mutedForeground;
  const splitLineColor = withAlpha(tokens.border, GRID_LINE_OPACITY);
  // Gridline gray as an opaque color — see flattenColor.
  const tickDotColor = flattenColor(splitLineColor, tokens.background);
  // Bars need band spacing (points centered in categories); a line-only chart
  // spans edge to edge. The loading skeleton is bars, so it always bands.
  const hasBars = bars.length > 0 || isLoading;

  const xTickFormatter = xAxisSlot.tickFormatter;
  const yTickFormatter = yAxisSlot.tickFormatter;

  const xAxis = {
    type: "category",
    boundaryGap: hasBars,
    show: true,
    data: isLoading ? loadingData().map((_, i) => i) : categories,
    // Axis title — same size/color as the tick labels, pushed clear of them.
    name: isLoading ? undefined : xAxisSlot.label,
    nameLocation: "middle",
    nameGap: 30,
    nameTextStyle: { color: axisLabelColor, fontSize: 10 },
    axisLine: { show: false },
    // Tick DOTS: a near-zero-length tick whose round caps form a true circle,
    // in the gridline gray (flattened opaque so the caps don't stack).
    axisTick: {
      show: !isLoading && xAxisSlot.present && !xAxisSlot.hideDots,
      length: 0.5,
      // With bars the axis uses boundaryGap, which would drop each tick on the
      // BOUNDARY between categories instead of under its label.
      alignWithLabel: true,
      lineStyle: { color: tickDotColor, width: 3, cap: "round" },
    },
    splitLine: { show: false },
    axisLabel: {
      show: !isLoading && xAxisSlot.present,
      color: axisLabelColor,
      fontSize: 10,
      margin: 8,
      formatter: xTickFormatter
        ? (value, index) => xTickFormatter(value, index)
        : undefined,
    },
  };

  // An ECharts axis with `show: false` hides its splitLines too, but Recharts'
  // <CartesianGrid> draws with or without a visible <YAxis>. Keep the axis on
  // whenever <Grid/> is present and gate the LABELS on <YAxis/> instead. Bars
  // baseline at 0, matching the Recharts twin's value axis.
  const yAxis = {
    type: "value",
    show: yAxisSlot.present || showGrid,
    min: bars.length > 0 ? 0 : undefined,
    // Axis title — rendered rotated alongside the tick labels, same styling.
    name: isLoading ? undefined : yAxisSlot.label,
    nameLocation: "middle",
    nameGap: 38,
    nameTextStyle: { color: axisLabelColor, fontSize: 10 },
    axisLine: { show: false },
    // Same tick dots as the x-axis, beside each value label. No alignWithLabel
    // here: ECharts types it on the CATEGORY axis only, and a value axis already
    // puts its ticks on the labels.
    axisTick: {
      show: yAxisSlot.present && !isLoading && !yAxisSlot.hideDots,
      length: 0.5,
      lineStyle: { color: tickDotColor, width: 3, cap: "round" },
    },
    splitLine: {
      // Hidden while loading — the skeleton floats on a clean canvas.
      show: showGrid && !isLoading,
      lineStyle: { color: splitLineColor, type: [3, 3], width: 1 },
    },
    axisLabel: {
      // Hidden while loading — skeleton values are meaningless, and the
      // Recharts YAxis unmounts during loading too.
      show: yAxisSlot.present && !isLoading,
      color: axisLabelColor,
      fontSize: 10,
      margin: 8,
      formatter: yTickFormatter
        ? (value, index) => yTickFormatter(value, index)
        : undefined,
    },
  };

  return { xAxis, yAxis };
}

// Tooltip HTML builder, closed over the build context.
function createTooltipFormatter(ctx) {
  const { config, selectedDataKey, tooltipSlot } = ctx;

  return params => {
    const rows = Array.isArray(params) ? params : [params];
    if (!rows.length) return "";

    const first = rows[0];
    // Label shows the RAW axis value — matches ChartTooltipContent (no tick formatter).
    const axisValue = first.axisValue ?? first.name ?? "";
    const label = String(axisValue);

    const body = rows
      .map((param) => {
        const p = param;
        // Internal series (the brush's mini chart, the loading skeleton) never
        // surface in the tooltip.
        if (String(p.seriesId ?? "").startsWith("__")) return "";
        const key = p.seriesId ?? p.seriesName ?? "";
        const item = config[key];
        const colorsCount = item ? getColorsCount(item) : 1;
        const labelText = typeof item?.label === "string" ? item.label : (p.seriesName ?? key);
        const dimmed = selectedDataKey != null && selectedDataKey !== key ? " opacity-30" : "";
        const value =
          typeof p.value === "number" ? p.value.toLocaleString() : String(p.value ?? "");

        return tooltipRow({
          indicatorHtml: tooltipIndicatorHtml(key, colorsCount),
          labelText,
          valueText: value,
          dimmed,
        });
      })
      .join("");

    return tooltipShell({
      label,
      body,
      roundness: tooltipSlot.roundness,
      variant: tooltipSlot.variant,
    });
  };
}

function buildTooltipOption(ctx) {
  const { tooltipSlot, isLoading } = ctx;
  const { tokens } = ctx.resolved;

  return {
    ...tooltipBaseOption({
      present: tooltipSlot.present && !isLoading,
      cursor: tooltipSlot.cursor,
      tokens,
      position: tooltipSlot.position,
      axisPointerColor: withAlpha(tokens.border, AXIS_POINTER_OPACITY),
      strokeWidth: AXIS_POINTER_WIDTH,
    }),
    formatter: createTooltipFormatter(ctx),
  };
}

// ── Brush — the evil-brush look, canvas-style: a real mini chart of the full
// data in a second grid, with a transparent slider dataZoom laid over it. Every
// bar and line is mirrored as a compact area-line (the EvilBrush "area" variant),
// so the footer reads as one silhouette. Both zoom entries target only the MAIN
// x-axis, so the mini chart never filters itself. Only called when `showBrush`.
function buildBrushOption(ctx, brushBottom) {
  const { data, bars, lines, curveType, selectedDataKey, brushHeight, categories } = ctx;
  const { tokens } = ctx.resolved;

  const miniGrid = {
    left: 8,
    right: 8,
    bottom: brushBottom,
    height: brushHeight,
    // No visible axes here — opt out of label containment so the mini chart
    // spans the full brush frame.
    outerBoundsMode: "none",
  };

  const miniXAxis = {
    type: "category",
    gridIndex: 1,
    boundaryGap: false,
    show: false,
    data: categories,
    axisPointer: { show: false },
  };

  const miniYAxis = { type: "value", gridIndex: 1, show: false };

  // Mirror bars and lines alike as area-lines. Bars carry no curve, so they use
  // the chart default; lines carry their own.
  const miniInputs = [
    ...bars.map((bar) => ({ dataKey: bar.dataKey, curveType: undefined, connectNulls: false })),
    ...lines.map((line) => ({
      dataKey: line.dataKey,
      curveType: line.curveType,
      connectNulls: line.connectNulls,
    })),
  ];

  const miniSeries = miniInputs.map((input) => {
    const key = input.dataKey;
    const base = (ctx.resolved.series[key] ?? [])[0] ?? "rgba(120, 120, 120, 1)";
    const curve = curveConfig(input.curveType ?? curveType);

    // The mini chart mirrors the click selection: unselected series recede like
    // the main plot — the stroke by seriesDim, the fill by the deeper fill dim.
    const dim = seriesDim(selectedDataKey, key);
    const fillDim = seriesFillDim(selectedDataKey, key);

    return {
      id: `__mini-${key}`,
      type: "line",
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: data.map((row) => Number(row[key]) || 0),
      smooth: curve.smooth,
      step: curve.step,
      connectNulls: input.connectNulls,
      silent: true,
      showSymbol: false,
      emphasis: { disabled: true },
      tooltip: { show: false },
      lineStyle: { color: base, width: 1, opacity: BRUSH_STROKE_OPACITY * dim },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: withAlpha(base, BRUSH_FILL_OPACITY * fillDim) },
          { offset: 1, color: withAlpha(base, 0) },
        ]),
      },
      z: 0,
    };
  });

  const dataZoom = buildBrushDataZoom({
    brushBottom,
    brushHeight,
    brushRange: ctx.brushRange,
    fillerColor: withAlpha(tokens.foreground, BRUSH_FILLER_OPACITY),
  });

  return { miniGrid, miniXAxis, miniYAxis, miniSeries, dataZoom };
}

// Loading skeleton — a gray bar wave AND a gray line over it, because THIS chart
// is bars + lines (unlike the pure bar or area chart, whose skeleton is a single
// shape). Both are swept by the SAME diagonal shimmer window (see the shimmer rAF:
// one shared absolute-pixel clip gradient drives the bar fill and the line stroke,
// so they light up together).
function buildLoadingOption(ctx, frame) {
  const { tokens } = ctx.resolved;

  return {
    animation: false,
    grid: frame.grid,
    xAxis: frame.xAxis,
    yAxis: frame.yAxis,
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "bar",
        data: ctx.loadingData(),
        barCategoryGap: "30%",
        // Invisible until the first shimmer tick positions the clip window.
        itemStyle: {
          color: withAlpha(tokens.foreground, 0),
          borderRadius: [DEFAULT_BAR_RADIUS, DEFAULT_BAR_RADIUS, 0, 0],
        },
        silent: true,
        z: 1,
      },
      {
        id: "__loading-line",
        type: "line",
        data: ctx.loadingLineData(),
        smooth: true,
        showSymbol: false,
        symbol: "none",
        // Invisible until the first shimmer tick positions the clip window.
        lineStyle: { color: withAlpha(tokens.foreground, 0), width: LOADING_LINE_WIDTH },
        silent: true,
        z: 2,
      },
    ],
  };
}

function buildBarSeries(ctx) {
  const { data, config, bars, animationType, selectedDataKey, resolved, barGap, barCategoryGap } =
    ctx;
  // While a series is click-selected the selection dim owns the canvas — hover
  // highlighting is suspended until it clears (see the emphasis/blur switch below).
  const hasSelection = selectedDataKey !== null;

  return bars.map((bar) => {
    const key = bar.dataKey;
    const slots = resolved.series[key] ?? ["rgba(120, 120, 120, 1)"];
    const base = slots[0];
    const multiColor = slots.length > 1;
    const fillDim = seriesFillDim(selectedDataKey, key);
    const values = data.map((row) => Number(row[key]) || 0);
    const barAnim = bar.animationType ?? animationType;

    // Glow — a soft canvas shadow behind the bar, the analogue of the Recharts
    // feGaussianBlur. A single-color bar tints its whole shadow with its color;
    // a multi-color bar samples the gradient PER-DATUM so each column's halo
    // follows the palette at its x-position (a single flat tint would be wrong).
    const glowSeriesStyle =
      bar.glow && !multiColor
        ? { shadowBlur: BAR_GLOW_BLUR, shadowColor: withAlpha(base, BAR_GLOW_OPACITY) }
        : {};

    const dataPoints =
      bar.glow && multiColor
        ? values.map((value, i) => {
            const t = values.length > 1 ? i / (values.length - 1) : 0;
            return {
              value,
              itemStyle: {
                shadowBlur: BAR_GLOW_BLUR,
                shadowColor: withAlpha(sampleGradient(slots, t), BAR_GLOW_OPACITY),
              },
            };
          })
        : values;

    const series = {
      id: key,
      name: seriesLabel(config, key),
      type: "bar",
      data: dataPoints,
      barGap,
      barCategoryGap,
      cursor: bar.isClickable ? "pointer" : "default",
      // Bars sit behind lines (z 2 vs 3), matching the Recharts twin's JSX order.
      z: 2,
      itemStyle: {
        color: barFillPaint(bar.variant, slots),
        opacity: fillDim,
        // Stripped bars are square (their solid top strip lives in the fill);
        // every other variant rounds all four corners like the Recharts twin.
        borderRadius: bar.variant === "stripped" ? 0 : bar.radius,
        ...glowSeriesStyle,
      },
      // Per-datum grow-in: bars rise from the baseline, staggered by animationType.
      // Only takes effect on the reveal push (top-level `animation: true`); every
      // later push sends `animation: false`, so the stagger is dormant then.
      animationDuration: BAR_GROW_DURATION,
      animationEasing: "cubicOut",
      animationDelay: (idx) => barStaggerDelay(barAnim, idx, data.length),
      // Hover-highlight dims the OTHER columns of this bar via ECharts-native
      // emphasis — `focus: "self"` blurs siblings, `blurScope: "series"` keeps
      // the blur inside this bar (so lines and other bars are untouched). This is
      // the canvas equivalent of the twin's per-column dim, driven natively so no
      // option is pushed mid-hover. Once a series is click-SELECTED, hover
      // highlighting is suspended: focus drops to "none" and the blur is removed so
      // hovering no longer re-dims anything (the option rebuilds on selection
      // change, so this build-time switch flips automatically and resumes on clear).
      emphasis:
        bar.enableHoverHighlight && !hasSelection
          ? { focus: "self", blurScope: "series" }
          : { focus: "none" },
      blur:
        bar.enableHoverHighlight && !hasSelection
          ? { itemStyle: { opacity: SELECTION_DIM_FILL } }
          : undefined,
    };

    return bar.barProps ? { ...series, ...bar.barProps } : series;
  });
}

function buildLineSeries(ctx) {
  const { data, config, lines, curveType, selectedDataKey, resolved } = ctx;

  return lines.map((line) => {
    const key = line.dataKey;
    const slots = resolved.series[key] ?? ["rgba(120, 120, 120, 1)"];
    const paint = seriesPaint(slots);
    const dim = seriesDim(selectedDataKey, key);
    const curve = curveConfig(line.curveType ?? curveType);
    const values = data.map((row) => Number(row[key]) || 0);

    const restingDot = dotStyle(line.dotVariant, paint, resolved.tokens.background);
    const activeDot = dotStyle(line.activeDotVariant, paint, resolved.tokens.background);
    const restingVisible = line.dotVariant !== "none";
    const multiColor = slots.length > 1;

    // Multi-color lines tint each symbol with the gradient's color at its own
    // x-position (per-datum itemStyle), like the Recharts dots. The stroke keeps
    // the full horizontal gradient.
    const dataPoints = !multiColor
      ? values
      : values.map((value, i) => {
          const t = values.length > 1 ? i / (values.length - 1) : 0;
          const pointColor = sampleGradient(slots, t);
          return {
            value,
            itemStyle: {
              ...dotItemStyle(
                restingVisible ? line.dotVariant : line.activeDotVariant,
                pointColor,
                resolved.tokens.background,
              ),
              opacity: dim,
            },
            emphasis: {
              itemStyle: {
                ...dotItemStyle(
                  line.activeDotVariant === "none" ? "default" : line.activeDotVariant,
                  pointColor,
                  resolved.tokens.background,
                ),
                opacity: 1,
              },
            },
          };
        });

    const series = {
      id: key,
      name: seriesLabel(config, key),
      type: "line",
      data: dataPoints,
      smooth: curve.smooth,
      step: curve.step,
      connectNulls: line.connectNulls,
      cursor: line.isClickable ? "pointer" : "default",
      // By default ECharts fires mouse events only on the symbols — this makes
      // the whole polyline clickable, like the Recharts <Line>.
      // (`true` covers both; the deprecated `triggerLineEvent` did the same.)
      triggerEvent: line.isClickable,
      showSymbol: restingVisible,
      symbol: "circle",
      symbolSize: restingVisible ? restingDot.size : activeDot.size,
      z: 3,
      // The glow is NOT a shadowBlur here — a single shadowColor can't follow the
      // horizontal gradient. It is a stack of silent wide overlay copies painted
      // with the same gradient, added by buildLineGlowSeries and rendered under
      // this crisp stroke.
      lineStyle: {
        color: paint,
        width: STROKE_WIDTH,
        opacity: dim,
        type: line.strokeVariant === "solid" ? "solid" : DASH_PATTERN,
        dashOffset: 0,
      },
      itemStyle: multiColor
        ? { opacity: dim }
        : {
            ...(restingVisible ? restingDot.itemStyle : activeDot.itemStyle),
            opacity: dim,
          },
      emphasis: {
        focus: "none",
        scale: restingVisible ? activeDot.size / Math.max(restingDot.size, 1) : 1,
        ...(multiColor ? {} : { itemStyle: { ...activeDot.itemStyle, opacity: 1 } }),
      },
    };

    return line.lineProps ? { ...series, ...line.lineProps } : series;
  });
}

// Glow overlay copies for glowing lines — a few SILENT, symbol-less line series
// painted with the SAME gradient as the real stroke, widening and fading outward
// (see LINE_GLOW_LAYERS). Stacked UNDER the crisp line, the wide low-alpha
// gradient strokes read as a soft colored blur that follows the series color along
// its whole length — the canvas analogue of the Recharts feGaussianBlur, and
// unlike a single-tint shadowColor it stays color-faithful on multi-stop series.
//
// These are appended AFTER the main bar+line series (so the seriesIndex→key map
// the click handler relies on is unchanged) and pushed under the lines by z: the
// widest/faintest layer paints first, the real line last.
function buildLineGlowSeries(ctx) {
  const { data, lines, curveType, selectedDataKey, resolved } = ctx;

  return lines
    .filter((line) => line.glow)
    .flatMap((line) => {
      const key = line.dataKey;
      const slots = resolved.series[key] ?? ["rgba(120, 120, 120, 1)"];
      const paint = seriesPaint(slots);
      const dim = seriesDim(selectedDataKey, key);
      const curve = curveConfig(line.curveType ?? curveType);
      const values = data.map((row) => Number(row[key]) || 0);

      // Widest (faintest) first so it paints beneath the tighter, brighter layers.
      return [...LINE_GLOW_LAYERS].reverse().map((layer, i) => ({
        id: `__glow-${key}-${i}`,
        type: "line",
        data: values,
        smooth: curve.smooth,
        step: curve.step,
        connectNulls: line.connectNulls,
        silent: true,
        showSymbol: false,
        symbol: "none",
        emphasis: { disabled: true },
        tooltip: { show: false },
        // Sits above the bars (z 2) but below the crisp line (z 3).
        z: 2,
        lineStyle: {
          color: paint,
          width: layer.width,
          opacity: layer.opacity * dim,
          // The halo itself. Full-alpha color: the element opacity above already
          // scales its shadow, so pre-dimming here would square the alpha.
          shadowBlur: layer.blur,
          shadowColor: sampleGradient(slots, 0.5),
          cap: "round",
          join: "round",
        },
      }));
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apache ECharts port of the EvilCharts composed chart, exposing a
 * compound-as-config API so its JSX reads identically to the Recharts twin. The
 * root owns the data, config, selection state, loading skeleton, intro reveal,
 * and optional zoom brush; every visual part — `<Bar>`, `<Line>`, `<XAxis>`,
 * `<YAxis>`, `<Grid>`, `<Tooltip>`, `<Legend>`, plus `<Dot>` / `<ActiveDot>`
 * inside a `<Line>` — is composed as a declarative child that renders nothing.
 * The root walks those children by reference and drives a single imperative
 * ECharts instance. Fully self-contained: its only dependencies are `react`,
 * `echarts`, and `motion`.
 */
export function EChartsComposedChart(
  {
    data,
    config,
    renderer = DEFAULT_ECHARTS_RENDERER,
    xDataKey,
    className,
    curveType = "linear",
    animation = true,
    animationType = "left-to-right",
    barGap,
    barCategoryGap,
    defaultSelectedDataKey = null,
    onSelectionChange,
    isLoading = false,
    loadingBars = LOADING_DEFAULT_BARS,
    chartOptions,
    children
  }
) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef(null);
  const mountRef = useRef(null);
  const echartsRef = useRef(null);

  // The single imperative surface (see LiveState). `resolved` lives here rather
  // than in state: as state it forced an extra render pass and an effect whose
  // only job was to trigger the option push — the "chain of computations"
  // react.dev/learn/you-might-not-need-an-effect warns about. The object
  // identity is stable for the component's lifetime.
  const live = useRef({
    resolved: null,
    hasRevealed: false,
    revealEndsAt: 0,
    loadingRows: null,
    loadingLineRows: null,
    categories: [],
    dataLength: 0,
    brushRange: { start: 0, end: 100 },
    brushGeom: null,
    brushOverlay: null,
    brushHover: { inside: false, left: false, right: false },
    handlers: {
      onBrushChange: undefined,
      onSelectionChange,
      clickableKeys: new Set(),
      selectedDataKey: defaultSelectedDataKey,
      brushFormatLabel: undefined,
      seriesKeys: [],
    },
    repush: () => {},
  }).current;

  // Skeleton rows roll lazily on first use — an impure useRef initializer would
  // re-roll Math.random() on every render. The bar heights and the line values are
  // independent walks so the skeleton line rides over the bars rather than tracing
  // their tops; both re-roll together while the shimmer window is off-screen.
  const loadingData = useCallback(
    () => (live.loadingRows ??= getLoadingData(loadingBars)),
    [live, loadingBars],
  );
  const loadingLineData = useCallback(
    () => (live.loadingLineRows ??= getLoadingData(loadingBars)),
    [live, loadingBars],
  );
  const shouldReduceMotion = useReducedMotion();

  const [selectedDataKey, setSelectedDataKey] = useState(defaultSelectedDataKey);

  // ── Declarative config, collected from children by reference ─────────────────
  const collected = useMemo(() => collectConfig(children), [children]);
  const {
    bars,
    lines,
    xAxis: xAxisSlot,
    yAxis: yAxisSlot,
    showGrid,
    tooltip: tooltipSlot,
    legend: legendSlot,
    brush: brushSlot,
  } = collected;

  // Brush is declared as a <Brush> child now — presence replaces the old
  // showBrush prop, and its props feed the same internals.
  const showBrush = brushSlot.present;
  const brushHeight = brushSlot.height ?? 56;

  // seriesKeys are ordered bars-then-lines, matching the series array — the click
  // handler recovers a series key from a polygon click's seriesIndex by position.
  const seriesKeys = useMemo(
    () => [...bars.map((bar) => bar.dataKey), ...lines.map((line) => line.dataKey)],
    [bars, lines],
  );

  // x category key: <XAxis dataKey> → root xDataKey → first data column no series claims.
  const xCategoryKey = useMemo(() => {
    if (xAxisSlot.dataKey) return xAxisSlot.dataKey;
    if (xDataKey) return xDataKey;
    const firstRow = data[0];
    if (firstRow) {
      const claimed = new Set(seriesKeys);
      const found = Object.keys(firstRow).find((key) => !claimed.has(key));
      if (found) return found;
    }
    return "";
  }, [xAxisSlot.dataKey, xDataKey, data, seriesKeys]);

  // The intro draw-in follows the first declared series' setting, falling back to
  // the root default.
  const effectiveAnimation = bars[0]?.animationType ?? lines[0]?.animationType ?? animationType;

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  // Which series may be clicked to toggle selection (consulted by the click handler).
  const clickableKeys = useMemo(
    () =>
      new Set([
        ...bars.filter((bar) => bar.isClickable).map((bar) => bar.dataKey),
        ...lines.filter((line) => line.isClickable).map((line) => line.dataKey),
      ]),
    [bars, lines],
  );

  // Refresh the handlers' snapshot of the latest callbacks/flags every render.
  live.handlers = {
    onBrushChange: brushSlot.onChange,
    onSelectionChange,
    clickableKeys,
    selectedDataKey,
    brushFormatLabel: brushSlot.formatLabel,
    seriesKeys,
  };
  live.dataLength = data.length;

  const toggleSelection = useCallback(
    (key) => {
      setSelectedDataKey((prev) => {
        const next = prev === key ? null : key;
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange],
  );

  // Reposition the brush overlays from the live refs — safe to call from drag
  // events, hover tracking, and pushes alike, since it never touches setOption.
  const syncBrushOverlayNow = useCallback(() => {
    const chart = echartsRef.current;
    if (!chart) return;

    const geom = live.brushGeom;
    const tokens = live.resolved?.tokens;
    if (!geom || !tokens) {
      syncBrushOverlay(chart, live, null);
      return;
    }

    const range = live.brushRange;
    const categories = live.categories;
    const format = live.handlers.brushFormatLabel;
    const lastIndex = Math.max(categories.length - 1, 0);
    const startIndex = Math.round((range.start / 100) * lastIndex);
    const endIndex = Math.round((range.end / 100) * lastIndex);
    const labels =
      format && categories.length
        ? {
            start: format(categories[startIndex] ?? "", startIndex),
            end: format(categories[endIndex] ?? "", endIndex),
          }
        : null;

    syncBrushOverlay(chart, live, {
      range,
      geom,
      size: { width: chart.getWidth(), height: chart.getHeight() },
      tokens,
      labels,
      showLabels: live.brushHover.inside,
      hover: live.brushHover,
    });
  }, [live]);

  // ── Option builder ─────────────────────────────────────────────────────────
  // Thin orchestrator over the pure builders above: snapshot the imperative
  // surface (refs, renderer size) into an OptionBuildContext, then assemble.
  const buildOption = useCallback(() => {
    const resolved = live.resolved;
    if (!resolved) return {};

    const categories = data.map((row) => String(row[xCategoryKey]));
    live.categories = categories;

    const ctx = {
      data,
      config,
      bars,
      lines,
      seriesKeys,
      curveType,
      animationType,
      barGap,
      barCategoryGap,
      selectedDataKey,
      showGrid,
      xAxisSlot,
      yAxisSlot,
      tooltipSlot,
      legendSlot,
      isLoading,
      loadingData,
      loadingLineData,
      showBrush,
      brushHeight,
      resolved,
      categories,
      brushRange: live.brushRange,
    };

    const { grid, brushBottom } = buildChartLayout(ctx);
    live.brushGeom = showBrush ? { bottom: brushBottom, height: brushHeight } : null;

    const { xAxis, yAxis } = buildMainAxes(ctx);

    if (isLoading) return buildLoadingOption(ctx, { grid, xAxis, yAxis });

    const brush = showBrush ? buildBrushOption(ctx, brushBottom) : null;

    return {
      animation: false,
      grid: brush ? [grid, brush.miniGrid] : grid,
      xAxis: brush ? [xAxis, brush.miniXAxis] : xAxis,
      yAxis: brush ? [yAxis, brush.miniYAxis] : yAxis,
      tooltip: buildTooltipOption(ctx),
      dataZoom: brush?.dataZoom,
      // bars before lines so the polyline strokes read above the columns. Line
      // glow copies come AFTER the main series (their z keeps them under the lines
      // and over the bars) so the seriesIndex→key map for clicks stays intact.
      series: [
        ...buildBarSeries(ctx),
        ...buildLineSeries(ctx),
        ...buildLineGlowSeries(ctx),
        ...(brush?.miniSeries ?? []),
      ],
    };
  }, [
    live,
    data,
    config,
    bars,
    lines,
    seriesKeys,
    xCategoryKey,
    curveType,
    animationType,
    barGap,
    barCategoryGap,
    selectedDataKey,
    showGrid,
    xAxisSlot,
    yAxisSlot,
    tooltipSlot,
    legendSlot,
    isLoading,
    loadingData,
    loadingLineData,
    showBrush,
    brushHeight,
  ]);

  // ── Init + resize + theme observer (per renderer instance) ──────────────────
  useEffect(() => {
    const mount = mountRef.current;
    const container = containerRef.current;
    if (!mount || !container) return;

    const chart = echarts.init(mount, null, { renderer });
    echartsRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      // Observers always fire once right after observe(). Repushing on that
      // no-op fire would land one frame into the intro and stomp the reveal —
      // only react when the renderer size actually changed.
      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) {
        return;
      }
      chart.resize();
      live.repush();
    });
    resizeObserver.observe(mount);

    // Light/dark flips change no React state — re-resolve and push directly.
    const themeObserver = new MutationObserver(() => {
      live.repush();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    chart.on("click", (params) => {
      const { clickableKeys: clickable, seriesKeys: keys } = live.handlers;
      const p = params;
      // Symbol clicks carry seriesId; line-polygon clicks (triggerEvent)
      // only carry seriesIndex — recover the key by position. Main series (bars
      // then lines) come first in the series array, so the index maps directly.
      const id =
        p.seriesId ?? (typeof p.seriesIndex === "number" ? keys[p.seriesIndex] : undefined);
      if (typeof id === "string" && clickable.has(id)) toggleSelection(id);
    });

    chart.on("datazoom", () => {
      const option = chart.getOption();
      const zoom = option.dataZoom?.[0];
      if (!zoom) return;

      // Ride the selection — pure zrender updates, so the drag stays 1:1.
      live.brushRange = { start: zoom.start ?? 0, end: zoom.end ?? 100 };
      syncBrushOverlayNow();

      const { onBrushChange: onChange } = live.handlers;
      if (!onChange) return;
      const len = live.dataLength;
      const startIndex = Math.round(((zoom.start ?? 0) / 100) * (len - 1));
      const endIndex = Math.round(((zoom.end ?? 100) / 100) * (len - 1));
      onChange({ startIndex, endIndex });
    });

    // Hover tracking for the overlay: labels show while the pointer is over the
    // brush, and each pill brightens when the pointer is near its edge.
    const zr = chart.getZr();
    const applyHover = (next) => {
      const prev = live.brushHover;
      if (prev.inside === next.inside && prev.left === next.left && prev.right === next.right) {
        return;
      }
      live.brushHover = next;
      syncBrushOverlayNow();
    };
    const onZrMove = (event) => {
      const geom = live.brushGeom;
      if (!geom) return;
      const x = event.offsetX ?? -1;
      const y = event.offsetY ?? -1;
      const top = chart.getHeight() - geom.bottom - geom.height;
      const inside = y >= top - 4 && y <= top + geom.height + 4;
      const trackLeft = 8;
      const trackWidth = Math.max(chart.getWidth() - 16, 1);
      const { start, end } = live.brushRange;
      const selectionLeft = trackLeft + (trackWidth * start) / 100;
      const selectionRight = trackLeft + (trackWidth * end) / 100;
      applyHover({
        inside,
        left: inside && Math.abs(x - selectionLeft) <= 8,
        right: inside && Math.abs(x - selectionRight) <= 8,
      });
    };
    const onZrOut = () => applyHover({ inside: false, left: false, right: false });
    zr.on("mousemove", onZrMove);
    zr.on("globalout", onZrOut);

    return () => {
      zr.off("mousemove", onZrMove);
      zr.off("globalout", onZrOut);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.dispose();
      echartsRef.current = null;
      // The overlay elements died with the zrender instance.
      live.brushOverlay = null;
      live.brushHover = { inside: false, left: false, right: false };
      // The reveal guard belongs to the chart instance it guarded. Without this
      // reset, StrictMode's dev-only mount→unmount→remount plays the entrance on
      // the throwaway instance and the surviving one renders without it.
      live.hasRevealed = false;
    };
  }, [renderer]);

  // ── Sync ECharts with props/theme/selection — resolve, build, push ────────────
  useEffect(() => {
    const chart = echartsRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;

    // Colors come from the <style> committed just before this effect ran — read
    // them here, right before the push, rather than round-tripping through state.
    live.resolved = resolveColors(container, config, seriesKeys);

    const push = (withEntrance) => {
      const option = buildOption();
      const merged = chartOptions ? { ...option, ...chartOptions } : option;
      Object.assign(merged, {
        animation: withEntrance,
        animationDuration: REVEAL_DURATION,
        animationDurationUpdate: 0,
      });
      // chartOptions is an untyped escape hatch — the spread erases the option's
      // shape, so re-assert it. The only cast in the file.
      chart.setOption(merged, { notMerge: true });
      // Overlays live outside the option — reposition them after every push.
      syncBrushOverlayNow();
    };

    // Intro reveal — ECharts' native progressive draw, enabled only for the first
    // real render: lines trace in, bars grow up from their baseline, dots pop up
    // as the line front passes. Every later push (selection, theme, zoom) applies
    // instantly, since notMerge would otherwise replay the entrance on each of
    // them. A loading cycle re-arms it: the Recharts twin unmounts its series
    // while loading and replays the intro on remount, so data → loading → data
    // draws in again here too.
    if (isLoading) live.hasRevealed = false;
    const shouldReveal = !live.hasRevealed && !isLoading;
    if (shouldReveal) live.hasRevealed = true;
    const revealEnabled =
      animation && shouldReveal && effectiveAnimation !== "none" && !shouldReduceMotion;
    if (revealEnabled) live.revealEndsAt = performance.now() + REVEAL_DURATION;
    push(revealEnabled);

    // Theme flips and resizes re-enter here without touching React: re-read the
    // tokens (the .dark class changed, or the renderer resized) and push an
    // update-style option.
    live.repush = () => {
      live.resolved = resolveColors(container, config, seriesKeys);
      push(false);
    };
  }, [
    renderer,
    live,
    buildOption,
    chartOptions,
    isLoading,
    animation,
    effectiveAnimation,
    shouldReduceMotion,
    config,
    seriesKeys,
    syncBrushOverlayNow,
  ]);

  // ── Default tooltip index — show the tooltip at a fixed point with no hover ───
  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || isLoading) return;
    const index = tooltipSlot.defaultIndex;
    if (!tooltipSlot.present || index == null) return;

    // Let the reveal settle before parking the tooltip, so showTip doesn't fight
    // the entrance animation.
    const delay = Math.max(0, live.revealEndsAt - performance.now());
    const timer = setTimeout(() => {
      chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: index });
    }, delay + 60);

    return () => {
      clearTimeout(timer);
      // The renderer-init effect is declared first, so its cleanup may already
      // have disposed this instance during a renderer switch or unmount.
      if (!chart.isDisposed()) chart.dispatchAction({ type: "hideTip" });
    };
  }, [renderer, live, isLoading, tooltipSlot.present, tooltipSlot.defaultIndex]);

  // ── Animated dashed stroke — rAF sweeps the dash offset while unselected ─────
  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || isLoading) return;
    const animatedKeys = lines
      .filter((line) => line.strokeVariant === "animated-dashed")
      .map((line) => line.dataKey);
    const hasSelection = selectedDataKey !== null;
    if (animatedKeys.length === 0 || hasSelection) return;

    let raf = 0;
    let delayTimer;
    const begin = () => {
      const loopStart = performance.now();
      const tick = (now) => {
        // 0 → -DASH_PERIOD per second, so the dashes crawl one full period a second.
        const offset = -(((now - loopStart) / 1000) % 1) * DASH_PERIOD;
        chart.setOption(
          { series: animatedKeys.map((id) => ({ id, lineStyle: { dashOffset: offset } })) },
          { silent: true, lazyUpdate: true },
        );
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // Per-frame setOption churn fights the intro draw-in (each update pass
    // recomputes the reveal clip, crawling it to a standstill) — hold the dash
    // sweep until the entrance has finished.
    const delay = Math.max(0, live.revealEndsAt - performance.now());
    if (delay > 0) delayTimer = setTimeout(begin, delay + 50);
    else begin();

    return () => {
      if (delayTimer !== undefined) clearTimeout(delayTimer);
      cancelAnimationFrame(raf);
    };
  }, [renderer, live, lines, selectedDataKey, isLoading]);

  // ── Loading shimmer — rAF sweeps a bright clip window across the skeleton ─────
  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || !isLoading) return;

    let raf = 0;
    let lastPhase = 0;
    const start = performance.now();
    const tick = (now) => {
      const phase = ((((now - start) / LOADING_ANIMATION_DURATION) % 1) + 1) % 1;
      // Wrapped past 1 → the window is off-screen; swap in fresh random data for
      // BOTH the bars and the line so they regenerate together, unseen.
      if (phase < lastPhase) {
        live.loadingRows = getLoadingData(loadingBars);
        live.loadingLineRows = getLoadingData(loadingBars);
      }
      lastPhase = phase;

      // Read tokens per frame, so a theme flip mid-loading retints the shimmer.
      const foreground = live.resolved?.tokens.foreground ?? "rgba(120, 120, 120, 1)";
      const w = chart.getWidth();
      const h = chart.getHeight();
      if (!w || !h) {
        raf = requestAnimationFrame(tick);
        return;
      }
      // Sweep the clip window from fully off-screen left to fully off-screen
      // right, leaned 45°. The gradient uses ABSOLUTE pixel coordinates (global
      // gradient), so the window sits at the same place for every bar AND the line
      // — one shared shimmer window revealing the whole skeleton as a clean
      // diagonal band. Both clips are built from the SAME `center`, so the bars and
      // the line light up in lockstep; only the peak alpha differs (a thin line
      // needs more than a wide bar to read at the same brightness).
      const maxT = (w + h) / (2 * w);
      const center = phase * (maxT + 2 * LOADING_SHIMMER_BAND) - LOADING_SHIMMER_BAND;
      const barClip = new echarts.graphic.LinearGradient(
        0,
        0,
        w,
        w,
        shimmerWindowStops(center, foreground, LOADING_BAR_MAX_OPACITY),
        true,
      );
      const lineClip = new echarts.graphic.LinearGradient(
        0,
        0,
        w,
        w,
        shimmerWindowStops(center, foreground, LOADING_LINE_MAX_OPACITY),
        true,
      );
      chart.setOption(
        {
          series: [
            { id: "__loading", data: loadingData(), itemStyle: { color: barClip } },
            { id: "__loading-line", data: loadingLineData(), lineStyle: { color: lineClip } },
          ],
        },
        { silent: true, lazyUpdate: true },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [renderer, live, isLoading, loadingBars, loadingData, loadingLineData]);

  // ── Legend overlay position ──────────────────────────────────────────────────
  // Insets match the Recharts legend's breathing room inside the plot frame.
  const legendStyle = {
    position: "absolute",
    left: 16,
    right: 16,
    pointerEvents: "auto",
    ...(legendSlot.verticalAlign === "top"
      ? { top: 12 }
      : legendSlot.verticalAlign === "bottom"
        ? { bottom: showBrush ? brushHeight + 16 : 12 }
        : { top: "50%", transform: "translateY(-50%)" }),
  };

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="relative min-h-0 w-full flex-1">
        <div ref={mountRef} className="h-full min-h-0 w-full" />
      </div>

      {legendSlot.present && !isLoading && (
        <LegendOverlay
          seriesKeys={seriesKeys}
          config={config}
          variant={legendSlot.variant}
          align={legendSlot.align}
          verticalAlign={legendSlot.verticalAlign}
          selectedKey={selectedDataKey}
          hoveredKey={null}
          isClickable={legendSlot.isClickable}
          onToggle={toggleSelection}
          style={legendStyle}
        />
      )}

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-primary bg-background flex items-center justify-center gap-2 rounded-md border px-2 py-0.5 text-sm"
          >
            <div className="border-border border-t-primary h-3 w-3 animate-spin rounded-full border" />
            <span>Loading</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Composible parts attached as statics, so the chart reads as a single
// dot-notation namespace: <EChartsComposedChart.Bar />, .Line, .Brush, …
EChartsComposedChart.Bar = Bar;
EChartsComposedChart.Line = Line;
EChartsComposedChart.Dot = Dot;
EChartsComposedChart.ActiveDot = ActiveDot;
EChartsComposedChart.XAxis = XAxis;
EChartsComposedChart.YAxis = YAxis;
EChartsComposedChart.Grid = Grid;
EChartsComposedChart.Tooltip = Tooltip;
EChartsComposedChart.Legend = Legend;
EChartsComposedChart.Brush = Brush;
