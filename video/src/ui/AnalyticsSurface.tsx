import React from "react";
import { useCurrentFrame } from "remotion";

import { DigitRoll, animatedNumber } from "../motion/DigitRoll";
import { arrivalEasing, easeRange, travelEasing } from "../motion/easing";
import { DROP_FRAME } from "../timeline";

const CHART_POINTS: Array<[number, number, number]> = [
  // [xNorm, visitorsYNorm, signupsYNorm]
  [0.0, 0.78, 0.9],
  [0.09, 0.7, 0.86],
  [0.18, 0.74, 0.84],
  [0.27, 0.58, 0.78],
  [0.36, 0.62, 0.74],
  [0.45, 0.46, 0.66],
  [0.54, 0.5, 0.62],
  [0.64, 0.34, 0.54],
  [0.73, 0.38, 0.49],
  [0.82, 0.22, 0.42],
  [0.91, 0.26, 0.36],
  [1.0, 0.1, 0.28],
];

function buildSmoothPath(pts: Array<[number, number]>, w: number, h: number): string {
  if (pts.length === 0) return "";
  const scaled = pts.map(([x, y]) => [x * w, y * h] as [number, number]);
  let d = `M ${scaled[0][0].toFixed(1)} ${scaled[0][1].toFixed(1)}`;
  for (let i = 0; i < scaled.length - 1; i++) {
    const [x0, y0] = scaled[i];
    const [x1, y1] = scaled[i + 1];
    const cx = (x0 + x1) * 0.5;
    d += ` C ${cx.toFixed(1)} ${y0.toFixed(1)}, ${cx.toFixed(1)} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}

/**
 * Chapters 08 & 09 (frames 2834..3810):
 * - 08 ANALYTICS (frames 2834..3314): KPI cards roll in parallel (3,855 Visitors, 1,230 Signups, 31.9% Conversion, 72.2% Verified).
 *   EvilCharts-style area chart draws smoothly left-to-right alongside channel attribution bars.
 * - 09 MOMENTUM & BASS DROP (frames 3314..3810): At frame 3577 (59.61s bass drop), live signup counter surges 1,230 -> 1,248
 *   and top geo hubs light up in sync with the world-map background.
 */
export const AnalyticsSurface: React.FC = () => {
  const frame = useCurrentFrame();

  const dropSurge =
    frame >= DROP_FRAME ? easeRange(frame, DROP_FRAME, DROP_FRAME + 140, 0, 18, arrivalEasing) : 0;

  const visitors = animatedNumber(frame, 2860, 3120, 940, 3855) + Math.round(dropSurge * 3.2);
  const signups = animatedNumber(frame, 2860, 3140, 310, 1230) + Math.round(dropSurge);
  const conversion = animatedNumber(frame, 2880, 3140, 18.4, 31.9);
  const verifiedPct = animatedNumber(frame, 2900, 3160, 54.0, 72.2);

  const chartReveal = easeRange(frame, 2900, 3220, 0.08, 1, travelEasing);

  const chartW = 820;
  const chartH = 265;
  const visitorPts = CHART_POINTS.map(([x, vy]) => [x, vy] as [number, number]);
  const signupPts = CHART_POINTS.map(([x, , sy]) => [x, sy] as [number, number]);

  const visitorLine = buildSmoothPath(visitorPts, chartW, chartH);
  const visitorArea = `${visitorLine} L ${chartW} ${chartH} L 0 ${chartH} Z`;
  const signupLine = buildSmoothPath(signupPts, chartW, chartH);
  const signupArea = `${signupLine} L ${chartW} ${chartH} L 0 ${chartH} Z`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        height: "100%",
      }}
    >
      {/* Top 4 KPI Strip (matches public/product-tour/understand.mp4) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        {[
          {
            label: "Visitors",
            val: <DigitRoll value={visitors} fontSize={28} fontWeight={800} />,
            sub: "Distinct browsers · +28% 7d",
            pill: "LIVE",
          },
          {
            label: "Signups",
            val: <DigitRoll value={signups} fontSize={28} fontWeight={800} />,
            sub: "888 verified · 542 referred",
            pill: frame >= DROP_FRAME ? "+18 NOW" : "+142 TODAY",
            highlight: frame >= DROP_FRAME,
          },
          {
            label: "Conversion",
            val: (
              <DigitRoll
                value={conversion}
                decimals={1}
                suffix="%"
                fontSize={28}
                fontWeight={800}
              />
            ),
            sub: "Visitors who signed up",
            pill: "TOP 5%",
          },
          {
            label: "Verification",
            val: (
              <DigitRoll
                value={verifiedPct}
                decimals={1}
                suffix="%"
                fontSize={28}
                fontWeight={800}
              />
            ),
            sub: "Double opt-in + Turnstile",
            pill: "CLEAN",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: kpi.highlight ? "#F6FEE7" : "#FFFFFF",
              border: kpi.highlight ? "1.5px solid #9EE01A" : "1px solid #E4E7EA",
              borderRadius: 12,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#687076" }}>{kpi.label}</span>
              <span
                style={{
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 999,
                  backgroundColor: kpi.highlight ? "#BAFE2A" : "#EAF8F0",
                  color: kpi.highlight ? "#00160A" : "#196642",
                }}
              >
                {kpi.pill}
              </span>
            </div>
            <div>{kpi.val}</div>
            <div style={{ fontSize: 11.5, color: "#687076" }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Bottom Split: EvilCharts Area Curve + Acquisition Channels & Geo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 440px",
          gap: 18,
          flex: 1,
        }}
      >
        {/* Left: Activity over time (EvilCharts styling) */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E4E7EA",
            borderRadius: 12,
            padding: "18px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: "#00160A" }}>
                Activity over time
              </div>
              <div style={{ fontSize: 12, color: "#687076", marginTop: 2 }}>
                Last 30 days · Visitors vs. verified signups
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#2C3237",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: "#00160A",
                  }}
                />
                Visitors
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#196642",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: "#65A30D",
                  }}
                />
                Signups
              </span>
            </div>
          </div>

          {/* SVG Area Chart with progressive clip-path */}
          <div style={{ position: "relative", height: chartH, marginTop: 10 }}>
            <svg
              width={chartW}
              height={chartH}
              viewBox={`0 0 ${chartW} ${chartH}`}
              style={{ overflow: "visible" }}
            >
              <defs>
                <linearGradient id="wlVisitorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00160A" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#00160A" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="wlSignupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BAFE2A" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#196642" stopOpacity="0.04" />
                </linearGradient>
                <clipPath id="wlChartClip">
                  <rect x="0" y="0" width={chartW * chartReveal} height={chartH + 20} />
                </clipPath>
              </defs>

              {/* Horizontal grid lines */}
              {[0.2, 0.45, 0.7, 0.95].map((gy, i) => (
                <line
                  key={i}
                  x1={0}
                  x2={chartW}
                  y1={gy * chartH}
                  y2={gy * chartH}
                  stroke="#F1F3F5"
                  strokeWidth={1}
                />
              ))}

              <g clipPath="url(#wlChartClip)">
                <path d={visitorArea} fill="url(#wlVisitorGrad)" />
                <path d={visitorLine} fill="none" stroke="#00160A" strokeWidth={2.2} />
                <path d={signupArea} fill="url(#wlSignupGrad)" />
                <path d={signupLine} fill="none" stroke="#196642" strokeWidth={2.6} />
              </g>
            </svg>
          </div>
        </div>

        {/* Right: Channel Attribution & Top Countries */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E4E7EA",
            borderRadius: 12,
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: "#00160A" }}>
                Acquisition & geography
              </span>
              <span
                style={{
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 11,
                  color: "#196642",
                  fontWeight: 700,
                }}
              >
                UTM + REFERRER
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { name: "Referral loop (peer links)", pct: 44, count: "542" },
                { name: "X / Twitter (@weekend)", pct: 28, count: "344" },
                { name: "Product Hunt Launch", pct: 18, count: "221" },
                { name: "Direct & organic search", pct: 10, count: "123" },
              ].map((ch, idx) => {
                const barProg = easeRange(
                  frame,
                  2920 + idx * 18,
                  3160 + idx * 18,
                  0,
                  ch.pct,
                  arrivalEasing,
                );
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "#00160A",
                      }}
                    >
                      <span>{ch.name}</span>
                      <span
                        style={{
                          fontFamily: "'Paper Mono', monospace",
                          color: "#4B5258",
                        }}
                      >
                        {ch.count} · {ch.pct}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 7,
                        borderRadius: 999,
                        backgroundColor: "#F2F4F5",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${barProg * 1.9}%`,
                          height: "100%",
                          borderRadius: 999,
                          backgroundColor: idx === 0 ? "#BAFE2A" : "#00160A",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Geo Hubs Strip */}
          <div
            style={{
              paddingTop: 12,
              borderTop: "1px solid #EEF0F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {[
              { code: "US", val: "48%" },
              { code: "GB", val: "19%" },
              { code: "DE", val: "12%" },
              { code: "IN", val: "11%" },
              { code: "JP", val: "6%" },
            ].map((g, i) => (
              <div
                key={i}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  backgroundColor: frame >= DROP_FRAME && i < 3 ? "#F6FEE7" : "#F8FAFB",
                  border: frame >= DROP_FRAME && i < 3 ? "1px solid #9EE01A" : "1px solid #EAECEF",
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#00160A",
                }}
              >
                {g.code} · {g.val}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
