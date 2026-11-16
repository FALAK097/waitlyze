"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export const SCENE_W = 860;
export const TOUR_EASE = [0.22, 1, 0.36, 1];

const HeightContext = createContext(420);

function useSceneHeight() {
  return useContext(HeightContext);
}

const DEFAULT_FRAME = { x: 68, y: 100, w: 1144, h: 650 };

function Shot({ src, frame = DEFAULT_FRAME, size = [1280, 800] }) {
  const H = useSceneHeight();
  const [iw, ih] = size;
  const s = Math.max(SCENE_W / iw, H / ih, Math.min(SCENE_W / frame.w, H / frame.h));
  const clamp = (v, min) => Math.min(0, Math.max(min, v));
  const left = clamp(-frame.x * s + Math.max(0, (SCENE_W - frame.w * s) / 2), SCENE_W - iw * s);
  const top = clamp(-frame.y * s, H - ih * s);

  return (
    <div className="absolute inset-0 overflow-hidden bg-white">
      <div className="absolute" style={{ left, top, width: iw * s, height: ih * s }}>
        <img
          src={src}
          alt=""
          draggable={false}
          loading="eager"
          decoding="sync"
          className="block h-full w-full select-none"
        />
      </div>
    </div>
  );
}

const SCENE_CONFIG = {
  overview: {
    src: "/images/onboarding/01-waitlists.png",
    frame: { x: 64, y: 58, w: 1152, h: 555 },
  },
  builderHosted: {
    src: "/images/onboarding/02-builder.png",
    frame: { x: 68, y: 112, w: 1144, h: 668 },
  },
  builderAfterSignup: {
    src: "/images/onboarding/02a-after-signup.png",
    frame: { x: 68, y: 215, w: 1144, h: 585 },
  },
  builderEmbed: {
    src: "/images/onboarding/02b-embed.png",
    frame: { x: 68, y: 142, w: 1144, h: 555 },
  },
  signups: {
    src: "/images/onboarding/03-subscribers.png",
    frame: { x: 68, y: 110, w: 1144, h: 650 },
  },
  broadcasts: {
    src: "/images/onboarding/04-broadcasts.png",
    frame: { x: 68, y: 110, w: 1144, h: 650 },
  },
  automations: {
    src: "/images/onboarding/05-automations.png",
    frame: { x: 68, y: 110, w: 1144, h: 650 },
  },
  analytics: {
    src: "/images/onboarding/06-analytics.png",
    frame: { x: 68, y: 110, w: 1144, h: 668 },
  },
  webhooks: {
    src: "/images/onboarding/07-webhooks.png",
    frame: { x: 68, y: 100, w: 1144, h: 520 },
  },
  workspace: {
    src: "/images/onboarding/08-workspace.png",
    frame: { x: 68, y: 82, w: 1144, h: 520 },
  },
};

export function TourScene({ id }) {
  const scene = SCENE_CONFIG[id] ?? SCENE_CONFIG.overview;
  return <Shot src={scene.src} frame={scene.frame} />;
}

export function TourStage({ children, className }) {
  const boxRef = useRef(null);
  const [size, setSize] = useState({ k: 1, h: 420 });

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const fit = () => {
      const k = el.clientWidth / SCENE_W;
      if (k > 0) setSize({ k, h: Math.ceil(el.clientHeight / k) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-product-bg-inset select-none",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(210 4% 58% / 0.3) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
        aria-hidden="true"
      />

      <div
        ref={boxRef}
        className="absolute top-[5.5%] right-0 bottom-0 left-[3.5%] overflow-hidden rounded-tl-[12px] bg-white shadow-[0_18px_48px_-24px_rgba(0,22,13,0.18)] ring-1 ring-product-border-subtle"
      >
        <HeightContext.Provider value={size.h}>
          <div
            aria-hidden="true"
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width: SCENE_W,
              height: size.h,
              transform: `scale(${size.k})`,
            }}
          >
            {children}
          </div>
        </HeightContext.Provider>
      </div>
    </div>
  );
}
