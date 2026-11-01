const DEFAULT_BRAND_HEIGHTS = [22, 38, 30];

/** Shared brand logo component used across OpenGraph image templates. */
export function BrandLogo({
  textSize = 34,
  height = 40,
  barWidth = 9,
  heights = DEFAULT_BRAND_HEIGHTS,
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          height,
          transform: "skewX(-12deg)",
        }}
      >
        <div
          style={{ width: barWidth, height: heights[0], background: "#c8f93f", borderRadius: 3 }}
        />
        <div
          style={{ width: barWidth, height: heights[1], background: "#c8f93f", borderRadius: 3 }}
        />
        <div
          style={{ width: barWidth, height: heights[2], background: "#c8f93f", borderRadius: 3 }}
        />
      </div>
      <div style={{ display: "flex", fontSize: textSize, fontWeight: 800, letterSpacing: -1 }}>
        <span>waitlyze</span>
        <span style={{ color: "#c8f93f" }}>.</span>
      </div>
    </div>
  );
}
