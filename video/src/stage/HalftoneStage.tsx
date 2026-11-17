import React, { useEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";

import { easeRange, travelEasing } from "../motion/easing";
import { BREAKDOWN_START, CHAPTERS, DROP_FRAME, HEIGHT, WIDTH } from "../timeline";

// Compact 36x18 continent bitmap (1 = land, 2 = major tech hub city)
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

// Deterministic hash for 2D value noise
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

function getStageProgress(frame: number): { limeProgress: number; mapMorph: number } {
  for (let i = 0; i < CHAPTERS.length; i++) {
    const ch = CHAPTERS[i];
    const prevLime = i > 0 ? CHAPTERS[i - 1].limeProgress : 0.04;
    const prevMap = i > 0 ? CHAPTERS[i - 1].mapMorph : 0;
    if (frame >= ch.startFrame && frame <= ch.endFrame) {
      return {
        limeProgress: easeRange(
          frame,
          ch.startFrame,
          Math.min(ch.endFrame, ch.startFrame + 90),
          prevLime,
          ch.limeProgress,
          travelEasing,
        ),
        mapMorph: easeRange(
          frame,
          ch.startFrame,
          Math.min(ch.endFrame, ch.startFrame + 90),
          prevMap,
          ch.mapMorph,
          travelEasing,
        ),
      };
    }
  }
  return { limeProgress: 1, mapMorph: 0.9 };
}

export const HalftoneStage: React.FC = () => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { limeProgress, mapMorph } = getStageProgress(frame);

  // Publish ripple around frame 1410 (when Publish button is clicked)
  const publishPulse =
    frame >= 1400 && frame <= 1560 ? easeRange(frame, 1400, 1540, 0, 1, travelEasing) : -1;

  // Bass drop flash at frame 3577 (59.61s)
  const dropFlash =
    frame >= DROP_FRAME && frame <= DROP_FRAME + 90
      ? 1 - easeRange(frame, DROP_FRAME, DROP_FRAME + 90, 0, 1)
      : 0;

  // Quiet breakdown dimming (frames 3314..3576)
  const breakdownHush =
    frame >= BREAKDOWN_START && frame < DROP_FRAME
      ? easeRange(frame, BREAKDOWN_START, BREAKDOWN_START + 50, 0, 0.35)
      : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Obsidian-emerald background base
    ctx.fillStyle = "#020906";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle radial ambient glow
    const grad = ctx.createRadialGradient(
      WIDTH * 0.5,
      HEIGHT * 0.36,
      80,
      WIDTH * 0.5,
      HEIGHT * 0.5,
      WIDTH * 0.72,
    );
    const glowAlpha = (0.14 + 0.14 * limeProgress + 0.2 * dropFlash) * (1 - breakdownHush * 0.5);
    grad.addColorStop(0, `rgba(140, 235, 36, ${glowAlpha.toFixed(3)})`);
    grad.addColorStop(0.55, `rgba(18, 72, 42, ${(glowAlpha * 0.55).toFixed(3)})`);
    grad.addColorStop(1, "rgba(2, 9, 6, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const spacing = 14;
    const cols = Math.ceil(WIDTH / spacing);
    const rows = Math.ceil(HEIGHT / spacing);
    const t = frame * 0.008;

    for (let r = 0; r < rows; r++) {
      const py = r * spacing + spacing * 0.5;
      const ny = r / rows;
      // Map lookup
      const mapRowIdx = Math.min(WORLD_MAP_ROWS.length - 1, Math.floor(ny * WORLD_MAP_ROWS.length));
      const mapRow = WORLD_MAP_ROWS[mapRowIdx];

      for (let c = 0; c < cols; c++) {
        const px = c * spacing + spacing * 0.5;
        const nx = c / cols;

        const n1 = fbm(nx * 4.2 + t * 0.7, ny * 2.8 - t * 0.35);
        const n2 = fbm(nx * 8.5 - t * 0.4, ny * 6.2 + t * 0.5);
        // Stronger nebula band across upper-middle like the reference video
        const band = Math.exp(-Math.pow((ny - 0.32 + (n1 - 0.5) * 0.28) / 0.28, 2));
        let intensity = Math.max(0, (n1 * 0.72 + n2 * 0.28) * (0.45 + 0.75 * band) - 0.18);

        // World map contribution
        const mapColIdx = Math.min(mapRow.length - 1, Math.floor(nx * mapRow.length));
        const mapCell = mapRow[mapColIdx];
        const isLand = mapCell === "1" || mapCell === "2";
        const isHub = mapCell === "2";

        if (mapMorph > 0.01) {
          const landBoost = isHub ? 1.15 : isLand ? 0.78 : 0.12;
          intensity = intensity * (1 - mapMorph * 0.75) + landBoost * mapMorph;
        }

        // Publish ripple wave
        let ripple = 0;
        if (publishPulse >= 0) {
          const dist = Math.hypot(nx - 0.68, ny - 0.28);
          const ring = Math.abs(dist - publishPulse * 0.95);
          if (ring < 0.08) {
            ripple = (1 - ring / 0.08) * (1 - publishPulse);
          }
        }

        const total = Math.min(1.25, intensity + ripple * 0.65 + (isHub ? dropFlash * 0.6 : 0));
        if (total < 0.08) continue;

        const radius = Math.min(spacing * 0.42, (0.9 + total * 2.65) * (1 - breakdownHush * 0.25));

        // Color blend: cool emerald-slate -> electric Waitlyze lime (#BAFE2A) -> hot white-lime core
        const limeMix = Math.min(
          1,
          Math.max(0, (total - 0.25) * 1.1 + limeProgress * 0.72 + ripple * 0.8 + dropFlash * 0.5),
        );

        let cr: number;
        let cg: number;
        let cb: number;
        if (total > 0.88 && limeProgress > 0.35) {
          // Bright lime-white core highlights
          cr = 224;
          cg = 255;
          cb = 168;
        } else {
          // Interpolate from deep emerald-cyan (34, 118, 92) to Waitlyze lime (186, 254, 42)
          cr = Math.round(34 + (186 - 34) * limeMix);
          cg = Math.round(118 + (254 - 118) * limeMix);
          cb = Math.round(92 + (42 - 92) * limeMix);
        }

        const alpha = Math.min(
          0.92,
          Math.max(0.08, total * 0.78 * (1 - breakdownHush * 0.35) + dropFlash * 0.22),
        );

        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Sparse crisp star specks on top (identical craft detail to reference video)
    for (let s = 0; s < 48; s++) {
      const sx = hash2(s, 11) * WIDTH;
      const sy = hash2(s, 29) * HEIGHT;
      const twinkle = 0.35 + 0.65 * Math.sin(frame * 0.05 + s * 2.1);
      const r = 0.8 + hash2(s, 47) * 1.1;
      ctx.fillStyle =
        s % 3 === 0
          ? `rgba(186, 254, 42, ${(0.45 * twinkle).toFixed(3)})`
          : `rgba(235, 248, 240, ${(0.38 * twinkle).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [frame, limeProgress, mapMorph, publishPulse, dropFlash, breakdownHush]);

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
      }}
    />
  );
};
