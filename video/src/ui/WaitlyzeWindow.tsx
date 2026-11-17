import React from "react";
import { useCurrentFrame } from "remotion";

import { easeRange, travelEasing, typeAndReplace } from "../motion/easing";
import { CHAPTERS, WINDOW_H, WINDOW_W } from "../timeline";
import { AnalyticsSurface } from "./AnalyticsSurface";
import { BuilderSurface } from "./BuilderSurface";
import { EmailsSurface } from "./EmailsSurface";
import { SignupsReferralSurface } from "./SignupsReferralSurface";

const TABS: Array<{
  id: "builder" | "signups" | "emails" | "analytics" | "settings";
  label: string;
  badge?: string;
}> = [
  { id: "builder", label: "Builder" },
  { id: "signups", label: "Signups", badge: "1,230" },
  { id: "emails", label: "Emails" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
];

export const WaitlyzeWindow: React.FC = () => {
  const frame = useCurrentFrame();

  // Waitlist title typing in Chapter 01 WAITLIST (frames 280..470)
  const titleState = typeAndReplace(frame, {
    initialText: "Untitled launch",
    commonPrefix: "",
    finalText: "Weekend",
    backspaceStart: 295,
    backspaceEnd: 355,
    typeStart: 365,
    typeEnd: 445,
  });

  // Active tab from current chapter
  const currentChapter =
    CHAPTERS.find((c) => frame >= c.startFrame && frame < c.endFrame) ??
    CHAPTERS[CHAPTERS.length - 1];
  const activeTab = currentChapter.activeTab;

  // Publish button state (Chapter 04 PUBLISH: pressed around frame 1370)
  const isPublished = frame >= 1375;
  const publishPress =
    frame >= 1362 && frame <= 1384 ? 1 - 0.06 * Math.sin(((frame - 1362) / 22) * Math.PI) : 1;

  // Smooth tab indicator position
  const activeIdx = Math.max(
    0,
    TABS.findIndex((t) => t.id === activeTab),
  );

  return (
    <div
      style={{
        width: WINDOW_W,
        height: WINDOW_H,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        border: "1px solid rgba(255, 255, 255, 0.22)",
        boxShadow:
          "0 45px 110px -20px rgba(0, 0, 0, 0.78), 0 0 0 1px rgba(0, 22, 10, 0.08), 0 0 80px -20px rgba(186, 254, 42, 0.16)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "var(--wl-font-sans), system-ui, sans-serif",
        color: "#00160A",
      }}
    >
      {/* Top Global App Bar (macOS traffic lights + Waitlyze wordmark + Waitlists/Settings) */}
      <div
        style={{
          height: 52,
          padding: "0 24px",
          borderBottom: "1px solid #EEF0F2",
          backgroundColor: "#FCFCFD",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* macOS Traffic Lights */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 11.5,
                height: 11.5,
                borderRadius: 999,
                backgroundColor: "#FF5F56",
              }}
            />
            <span
              style={{
                width: 11.5,
                height: 11.5,
                borderRadius: 999,
                backgroundColor: "#FFBD2E",
              }}
            />
            <span
              style={{
                width: 11.5,
                height: 11.5,
                borderRadius: 999,
                backgroundColor: "#27C93F",
              }}
            />
          </div>

          {/* Waitlyze Brand Wordmark (exact 3 skewed lime bars + waitlyze.) */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontFamily: "var(--wl-font-display), sans-serif",
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#00160A",
            }}
          >
            <span
              style={{
                marginRight: 7,
                display: "inline-flex",
                height: 22,
                transform: "skewX(-12deg)",
                alignItems: "center",
                gap: 2.5,
              }}
            >
              <i
                style={{
                  display: "block",
                  height: 13,
                  width: 3.5,
                  borderRadius: 2,
                  backgroundColor: "#BAFE2A",
                }}
              />
              <i
                style={{
                  display: "block",
                  height: 19,
                  width: 3.5,
                  borderRadius: 2,
                  backgroundColor: "#BAFE2A",
                }}
              />
              <i
                style={{
                  display: "block",
                  height: 16,
                  width: 3.5,
                  borderRadius: 2,
                  backgroundColor: "#BAFE2A",
                }}
              />
            </span>
            <span>waitlyze</span>
            <span style={{ color: "#196642" }}>.</span>
          </div>

          {/* Global nav: Waitlists · Settings */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginLeft: 8,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "5px 10px",
                borderRadius: 7,
                backgroundColor: "#F2F4F5",
                color: "#00160A",
              }}
            >
              Waitlists
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                padding: "5px 10px",
                color: "#687076",
              }}
            >
              Settings
            </span>
          </div>
        </div>

        {/* Right workspace badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontFamily: "'Paper Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 9px",
              borderRadius: 6,
              backgroundColor: "#F6FEE7",
              border: "1px solid #CFF678",
              color: "#00160A",
            }}
          >
            PRO WORKSPACE
          </span>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              backgroundColor: "#00160A",
              color: "#BAFE2A",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            FG
          </div>
        </div>
      </div>

      {/* Waitlist Header + Tabs Bar */}
      <div
        style={{
          padding: "18px 28px 0 28px",
          borderBottom: "1px solid #E4E7EA",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          {/* Left: Editable Waitlist Name + Slug Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: titleState.isTyping ? "4px 10px" : "4px 4px",
                borderRadius: 8,
                border: titleState.isTyping ? "1.5px solid #00160A" : "1.5px solid transparent",
                boxShadow: titleState.isTyping ? "0 0 0 3px rgba(186, 254, 42, 0.5)" : "none",
                backgroundColor: titleState.isTyping ? "#F9FAFB" : "transparent",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--wl-font-display), sans-serif",
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#00160A",
                }}
              >
                {titleState.text}
              </span>
              {titleState.isTyping && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2.5,
                    height: 22,
                    backgroundColor: "#00160A",
                    marginLeft: 3,
                  }}
                />
              )}
            </div>

            <span
              style={{
                fontFamily: "'Paper Mono', monospace",
                fontSize: 11.5,
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: 999,
                backgroundColor: isPublished ? "#EAF8F0" : "#F2F4F5",
                color: isPublished ? "#196642" : "#4B5258",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: isPublished ? "#196642" : "#8D949A",
                }}
              />
              {isPublished
                ? "LIVE · waitlyze.com/w/weekend"
                : titleState.phase === "done"
                  ? "READY TO PUBLISH"
                  : "DRAFT"}
            </span>
          </div>

          {/* Right: Save status + Primary Lime Publish Button */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 12,
                color: "#687076",
                fontFamily: "'Paper Mono', monospace",
              }}
            >
              Saved · revision #3
            </span>
            <div
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #E4E7EA",
                backgroundColor: "#FFFFFF",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#2C3237",
              }}
            >
              Share & embed
            </div>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                backgroundColor: isPublished ? "#00160A" : "#BAFE2A",
                color: isPublished ? "#BAFE2A" : "#00160A",
                border: isPublished ? "1px solid #00160A" : "1px solid #9EE01A",
                fontSize: 13,
                fontWeight: 800,
                transform: `scale(${publishPress.toFixed(3)})`,
                minWidth: 148,
                textAlign: "center",
              }}
            >
              {isPublished ? "✓ Published · Live" : "Publish waitlist"}
            </div>
          </div>
        </div>

        {/* Waitlist Section Tabs: Builder · Signups · Emails · Analytics · Settings */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            position: "relative",
          }}
        >
          {TABS.map((t, idx) => {
            const isActive = idx === activeIdx;
            return (
              <div
                key={t.id}
                style={{
                  padding: "8px 2px 11px 2px",
                  fontSize: 13.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#00160A" : "#687076",
                  borderBottom: isActive ? "2.5px solid #00160A" : "2.5px solid transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{t.label}</span>
                {t.badge && frame >= 1569 && (
                  <span
                    style={{
                      fontFamily: "'Paper Mono', monospace",
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 999,
                      backgroundColor: isActive ? "#BAFE2A" : "#F2F4F5",
                      color: "#00160A",
                    }}
                  >
                    {t.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Tab Body Content */}
      <div
        style={{
          flex: 1,
          padding: "20px 28px 24px 28px",
          backgroundColor: "#F9FAFB",
          overflow: "hidden",
        }}
      >
        {activeTab === "builder" && <BuilderSurface />}
        {activeTab === "signups" && <SignupsReferralSurface />}
        {activeTab === "emails" && <EmailsSurface />}
        {activeTab === "analytics" && <AnalyticsSurface />}
      </div>
    </div>
  );
};

/**
 * Chapter 10 END CARD (frames 3810..4254 = 63.50s..70.89s):
 * Mirrors the reference video's signature wordmark end card:
 * - Three skewed lime bars (`-skew-x-12`) rise like an ascending growth chart
 * - `waitlyze` types out cleanly with a lime caret, followed by the green dot `.`
 * - Tagline: "Your launch starts before launch day."
 * - URL badge: `waitlyze.com`
 * - Fade to black at 70.89s
 */
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 3825) return null;

  const enter = easeRange(frame, 3835, 3885, 0, 1, travelEasing);
  const fadeOut = 1 - easeRange(frame, 4185, 4250, 0, 1, travelEasing);
  const opacity = enter * fadeOut;

  const bar1 = easeRange(frame, 3845, 3885, 0, 1, travelEasing);
  const bar2 = easeRange(frame, 3857, 3897, 0, 1, travelEasing);
  const bar3 = easeRange(frame, 3869, 3909, 0, 1, travelEasing);

  const wordState = typeAndReplace(frame, {
    initialText: "",
    commonPrefix: "",
    finalText: "waitlyze",
    backspaceStart: 3870,
    backspaceEnd: 3871,
    typeStart: 3875,
    typeEnd: 3948,
  });

  const dotAppear = easeRange(frame, 3948, 3972, 0, 1, travelEasing);
  const taglineAppear = easeRange(frame, 3968, 4015, 0, 1, travelEasing);
  const urlAppear = easeRange(frame, 4000, 4045, 0, 1, travelEasing);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        zIndex: 40,
      }}
    >
      {/* Center Wordmark */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          fontFamily: "var(--wl-font-display), sans-serif",
          fontSize: 82,
          fontWeight: 800,
          letterSpacing: "-0.045em",
          color: "#FFFFFF",
          lineHeight: 1,
        }}
      >
        {/* 3 Skewed Lime Bars */}
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
              backgroundColor: "#BAFE2A",
              boxShadow: "0 0 24px rgba(186, 254, 42, 0.55)",
            }}
          />
          <i
            style={{
              display: "block",
              height: 68 * bar2,
              width: 11,
              borderRadius: 4,
              backgroundColor: "#BAFE2A",
              boxShadow: "0 0 24px rgba(186, 254, 42, 0.55)",
            }}
          />
          <i
            style={{
              display: "block",
              height: 56 * bar3,
              width: 11,
              borderRadius: 4,
              backgroundColor: "#BAFE2A",
              boxShadow: "0 0 24px rgba(186, 254, 42, 0.55)",
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
              backgroundColor: "#BAFE2A",
              marginLeft: 6,
            }}
          />
        )}
        <span
          style={{
            color: "#BAFE2A",
            opacity: dotAppear,
            transform: `scale(${0.5 + 0.5 * dotAppear})`,
            display: "inline-block",
          }}
        >
          .
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          marginTop: 22,
          fontFamily: "var(--wl-font-sans), sans-serif",
          fontSize: 22,
          fontWeight: 500,
          color: "rgba(235, 245, 238, 0.82)",
          letterSpacing: "-0.01em",
          opacity: taglineAppear,
          transform: `translate3d(0, ${(1 - taglineAppear) * 10}px, 0)`,
        }}
      >
        Your launch starts before launch day.
      </div>

      {/* Domain Pill: waitlyze.com */}
      <div
        style={{
          marginTop: 26,
          padding: "9px 22px",
          borderRadius: 999,
          backgroundColor: "rgba(186, 254, 42, 0.12)",
          border: "1px solid rgba(186, 254, 42, 0.48)",
          fontFamily: "'Paper Mono', monospace",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "#BAFE2A",
          opacity: urlAppear,
          transform: `translate3d(0, ${(1 - urlAppear) * 10}px, 0)`,
          boxShadow: "0 0 32px rgba(186, 254, 42, 0.18)",
        }}
      >
        waitlyze.com
      </div>
    </div>
  );
};
