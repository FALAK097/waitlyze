import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

import { easeRange, arrivalEasing, travelEasing } from "../motion/easing";
import { WL } from "../theme";

/**
 * Quiet editorial studio canvas with subtle organic radial light and delicate texture.
 * Never competes with product UI; matches Waitlyze's authentic calm tone.
 */
export const StudioBackdrop: React.FC<{
  tone?: "warm" | "clean" | "dark";
  children: React.ReactNode;
}> = ({ tone = "clean", children }) => {
  const bg =
    tone === "dark" ? WL.stageDark : tone === "warm" ? WL.stageWarm : WL.stageClean;

  const ambient =
    tone === "dark"
      ? "radial-gradient(1100px 680px at 50% 44%, rgba(198, 254, 30, 0.055) 0%, rgba(25, 102, 64, 0.04) 45%, rgba(13, 21, 18, 0) 100%)"
      : tone === "warm"
        ? "radial-gradient(1200px 760px at 50% 35%, rgba(255, 255, 255, 0.72) 0%, rgba(244, 243, 238, 0) 70%)"
        : "radial-gradient(1250px 780px at 50% 38%, rgba(255, 255, 255, 0.85) 0%, rgba(198, 254, 30, 0.035) 55%, rgba(245, 246, 243, 0) 100%)";

  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: ambient,
          pointerEvents: "none",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

/**
 * Exact Waitlyze Wordmark matching src/components/landing/wordmark.jsx:
 * Three -skew-x-12 bars (proportional 4:6:5, vertically centered) in #C6FE1E,
 * "waitlyze" in Manrope Bold #00160D, "." in #196640 forest green.
 */
export const WaitlyzeMark: React.FC<{
  scale?: number;
  barProgress?: [number, number, number];
  dark?: boolean;
}> = ({ scale = 1, barProgress = [1, 1, 1], dark = false }) => {
  const unit = 4 * scale;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 7 * unit,
        transform: "skewX(-12deg)",
        gap: Math.max(2, Math.round(0.65 * unit)),
      }}
    >
      {[4, 6, 5].map((hUnits, idx) => {
        const p = barProgress[idx] ?? 1;
        return (
          <i
            key={idx}
            style={{
              display: "block",
              width: Math.max(3, Math.round(1.12 * unit)),
              height: hUnits * unit * p,
              borderRadius: Math.max(2, Math.round(0.32 * unit)),
              backgroundColor: WL.lime,
              opacity: p > 0.02 ? 1 : 0,
              boxShadow: dark ? "0 0 18px rgba(198,254,30,0.22)" : "none",
            }}
          />
        );
      })}
    </span>
  );
};

export const WaitlyzeWordmark: React.FC<{
  size?: number;
  barProgress?: [number, number, number];
  wordOpacity?: number;
  dotScale?: number;
  dark?: boolean;
}> = ({
  size = 76,
  barProgress = [1, 1, 1],
  wordOpacity = 1,
  dotScale = 1,
  dark = false,
}) => {
  const markScale = size / 32;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: WL.fontDisplay,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: "-0.045em",
        lineHeight: 1,
        color: dark ? "#FFFFFF" : WL.ink,
      }}
    >
      <span style={{ marginRight: Math.round(size * 0.28), display: "inline-flex" }}>
        <WaitlyzeMark scale={markScale} barProgress={barProgress} dark={dark} />
      </span>
      <span
        style={{
          opacity: wordOpacity,
          transform: `translate3d(0, ${(1 - wordOpacity) * 10}px, 0)`,
          display: "inline-block",
        }}
      >
        waitlyze
      </span>
      <span
        style={{
          color: dark ? WL.lime : WL.forest,
          display: "inline-block",
          opacity: dotScale,
          transform: `scale(${0.4 + 0.6 * dotScale})`,
          transformOrigin: "bottom left",
        }}
      >
        .
      </span>
    </div>
  );
};

/**
 * Clean Stageshow Browser / App Window with authentic Waitlyze light chrome.
 */
export const BrowserWindow: React.FC<{
  url?: string;
  title?: string;
  width: number;
  height?: number;
  showTrafficLights?: boolean;
  dark?: boolean;
  shadow?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({
  url,
  title,
  width,
  height,
  showTrafficLights = true,
  dark = false,
  shadow = WL.shadowHero,
  style,
  children,
}) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: dark ? "#141D19" : WL.white,
        borderRadius: WL.radiusWindow,
        border: `1px solid ${dark ? WL.borderDark : WL.border}`,
        boxShadow: shadow,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {(url || title || showTrafficLights) && (
        <div
          style={{
            height: 46,
            flexShrink: 0,
            padding: "0 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: dark ? "#101815" : "#FAFBF9",
            borderBottom: `1px solid ${dark ? WL.borderDark : WL.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: 72 }}>
            {showTrafficLights && (
              <>
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 999,
                    backgroundColor: dark ? "rgba(255,255,255,0.16)" : "#DFE2E4",
                  }}
                />
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 999,
                    backgroundColor: dark ? "rgba(255,255,255,0.16)" : "#DFE2E4",
                  }}
                />
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 999,
                    backgroundColor: dark ? "rgba(255,255,255,0.16)" : "#DFE2E4",
                  }}
                />
              </>
            )}
          </div>

          {url ? (
            <div
              style={{
                padding: "5px 18px",
                borderRadius: WL.radiusPill,
                backgroundColor: dark ? "rgba(255,255,255,0.06)" : WL.white,
                border: `1px solid ${dark ? WL.borderDark : WL.border}`,
                fontFamily: WL.fontMono,
                fontSize: 13.5,
                color: dark ? "rgba(255,255,255,0.72)" : WL.textSecondary,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <LockIcon size={12} color={dark ? "rgba(255,255,255,0.5)" : WL.forest} />
              <span>{url}</span>
            </div>
          ) : title ? (
            <div
              style={{
                fontFamily: WL.fontSans,
                fontSize: 14,
                fontWeight: 600,
                color: dark ? "rgba(255,255,255,0.82)" : WL.textSecondary,
              }}
            >
              {title}
            </div>
          ) : (
            <div />
          )}

          <div style={{ width: 72 }} />
        </div>
      )}

      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</div>
    </div>
  );
};

/**
 * Waitlyze Product Header Chrome (faithful to 01_waitlists_dashboard.png & 12_analytics_overview.png)
 */
export const WaitlyzeTopNav: React.FC<{
  workspace?: string;
  activeTab?: "Builder" | "Signups" | "Emails" | "Analytics" | "Settings";
  campaignName?: string;
  showSubNav?: boolean;
}> = ({
  workspace = "Weekend Studio",
  activeTab,
  campaignName = "Weekend — Cabin & Trail Drops",
  showSubNav = true,
}) => {
  const tabs: Array<"Builder" | "Signups" | "Emails" | "Analytics" | "Settings"> = [
    "Builder",
    "Signups",
    "Emails",
    "Analytics",
    "Settings",
  ];
  return (
    <div style={{ backgroundColor: WL.white, borderBottom: `1px solid ${WL.border}` }}>
      <div
        style={{
          height: 54,
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: showSubNav ? `1px solid ${WL.border}` : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <WaitlyzeMark scale={0.78} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                backgroundColor: WL.inset,
                color: WL.ink,
                fontFamily: WL.fontDisplay,
                fontSize: 12,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              W
            </span>
            <span
              style={{
                fontFamily: WL.fontSans,
                fontSize: 14.5,
                fontWeight: 600,
                color: WL.ink,
              }}
            >
              {workspace}
            </span>
          </div>
          <span
            style={{
              fontFamily: WL.fontMono,
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 9px",
              borderRadius: WL.radiusPill,
              backgroundColor: WL.inset,
              color: WL.textSecondary,
              letterSpacing: "0.04em",
            }}
          >
            PRO
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <span
            style={{
              fontFamily: WL.fontSans,
              fontSize: 14,
              fontWeight: 600,
              color: WL.ink,
              borderBottom: !showSubNav ? `2.5px solid ${WL.lime}` : "none",
              paddingBottom: !showSubNav ? 4 : 0,
            }}
          >
            Overview
          </span>
          <span style={{ fontFamily: WL.fontSans, fontSize: 14, color: WL.textMuted }}>
            Settings
          </span>
          <span style={{ fontFamily: WL.fontSans, fontSize: 14, color: WL.textMuted }}>
            Docs
          </span>
        </div>

        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            backgroundColor: WL.inset,
            border: `1px solid ${WL.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: WL.fontSans,
            fontSize: 12,
            fontWeight: 600,
            color: WL.textSecondary,
          }}
        >
          F
        </div>
      </div>

      {showSubNav && (
        <div
          style={{
            height: 52,
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: WL.fontDisplay,
              fontSize: 18,
              fontWeight: 700,
              color: WL.ink,
              letterSpacing: "-0.025em",
            }}
          >
            {campaignName}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 24, height: "100%" }}>
            {tabs.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <span
                  key={tab}
                  style={{
                    height: "100%",
                    display: "inline-flex",
                    alignItems: "center",
                    fontFamily: WL.fontSans,
                    fontSize: 14.5,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? WL.ink : WL.textMuted,
                    borderBottom: isActive
                      ? `2.5px solid ${WL.lime}`
                      : "2.5px solid transparent",
                  }}
                >
                  {tab}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Quiet Stageshow Placeholder Bar (for non-focal filler only).
 */
export const PlaceholderBar: React.FC<{
  width: number | string;
  height?: number;
  tone?: "light" | "muted";
}> = ({ width, height = 10, tone = "light" }) => (
  <div
    style={{
      width,
      height,
      borderRadius: 999,
      backgroundColor: tone === "muted" ? "#D9DCDF" : "#EAECEF",
    }}
  />
);

/**
 * Waitlyze Semantic Status Pill
 */
export const StatusPill: React.FC<{
  label: string;
  variant: "verified" | "warning" | "danger" | "neutral" | "lime";
  dot?: boolean;
  style?: React.CSSProperties;
}> = ({ label, variant, dot = true, style }) => {
  const palette = {
    verified: { bg: WL.forestSoft, text: WL.forest, dot: WL.forest },
    warning: { bg: WL.warningBg, text: WL.warning, dot: "#D97706" },
    danger: { bg: WL.dangerBg, text: WL.danger, dot: WL.dangerSolid },
    neutral: { bg: WL.inset, text: WL.textSecondary, dot: WL.textMuted },
    lime: { bg: WL.lime, text: WL.ink, dot: WL.forest },
  }[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 11px",
        borderRadius: WL.radiusPill,
        backgroundColor: palette.bg,
        color: palette.text,
        fontFamily: WL.fontSans,
        fontSize: 13.5,
        fontWeight: 600,
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            backgroundColor: palette.dot,
            flexShrink: 0,
          }}
        />
      )}
      <span>{label}</span>
    </span>
  );
};

/**
 * Named colored avatar disc (Stageshow craft rule: colored for named people, gray only for filler)
 */
export const AvatarDisc: React.FC<{
  initials: string;
  color: string;
  size?: number;
}> = ({ initials, color, size = 34 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      backgroundColor: color,
      color: "#FFFFFF",
      fontFamily: WL.fontDisplay,
      fontSize: Math.round(size * 0.4),
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      letterSpacing: "-0.02em",
    }}
  >
    {initials}
  </div>
);

/**
 * Crisp macOS-style desktop notification card (used in Act 1 pain & Act 5 callback)
 */
export const NotificationCard: React.FC<{
  app: string;
  appBadgeBg: string;
  appGlyph: React.ReactNode;
  title: string;
  body: string;
  time?: string;
  width?: number;
  accentBorder?: string;
  style?: React.CSSProperties;
}> = ({
  app,
  appBadgeBg,
  appGlyph,
  title,
  body,
  time = "now",
  width = 430,
  accentBorder,
  style,
}) => (
  <div
    style={{
      width,
      padding: "16px 18px",
      borderRadius: 16,
      backgroundColor: "rgba(255, 255, 255, 0.97)",
      border: `1px solid ${accentBorder ?? WL.border}`,
      boxShadow: WL.shadowFloat,
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      ...style,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: appBadgeBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {appGlyph}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 3,
        }}
      >
        <span
          style={{
            fontFamily: WL.fontSans,
            fontSize: 12.5,
            fontWeight: 600,
            color: WL.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {app}
        </span>
        <span style={{ fontFamily: WL.fontSans, fontSize: 12.5, color: WL.textFaint }}>
          {time}
        </span>
      </div>
      <div
        style={{
          fontFamily: WL.fontDisplay,
          fontSize: 16,
          fontWeight: 700,
          color: WL.ink,
          lineHeight: 1.25,
          marginBottom: 3,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: WL.fontSans,
          fontSize: 14.5,
          color: WL.textSecondary,
          lineHeight: 1.35,
        }}
      >
        {body}
      </div>
    </div>
  </div>
);

/**
 * Stageshow Pointer Cursor (crisp vector arrow with press feedback, zero gimmicky halo)
 */
export const StageCursor: React.FC<{
  x: number;
  y: number;
  pressing?: number; // 0..1
  opacity?: number;
}> = ({ x, y, pressing = 0, opacity = 1 }) => {
  if (opacity <= 0.01) return null;
  const scale = 1 - pressing * 0.14;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        transform: `translate(-3px, -2px) scale(${scale.toFixed(3)})`,
        pointerEvents: "none",
        zIndex: 80,
      }}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 28 28"
        fill="none"
        style={{ filter: "drop-shadow(0 5px 10px rgba(0, 22, 13, 0.28))" }}
      >
        <path
          d="M5 3L22.5 13.2L14 15.4L10.5 23.8L5 3Z"
          fill={WL.ink}
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

/**
 * Smooth rolling integer counter using tabular numerals (no jitter)
 */
export const AnimatedNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
}> = ({ value, prefix = "", suffix = "", decimals = 0, style }) => {
  const formatted =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString("en-US");
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

/**
 * Editorial frame for REAL 3200x1920 Waitlyze product UI screenshots (video/public/captures/).
 * Flat frontal Stageshow framing with crisp border, Waitlyze shadow, and gentle focal zoom/pan
 * so real product controls stay effortlessly legible at 1920x1080.
 */
export const RealCaptureFrame: React.FC<{
  src: string;
  width: number;
  height: number;
  scale?: number;
  originX?: string;
  originY?: string;
  panX?: number;
  panY?: number;
  shadow?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({
  src,
  width,
  height,
  scale = 1,
  originX = "50%",
  originY = "0%",
  panX = 0,
  panY = 0,
  shadow = WL.shadowHero,
  style,
  children,
}) => (
  <div
    style={{
      width,
      height,
      borderRadius: WL.radiusWindow,
      border: `1px solid ${WL.border}`,
      backgroundColor: WL.white,
      boxShadow: shadow,
      overflow: "hidden",
      position: "relative",
      ...style,
    }}
  >
    <Img
      src={staticFile(`captures/${src}`)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "top center",
        display: "block",
        transformOrigin: `${originX} ${originY}`,
        transform: `translate3d(${panX.toFixed(1)}px, ${panY.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`,
      }}
    />
    {children}
  </div>
);

/**
 * Ferndesk-style Feature Split Layout (Left: crisp real UI stage, Right: bold Waitlyze editorial copy)
 */
export const FeatureSplitStage: React.FC<{
  localFrame: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ localFrame, eyebrow, title, subtitle, children }) => {
  const cardIn = easeRange(localFrame, 0, 26, 0, 1, arrivalEasing);
  const copyIn = easeRange(localFrame, 8, 32, 0, 1, travelEasing);

  return (
    <StudioBackdrop tone="clean">
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "0 110px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 84,
        }}
      >
        <div
          style={{
            flex: "0 0 1040px",
            opacity: cardIn,
            transform: `translate3d(0, ${(1 - cardIn) * 28}px, 0)`,
          }}
        >
          {children}
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            opacity: copyIn,
            transform: `translate3d(${(1 - copyIn) * 20}px, 0, 0)`,
          }}
        >
          <div
            style={{
              fontFamily: WL.fontMono,
              fontSize: 13.5,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: WL.forest,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontFamily: WL.fontDisplay,
              fontSize: 56,
              fontWeight: 700,
              color: WL.ink,
              letterSpacing: "-0.045em",
              lineHeight: 1.06,
              marginBottom: 20,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: WL.fontSans,
              fontSize: 23,
              fontWeight: 500,
              color: WL.textSecondary,
              lineHeight: 1.45,
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    </StudioBackdrop>
  );
};

/* --- Clean uniform 1.8px stroke icons (never emoji, consistent geometric weight) --- */

export const LockIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = WL.forest,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect
      x="5"
      y="11"
      width="14"
      height="10"
      rx="2.5"
      stroke={color}
      strokeWidth="2"
    />
    <path
      d="M8 11V7.5a4 4 0 0 1 8 0V11"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const CheckIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = "#FFFFFF",
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12.5L9.8 17.3L19 7.5"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ShieldIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = WL.forest,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 3L4.5 6.2V11.8C4.5 16.5 7.7 20.3 12 21.5C16.3 20.3 19.5 16.5 19.5 11.8V6.2L12 3Z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M9 12.2L11.2 14.4L15.4 9.8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const MailIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = "#FFFFFF",
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke={color} strokeWidth="2" />
    <path
      d="M4.5 7L12 12.5L19.5 7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const AlertIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = "#FFFFFF",
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M12 8V12.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1.1" fill={color} />
  </svg>
);

export const HashIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = "#FFFFFF",
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M9.5 4.5L7.5 19.5M16.5 4.5L14.5 19.5M4.5 9.5H19.5M4 14.5H19"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const CopyIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 15,
  color = WL.textSecondary,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="9" width="11" height="11" rx="2" stroke={color} strokeWidth="2" />
    <path
      d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const WebhookIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = WL.forest,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="6.5" r="2.5" stroke={color} strokeWidth="2" />
    <circle cx="6.5" cy="17" r="2.5" stroke={color} strokeWidth="2" />
    <circle cx="17.5" cy="17" r="2.5" stroke={color} strokeWidth="2" />
    <path
      d="M10.7 8.7L7.8 14.8M13.3 8.7L16.2 14.8M9 17H15"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);
