import React, { useEffect, useRef } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { easeRange, travelEasing, typeAndReplace } from "./motion/easing";
import voManifest from "./vo-manifest.json";

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = Math.round(voManifest.totalDuration * FPS); // 4693 frames (78.22s)

// Exact 36x18 continent + tech-hub bitmap from the original reference world map
const WORLD_MAP_ROWS: string[] = [
  "....................................",
  "....11111.....111.......11111111....",
  "..11111111...1111.....111111111111..",
  "..11211111........1121111111111111..",
  "...1111211.......11221111111111112..",
  "....11111........1111111112111121...",
  ".....111.........111111111111111....",
  "......11..111....1111111..11211.....",
  ".........11111....11111....111......",
  ".........111111...11111......11.....",
  "..........11211....1111.......11....",
  "..........1111.....112........111...",
  "...........111......11.......11121..",
  "...........11................11111..",
  "............1.................112...",
  "....................................",
  "....................................",
  "....................................",
];

function hash2(ix: number, iy: number): number {
  const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number): number {
  let v = 0;
  let amp = 0.55;
  let freq = 1;
  for (let i = 0; i < 3; i++) {
    v += amp * smoothNoise(x * freq, y * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return v;
}

/**
 * Light-Theme Halftone World Map Stage (matches the attached reference image
 * with a clean #FFFFFF background and crisp green/emerald/slate dot matrix).
 */
const LightHalftoneWorldMap: React.FC<{
  mapStrength?: number;
  opacity?: number;
}> = ({ mapStrength = 1, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const grad = ctx.createRadialGradient(
      WIDTH * 0.5,
      HEIGHT * 0.48,
      60,
      WIDTH * 0.5,
      HEIGHT * 0.5,
      WIDTH * 0.65,
    );
    grad.addColorStop(0, "rgba(132, 204, 22, 0.09)");
    grad.addColorStop(0.55, "rgba(22, 163, 74, 0.035)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const spacing = 14;
    const cols = Math.ceil(WIDTH / spacing);
    const rows = Math.ceil(HEIGHT / spacing);
    const t = frame * 0.008;

    for (let r = 0; r < rows; r++) {
      const py = r * spacing + spacing * 0.5;
      const ny = r / rows;
      const mapRowIdx = Math.min(WORLD_MAP_ROWS.length - 1, Math.floor(ny * WORLD_MAP_ROWS.length));
      const mapRow = WORLD_MAP_ROWS[mapRowIdx];

      for (let c = 0; c < cols; c++) {
        const px = c * spacing + spacing * 0.5;
        const nx = c / cols;

        const n1 = fbm(nx * 4.2 + t * 0.6, ny * 2.8 - t * 0.3);
        const mapColIdx = Math.min(mapRow.length - 1, Math.floor(nx * mapRow.length));
        const mapCell = mapRow[mapColIdx];
        const isLand = mapCell === "1" || mapCell === "2";
        const isHub = mapCell === "2";

        if (isHub && mapStrength > 0.2) {
          const pulse = 0.9 + 0.1 * Math.sin(frame * 0.06 + c * 0.4 + r * 0.3);
          const radius = 3.5 * pulse * mapStrength;
          ctx.fillStyle = `rgba(0, 38, 18, ${(0.88 * mapStrength).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (isLand && mapStrength > 0.1) {
          const wave = 0.85 + 0.25 * n1;
          const radius = Math.min(3.3, 2.75 * wave * mapStrength);
          ctx.fillStyle = `rgba(101, 179, 17, ${(0.68 * mapStrength).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          if (n1 > 0.36) {
            const radius = 1.1 + (n1 - 0.36) * 1.4;
            const alpha = Math.min(0.22, (n1 - 0.36) * 0.38);
            ctx.fillStyle = `rgba(148, 163, 184, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }, [frame, mapStrength]);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      style={{
        position: "absolute",
        inset: 0,
        width: WIDTH,
        height: HEIGHT,
        opacity,
      }}
    />
  );
};

/**
 * Light-Theme Waitlyze World-Map Hero / End Card (exact layout of the attached reference image,
 * adapted to a clean white #FFFFFF light theme).
 */
const LightWorldMapBrandCard: React.FC<{
  localFrame: number;
  opacity?: number;
}> = ({ localFrame, opacity = 1 }) => {
  const bar1 = easeRange(localFrame, 4, 34, 0, 1, travelEasing);
  const bar2 = easeRange(localFrame, 12, 42, 0, 1, travelEasing);
  const bar3 = easeRange(localFrame, 20, 50, 0, 1, travelEasing);

  const wordState = typeAndReplace(localFrame, {
    initialText: "",
    commonPrefix: "",
    finalText: "waitlyze",
    backspaceStart: 18,
    backspaceEnd: 19,
    typeStart: 20,
    typeEnd: 74,
  });

  const dotAppear = easeRange(localFrame, 72, 92, 0, 1, travelEasing);
  const taglineAppear = easeRange(localFrame, 82, 118, 0, 1, travelEasing);
  const urlAppear = easeRange(localFrame, 102, 138, 0, 1, travelEasing);

  const tiltX = Math.sin(localFrame * 0.03) * 1.8;
  const tiltY = Math.cos(localFrame * 0.024) * 2.2;

  return (
    <AbsoluteFill style={{ opacity }}>
      <LightHalftoneWorldMap mapStrength={1} opacity={1} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(420px 210px at 50% 50%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.68) 58%, rgba(255,255,255,0) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          perspective: "1800px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`,
          }}
        >
          {/* Center Wordmark: /// waitlyze. */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontFamily: "var(--wl-font-display), sans-serif",
              fontSize: 86,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              color: "#00160A",
              lineHeight: 1,
            }}
          >
            <span
              style={{
                marginRight: 22,
                display: "inline-flex",
                height: 76,
                transform: "skewX(-12deg)",
                alignItems: "flex-end",
                gap: 7,
              }}
            >
              <i
                style={{
                  display: "block",
                  height: 44 * bar1,
                  width: 11,
                  borderRadius: 4,
                  backgroundColor: "#84CC16",
                  boxShadow: "0 4px 16px rgba(132, 204, 22, 0.35)",
                }}
              />
              <i
                style={{
                  display: "block",
                  height: 68 * bar2,
                  width: 11,
                  borderRadius: 4,
                  backgroundColor: "#84CC16",
                  boxShadow: "0 4px 16px rgba(132, 204, 22, 0.35)",
                }}
              />
              <i
                style={{
                  display: "block",
                  height: 56 * bar3,
                  width: 11,
                  borderRadius: 4,
                  backgroundColor: "#84CC16",
                  boxShadow: "0 4px 16px rgba(132, 204, 22, 0.35)",
                }}
              />
            </span>

            <span>{wordState.text}</span>
            {wordState.isTyping && (
              <span
                style={{
                  display: "inline-block",
                  width: 4,
                  height: 68,
                  backgroundColor: "#65A30D",
                  marginLeft: 6,
                }}
              />
            )}
            <span
              style={{
                color: "#65A30D",
                opacity: dotAppear,
                transform: `scale(${0.5 + 0.5 * dotAppear})`,
                display: "inline-block",
              }}
            >
              .
            </span>
          </div>

          <div
            style={{
              marginTop: 22,
              fontFamily: "var(--wl-font-sans), sans-serif",
              fontSize: 23,
              fontWeight: 500,
              color: "#1E293B",
              letterSpacing: "-0.01em",
              opacity: taglineAppear,
              transform: `translate3d(0, ${(1 - taglineAppear) * 10}px, 0)`,
            }}
          >
            Your launch starts before launch day.
          </div>

          <div
            style={{
              marginTop: 26,
              padding: "9px 24px",
              borderRadius: 999,
              backgroundColor: "rgba(247, 254, 231, 0.96)",
              border: "1.5px solid rgba(101, 163, 13, 0.55)",
              fontFamily: "'Paper Mono', monospace",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#1A2E05",
              opacity: urlAppear,
              transform: `translate3d(0, ${(1 - urlAppear) * 10}px, 0)`,
              boxShadow: "0 10px 28px rgba(101, 163, 13, 0.14)",
            }}
          >
            waitlyze.com
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

interface SubClip {
  image: string;
  relStart: number;
  relEnd: number;
  cursorFrom: [number, number];
  cursorTo: [number, number];
  camFrom: {
    zoom: number;
    focusX: number;
    focusY: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
  };
  camTo: {
    zoom: number;
    focusX: number;
    focusY: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
  };
}

/**
 * 3D Camera poses calibrated around zoom 0.99..1.03 and focusY 530..548
 * so the top navigation bar and full product layout stay 100% visible inside 1920x1080
 * while delivering smooth 3D perspective motion.
 */
const SCENE_CLIPS: Record<string, SubClip[]> = {
  "02_dashboard": [
    {
      image: "01_waitlists_dashboard.png",
      relStart: 0,
      relEnd: 1,
      cursorFrom: [28, 18],
      cursorTo: [42, 74],
      camFrom: {
        zoom: 0.99,
        focusX: 960,
        focusY: 530,
        rotateX: 3.4,
        rotateY: -4.2,
        rotateZ: 0.4,
      },
      camTo: {
        zoom: 1.025,
        focusX: 950,
        focusY: 540,
        rotateX: 1.6,
        rotateY: 2.0,
        rotateZ: -0.2,
      },
    },
  ],
  "03_builder": [
    {
      image: "02_builder_blocks.png",
      relStart: 0,
      relEnd: 0.35,
      cursorFrom: [22, 42],
      cursorTo: [50, 48],
      camFrom: {
        zoom: 1.0,
        focusX: 945,
        focusY: 532,
        rotateX: 2.8,
        rotateY: -3.4,
        rotateZ: 0.3,
      },
      camTo: {
        zoom: 1.025,
        focusX: 955,
        focusY: 538,
        rotateX: 1.5,
        rotateY: -1.2,
        rotateZ: 0.1,
      },
    },
    {
      image: "03_builder_design.png",
      relStart: 0.35,
      relEnd: 0.7,
      cursorFrom: [25, 34],
      cursorTo: [78, 42],
      camFrom: {
        zoom: 1.01,
        focusX: 965,
        focusY: 535,
        rotateX: 1.8,
        rotateY: 2.8,
        rotateZ: -0.2,
      },
      camTo: {
        zoom: 1.03,
        focusX: 975,
        focusY: 540,
        rotateX: 1.2,
        rotateY: 1.4,
        rotateZ: -0.1,
      },
    },
    {
      image: "04_builder_mobile.png",
      relStart: 0.7,
      relEnd: 1,
      cursorFrom: [66, 29],
      cursorTo: [52, 56],
      camFrom: {
        zoom: 1.02,
        focusX: 960,
        focusY: 538,
        rotateX: 2.2,
        rotateY: -2.2,
        rotateZ: 0.2,
      },
      camTo: {
        zoom: 1.0,
        focusX: 960,
        focusY: 535,
        rotateX: 1.0,
        rotateY: 0,
        rotateZ: 0,
      },
    },
  ],
  "04_rewards": [
    {
      image: "05_builder_after_signup.png",
      relStart: 0,
      relEnd: 0.52,
      cursorFrom: [25, 20],
      cursorTo: [58, 68],
      camFrom: {
        zoom: 1.0,
        focusX: 950,
        focusY: 532,
        rotateX: 2.8,
        rotateY: -3.2,
        rotateZ: 0.3,
      },
      camTo: {
        zoom: 1.03,
        focusX: 968,
        focusY: 540,
        rotateX: 1.4,
        rotateY: 1.8,
        rotateZ: -0.2,
      },
    },
    {
      image: "09_public_page_rewards.png",
      relStart: 0.52,
      relEnd: 1,
      cursorFrom: [34, 66],
      cursorTo: [66, 72],
      camFrom: {
        zoom: 1.01,
        focusX: 960,
        focusY: 538,
        rotateX: 2.4,
        rotateY: 2.6,
        rotateZ: -0.2,
      },
      camTo: {
        zoom: 1.03,
        focusX: 960,
        focusY: 545,
        rotateX: 1.2,
        rotateY: -1.4,
        rotateZ: 0.1,
      },
    },
  ],
  "05_publish": [
    {
      image: "06_builder_publish_share.png",
      relStart: 0,
      relEnd: 0.34,
      cursorFrom: [32, 20],
      cursorTo: [54, 44],
      camFrom: {
        zoom: 1.0,
        focusX: 955,
        focusY: 530,
        rotateX: 2.4,
        rotateY: -2.8,
        rotateZ: 0.2,
      },
      camTo: {
        zoom: 1.025,
        focusX: 965,
        focusY: 535,
        rotateX: 1.4,
        rotateY: -1.0,
        rotateZ: 0.1,
      },
    },
    {
      image: "18_settings_domain.png",
      relStart: 0.34,
      relEnd: 0.68,
      cursorFrom: [23, 24],
      cursorTo: [56, 38],
      camFrom: {
        zoom: 1.01,
        focusX: 960,
        focusY: 530,
        rotateX: 2.0,
        rotateY: 2.6,
        rotateZ: -0.2,
      },
      camTo: {
        zoom: 1.03,
        focusX: 970,
        focusY: 532,
        rotateX: 1.2,
        rotateY: 1.0,
        rotateZ: 0,
      },
    },
    {
      image: "07_builder_embed_code.png",
      relStart: 0.68,
      relEnd: 1,
      cursorFrom: [25, 39],
      cursorTo: [60, 54],
      camFrom: {
        zoom: 1.02,
        focusX: 965,
        focusY: 538,
        rotateX: 1.8,
        rotateY: -2.0,
        rotateZ: 0.1,
      },
      camTo: {
        zoom: 1.0,
        focusX: 960,
        focusY: 535,
        rotateX: 1.0,
        rotateY: 0,
        rotateZ: 0,
      },
    },
  ],
  "06_subscribers": [
    {
      image: "10_subscribers_crm.png",
      relStart: 0,
      relEnd: 0.5,
      cursorFrom: [68, 14],
      cursorTo: [48, 56],
      camFrom: {
        zoom: 1.0,
        focusX: 955,
        focusY: 532,
        rotateX: 2.6,
        rotateY: -3.0,
        rotateZ: 0.2,
      },
      camTo: {
        zoom: 1.025,
        focusX: 960,
        focusY: 540,
        rotateX: 1.4,
        rotateY: -1.0,
        rotateZ: 0.1,
      },
    },
    {
      image: "11_subscribers_fraud_review.png",
      relStart: 0.5,
      relEnd: 1,
      cursorFrom: [78, 30],
      cursorTo: [92, 52],
      camFrom: {
        zoom: 1.0,
        focusX: 970,
        focusY: 530,
        rotateX: 2.0,
        rotateY: 3.0,
        rotateZ: -0.2,
      },
      camTo: {
        zoom: 1.025,
        focusX: 985,
        focusY: 530,
        rotateX: 1.2,
        rotateY: 1.6,
        rotateZ: -0.1,
      },
    },
  ],
  "07_analytics": [
    {
      image: "12_analytics_overview.png",
      relStart: 0,
      relEnd: 0.36,
      cursorFrom: [76, 14],
      cursorTo: [52, 60],
      camFrom: {
        zoom: 1.0,
        focusX: 960,
        focusY: 530,
        rotateX: 2.8,
        rotateY: -2.8,
        rotateZ: 0.2,
      },
      camTo: {
        zoom: 1.025,
        focusX: 960,
        focusY: 538,
        rotateX: 1.4,
        rotateY: -1.0,
        rotateZ: 0,
      },
    },
    {
      image: "13_analytics_map_channels.png",
      relStart: 0.36,
      relEnd: 0.7,
      cursorFrom: [32, 34],
      cursorTo: [64, 56],
      camFrom: {
        zoom: 1.01,
        focusX: 960,
        focusY: 532,
        rotateX: 2.0,
        rotateY: 2.6,
        rotateZ: -0.2,
      },
      camTo: {
        zoom: 1.03,
        focusX: 968,
        focusY: 536,
        rotateX: 1.2,
        rotateY: 1.2,
        rotateZ: -0.1,
      },
    },
    {
      image: "14_analytics_referrals_email.png",
      relStart: 0.7,
      relEnd: 1,
      cursorFrom: [35, 38],
      cursorTo: [65, 48],
      camFrom: {
        zoom: 1.02,
        focusX: 960,
        focusY: 532,
        rotateX: 1.8,
        rotateY: -2.0,
        rotateZ: 0.1,
      },
      camTo: {
        zoom: 1.0,
        focusX: 960,
        focusY: 535,
        rotateX: 1.0,
        rotateY: 0,
        rotateZ: 0,
      },
    },
  ],
  "08_emails": [
    {
      image: "15_emails_automations.png",
      relStart: 0,
      relEnd: 0.36,
      cursorFrom: [73, 14],
      cursorTo: [56, 52],
      camFrom: {
        zoom: 1.0,
        focusX: 955,
        focusY: 532,
        rotateX: 2.6,
        rotateY: -2.8,
        rotateZ: 0.2,
      },
      camTo: {
        zoom: 1.025,
        focusX: 965,
        focusY: 538,
        rotateX: 1.4,
        rotateY: -1.0,
        rotateZ: 0.1,
      },
    },
    {
      image: "16_emails_broadcasts.png",
      relStart: 0.36,
      relEnd: 0.68,
      cursorFrom: [23, 24],
      cursorTo: [55, 60],
      camFrom: {
        zoom: 1.01,
        focusX: 965,
        focusY: 536,
        rotateX: 1.8,
        rotateY: 2.4,
        rotateZ: -0.2,
      },
      camTo: {
        zoom: 1.03,
        focusX: 970,
        focusY: 540,
        rotateX: 1.2,
        rotateY: 1.0,
        rotateZ: 0,
      },
    },
    {
      image: "17_emails_logs.png",
      relStart: 0.68,
      relEnd: 1,
      cursorFrom: [23, 29],
      cursorTo: [56, 54],
      camFrom: {
        zoom: 1.02,
        focusX: 965,
        focusY: 535,
        rotateX: 1.8,
        rotateY: -1.8,
        rotateZ: 0.1,
      },
      camTo: {
        zoom: 1.0,
        focusX: 960,
        focusY: 535,
        rotateX: 1.0,
        rotateY: 0,
        rotateZ: 0,
      },
    },
  ],
  "09_developers": [
    {
      image: "19_settings_webhooks.png",
      relStart: 0,
      relEnd: 0.27,
      cursorFrom: [23, 29],
      cursorTo: [58, 42],
      camFrom: {
        zoom: 1.0,
        focusX: 960,
        focusY: 530,
        rotateX: 2.4,
        rotateY: -2.6,
        rotateZ: 0.2,
      },
      camTo: {
        zoom: 1.025,
        focusX: 968,
        focusY: 532,
        rotateX: 1.4,
        rotateY: -1.0,
        rotateZ: 0,
      },
    },
    {
      image: "20_settings_notifications.png",
      relStart: 0.27,
      relEnd: 0.52,
      cursorFrom: [23, 34],
      cursorTo: [56, 50],
      camFrom: {
        zoom: 1.01,
        focusX: 965,
        focusY: 532,
        rotateX: 1.8,
        rotateY: 2.4,
        rotateZ: -0.2,
      },
      camTo: {
        zoom: 1.03,
        focusX: 970,
        focusY: 535,
        rotateX: 1.2,
        rotateY: 1.0,
        rotateZ: 0,
      },
    },
    {
      image: "21_workspace_api_keys.png",
      relStart: 0.52,
      relEnd: 0.76,
      cursorFrom: [23, 34],
      cursorTo: [58, 62],
      camFrom: {
        zoom: 1.01,
        focusX: 965,
        focusY: 536,
        rotateX: 1.8,
        rotateY: -2.2,
        rotateZ: 0.2,
      },
      camTo: {
        zoom: 1.03,
        focusX: 972,
        focusY: 540,
        rotateX: 1.2,
        rotateY: -1.0,
        rotateZ: 0,
      },
    },
    {
      image: "22_workspace_audit_log.png",
      relStart: 0.76,
      relEnd: 1,
      cursorFrom: [23, 39],
      cursorTo: [56, 55],
      camFrom: {
        zoom: 1.02,
        focusX: 968,
        focusY: 538,
        rotateX: 1.6,
        rotateY: 1.8,
        rotateZ: -0.1,
      },
      camTo: {
        zoom: 0.99,
        focusX: 960,
        focusY: 532,
        rotateX: 3.0,
        rotateY: -3.0,
        rotateZ: 0.2,
      },
    },
  ],
};

/**
 * Full-Screen 3D Product Surface with zero borders, zero top bars, and zero green highlight boxes.
 */
const FullScreen3DProductStage: React.FC<{
  image: string;
  subProgress: number;
  cursorFrom: [number, number];
  cursorTo: [number, number];
  camFrom: SubClip["camFrom"];
  camTo: SubClip["camTo"];
}> = ({ image, subProgress, cursorFrom, cursorTo, camFrom, camTo }) => {
  const frame = useCurrentFrame();

  const easedCam =
    subProgress < 0.5
      ? 4 * subProgress * subProgress * subProgress
      : 1 - Math.pow(-2 * subProgress + 2, 3) / 2;

  const lerp = (a: number, b: number) => a + (b - a) * easedCam;

  const zoom = lerp(camFrom.zoom, camTo.zoom);
  const focusX = lerp(camFrom.focusX, camTo.focusX);
  const focusY = lerp(camFrom.focusY, camTo.focusY);
  const rotateX = lerp(camFrom.rotateX, camTo.rotateX);
  const rotateY = lerp(camFrom.rotateY, camTo.rotateY) + Math.cos(frame * 0.025) * 0.35;
  const rotateZ = lerp(camFrom.rotateZ, camTo.rotateZ);

  const tx = WIDTH * 0.5 - focusX;
  const ty = HEIGHT * 0.5 - focusY + Math.sin(frame * 0.035) * 2.0;

  const cursorMove = interpolate(subProgress, [0.06, 0.72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const easedCursor = 1 - Math.pow(1 - cursorMove, 3);
  const cursorX = cursorFrom[0] + (cursorTo[0] - cursorFrom[0]) * easedCursor;
  const cursorY = cursorFrom[1] + (cursorTo[1] - cursorFrom[1]) * easedCursor;

  const clickPulse = interpolate(subProgress, [0.68, 0.76, 0.88], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FFFFFF",
        perspective: "2400px",
        overflow: "hidden",
      }}
    >
      <LightHalftoneWorldMap mapStrength={0.35} opacity={0.4} />

      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `scale(${zoom.toFixed(4)}) rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg) rotateZ(${rotateZ.toFixed(3)}deg) translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 35px 90px rgba(0, 22, 10, 0.09)",
        }}
      >
        <Img
          src={staticFile(`captures/${image}`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: "#FFFFFF",
            display: "block",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: `${cursorX}%`,
            top: `${cursorY}%`,
            transform: `translate(-4px, -4px) scale(${1 - clickPulse * 0.14})`,
            pointerEvents: "none",
            zIndex: 15,
          }}
        >
          {clickPulse > 0.05 && (
            <div
              style={{
                position: "absolute",
                left: -16,
                top: -16,
                width: 40,
                height: 40,
                borderRadius: 999,
                border: "2px solid rgba(22, 163, 74, 0.65)",
                background: "rgba(132, 204, 22, 0.18)",
                transform: `scale(${0.6 + clickPulse * 0.85})`,
                opacity: 1 - clickPulse * 0.75,
              }}
            />
          )}
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            style={{
              filter: "drop-shadow(0 6px 14px rgba(0, 22, 10, 0.28))",
            }}
          >
            <path
              d="M5.5 3.5L23 13.2L14.2 15.6L10.8 24L5.5 3.5Z"
              fill="#00160A"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const IntroSequence: React.FC<{ localSec: number; totalSec: number }> = ({
  localSec,
  totalSec,
}) => {
  const { fps } = useVideoConfig();
  const localFrame = Math.round(localSec * fps);

  if (localSec < 4.35) {
    return <LightWorldMapBrandCard localFrame={localFrame} opacity={1} />;
  }

  const subProgress = interpolate(localSec, [4.35, totalSec], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const crossfade = interpolate(localSec, [4.35, 4.85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      {crossfade < 1 && <LightWorldMapBrandCard localFrame={localFrame} opacity={1 - crossfade} />}
      <div style={{ position: "absolute", inset: 0, opacity: crossfade }}>
        <FullScreen3DProductStage
          image="08_public_page_hero.png"
          subProgress={subProgress}
          cursorFrom={[62, 52]}
          cursorTo={[72, 48]}
          camFrom={{
            zoom: 0.99,
            focusX: 960,
            focusY: 530,
            rotateX: 4.5,
            rotateY: -5.0,
            rotateZ: 0.6,
          }}
          camTo={{
            zoom: 1.03,
            focusX: 965,
            focusY: 538,
            rotateX: 1.6,
            rotateY: 1.2,
            rotateZ: -0.1,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/**
 * Plain In-Built Captions (no background box, no Waitlyze/chapter badge,
 * single-line 8-word phrase window with soft bottom feather for 100% legibility).
 */
const PlainCaptionsOverlay: React.FC<{ currentSec: number }> = ({ currentSec }) => {
  const activeSeg =
    voManifest.segments.find((s) => currentSec >= s.sceneStart && currentSec <= s.sceneEnd) ||
    voManifest.segments[voManifest.segments.length - 1];

  const rawTokens = activeSeg.text.split(/\s+/);
  let ptr = 0;
  const alignedTokens = rawTokens.map((tok) => {
    const isPurePunct = /^[^\w]+$/.test(tok);
    const w = isPurePunct
      ? activeSeg.words[Math.max(0, ptr - 1)]
      : activeSeg.words[Math.min(ptr++, activeSeg.words.length - 1)];
    return {
      tok,
      start: w ? w.start : activeSeg.voStart,
      end: w ? w.end : activeSeg.voEnd,
    };
  });

  // Group into clean single-line chunks of up to 8 tokens so captions never wrap into 2 cluttered lines
  const CHUNK_SIZE = 8;
  const chunks: Array<typeof alignedTokens> = [];
  for (let i = 0; i < alignedTokens.length; i += CHUNK_SIZE) {
    chunks.push(alignedTokens.slice(i, i + CHUNK_SIZE));
  }

  const activeChunk =
    chunks.find((ch, idx) => {
      const nextChunk = chunks[idx + 1];
      const endBound = nextChunk ? nextChunk[0].start : activeSeg.sceneEnd + 1;
      return currentSec < endBound;
    }) || chunks[chunks.length - 1];

  return (
    <>
      {/* Subtle seamless white bottom feather (not a box/pill) so bottom captions never clash with scrolling content */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 86,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.86) 52%, rgba(255,255,255,0.97) 100%)",
          pointerEvents: "none",
          zIndex: 45,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 22,
          left: 80,
          right: 80,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "nowrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "0 9px",
            textAlign: "center",
          }}
        >
          {activeChunk.map((item, idx) => {
            const isSpoken = currentSec >= item.start;
            const isCurrent = currentSec >= item.start - 0.04 && currentSec <= item.end + 0.14;

            return (
              <span
                key={idx}
                style={{
                  fontFamily: "var(--wl-font-display), system-ui, sans-serif",
                  fontSize: 25,
                  fontWeight: isCurrent ? 800 : 700,
                  letterSpacing: "-0.02em",
                  color: isCurrent ? "#15803D" : isSpoken ? "#00160A" : "#64748B",
                  WebkitTextStroke: "5px rgba(255, 255, 255, 0.98)",
                  paintOrder: "stroke fill",
                  textShadow: "0 2px 10px rgba(255, 255, 255, 0.95)",
                }}
              >
                {item.tok}
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
};

export const WaitlyzeLaunch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  const segIndex = voManifest.segments.findIndex(
    (s) => currentSec >= s.sceneStart && currentSec < s.sceneEnd,
  );
  const resolvedIndex = segIndex === -1 ? voManifest.segments.length - 1 : segIndex;
  const activeSeg = voManifest.segments[resolvedIndex];

  const localSec = Math.max(0, currentSec - activeSeg.sceneStart);
  const totalSec = Math.max(0.1, activeSeg.sceneEnd - activeSeg.sceneStart);
  const clipProgress = Math.min(1, Math.max(0, localSec / totalSec));

  const clips = SCENE_CLIPS[activeSeg.id] || SCENE_CLIPS["02_dashboard"];
  const activeClip =
    clips.find((c) => clipProgress >= c.relStart && clipProgress <= c.relEnd) ||
    clips[clips.length - 1];

  const subProgress = interpolate(clipProgress, [activeClip.relStart, activeClip.relEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
      {activeSeg.id === "01_intro" ? (
        <IntroSequence localSec={localSec} totalSec={totalSec} />
      ) : activeSeg.id === "10_outro" ? (
        <LightWorldMapBrandCard localFrame={Math.round(localSec * fps)} opacity={1} />
      ) : (
        <FullScreen3DProductStage
          image={activeClip.image}
          subProgress={subProgress}
          cursorFrom={activeClip.cursorFrom}
          cursorTo={activeClip.cursorTo}
          camFrom={activeClip.camFrom}
          camTo={activeClip.camTo}
        />
      )}

      <PlainCaptionsOverlay currentSec={currentSec} />
    </AbsoluteFill>
  );
};
