import React from "react";
import { useCurrentFrame } from "remotion";

import { easeRange, travelEasing } from "../motion/easing";
import { CAMERA_KEYFRAMES, CHAPTERS, HEIGHT, WIDTH, WINDOW_H, WINDOW_W } from "../timeline";

function interpolateCamera(frame: number) {
  const kf = CAMERA_KEYFRAMES;
  if (frame <= kf[0].frame) return kf[0];
  if (frame >= kf[kf.length - 1].frame) return kf[kf.length - 1];

  for (let i = 0; i < kf.length - 1; i++) {
    const a = kf[i];
    const b = kf[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const t = easeRange(frame, a.frame, b.frame, 0, 1, travelEasing);
      const lerp = (x: number, y: number) => x + (y - x) * t;
      return {
        frame,
        focusX: lerp(a.focusX, b.focusX),
        focusY: lerp(a.focusY, b.focusY),
        zoom: lerp(a.zoom, b.zoom),
        rotateX: lerp(a.rotateX, b.rotateX),
        rotateY: lerp(a.rotateY, b.rotateY),
        rotateZ: lerp(a.rotateZ, b.rotateZ),
        dofRect: [
          lerp(a.dofRect[0], b.dofRect[0]),
          lerp(a.dofRect[1], b.dofRect[1]),
          lerp(a.dofRect[2], b.dofRect[2]),
          lerp(a.dofRect[3], b.dofRect[3]),
        ] as [number, number, number, number],
        dofBlur: lerp(a.dofBlur, b.dofBlur),
      };
    }
  }
  return kf[kf.length - 1];
}

interface StageCameraProps {
  children: React.ReactNode;
}

/**
 * 3D Perspective Camera + Optical Depth-of-Field wrapper.
 * When `dofBlur > 0.3`, renders a blurred/dimmed peripheral copy underneath
 * and a crisp copy clipped via a feathered radial/box mask around `dofRect`.
 */
export const StageCamera: React.FC<StageCameraProps> = ({ children }) => {
  const frame = useCurrentFrame();
  const cam = interpolateCamera(frame);

  // Subtle floating idle motion when viewing wide
  const floatY = Math.sin(frame * 0.035) * (cam.zoom < 1.15 ? 4 : 1.2);
  const floatRotY = Math.cos(frame * 0.025) * (cam.zoom < 1.15 ? 0.55 : 0.15);

  // Fade in from black during first 55 frames, and recede out at frame 3810..3900
  const introOpacity = easeRange(frame, 4, 64, 0, 1, travelEasing);
  const outroOpacity = 1 - easeRange(frame, 3810, 3895, 0, 1, travelEasing);
  const windowOpacity = introOpacity * outroOpacity;

  if (windowOpacity <= 0.005) return null;

  // Translate window so (focusX, focusY) sits at the center of the 1920x1080 stage
  const tx = WINDOW_W * 0.5 - cam.focusX;
  const ty = WINDOW_H * 0.5 - cam.focusY + floatY;

  const [rx, ry, rw, rh] = cam.dofRect;
  const cx = ((rx + rw * 0.5) / WINDOW_W) * 100;
  const cy = ((ry + rh * 0.5) / WINDOW_H) * 100;
  const rxPct = Math.max(30, (rw / WINDOW_W) * 76);
  const ryPct = Math.max(30, (rh / WINDOW_H) * 76);

  const hasDof = cam.dofBlur > 0.35;
  const maskGradient = `radial-gradient(ellipse ${rxPct.toFixed(1)}% ${ryPct.toFixed(1)}% at ${cx.toFixed(1)}% ${cy.toFixed(1)}%, rgba(0,0,0,1) 66%, rgba(0,0,0,0) 100%)`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "2400px",
        opacity: windowOpacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: WINDOW_W,
          height: WINDOW_H,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `scale(${cam.zoom.toFixed(4)}) rotateX(${cam.rotateX.toFixed(3)}deg) rotateY(${(cam.rotateY + floatRotY).toFixed(3)}deg) rotateZ(${cam.rotateZ.toFixed(3)}deg) translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`,
        }}
      >
        {hasDof ? (
          <>
            {/* Blurred peripheral base copy */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                filter: `blur(${cam.dofBlur.toFixed(2)}px) brightness(${(1 - Math.min(0.18, cam.dofBlur * 0.025)).toFixed(3)})`,
              }}
            >
              {children}
            </div>
            {/* Razor-sharp focal region */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                WebkitMaskImage: maskGradient,
                maskImage: maskGradient,
              }}
            >
              {children}
            </div>
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0 }}>{children}</div>
        )}
      </div>
    </div>
  );
};

/**
 * Bottom-left editorial chapter marker (`— LABEL`), matching the reference video's
 * minimalist chapter callouts, set in Paper Mono with Waitlyze electric lime.
 */
export const ChapterLabel: React.FC = () => {
  const frame = useCurrentFrame();

  const active = CHAPTERS.find(
    (c) => frame >= c.startFrame && frame < c.endFrame && c.label !== null,
  );
  if (!active || !active.label) return null;

  const enter = easeRange(frame, active.startFrame, active.startFrame + 24, 0, 1, travelEasing);
  const exit = 1 - easeRange(frame, active.endFrame - 20, active.endFrame, 0, 1, travelEasing);
  const opacity = enter * exit;
  const slideX = (1 - enter) * -14;

  return (
    <div
      style={{
        position: "absolute",
        left: 52,
        bottom: 44,
        display: "inline-flex",
        alignItems: "center",
        gap: 11,
        padding: "7px 14px 7px 12px",
        borderRadius: 999,
        backgroundColor: "rgba(2, 9, 6, 0.78)",
        border: "1px solid rgba(186, 254, 42, 0.28)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
        opacity,
        transform: `translate3d(${slideX.toFixed(1)}px, 0, 0)`,
        zIndex: 30,
      }}
    >
      <span
        style={{
          width: 18,
          height: 1.5,
          backgroundColor: "#BAFE2A",
          boxShadow: "0 0 10px rgba(186, 254, 42, 0.6)",
          display: "inline-block",
        }}
      />
      <span
        style={{
          fontFamily: "'Paper Mono', ui-monospace, monospace",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.2em",
          color: "#BAFE2A",
          textTransform: "uppercase",
        }}
      >
        {active.label}
      </span>
    </div>
  );
};
