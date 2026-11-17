import React from "react";
import { useCurrentFrame } from "remotion";

import {
  arrivalEasing,
  easeRange,
  lerpColor,
  travelEasing,
  typeAndReplace,
} from "../motion/easing";

/**
 * Chapters 00–04 (frames 0..1569):
 * - 00..01 (frames 0..520): Waitlist identity ("Untitled launch" -> "Weekend")
 * - 02 (frames 520..979): Builder live editing ("Go outside." -> "Find your next escape.") + Desktop/Mobile preview toggle
 * - 03 (frames 979..1282): Brand Kit swatch morph (neutral slate -> Electric Lime #BAFE2A) + font & radius tokens
 * - 04 (frames 1282..1569): One-click Publish + Share drawer (`waitlyze.com/w/weekend` + Copy link -> Copied)
 */
export const BuilderSurface: React.FC = () => {
  const frame = useCurrentFrame();

  // Headline typing during BUILDER chapter (frames 560..810)
  const headlineState = typeAndReplace(frame, {
    initialText: "Go outside.",
    commonPrefix: "",
    finalText: "Find your next escape.",
    backspaceStart: 555,
    backspaceEnd: 615,
    typeStart: 625,
    typeEnd: 790,
  });

  // Mobile preview toggle (frames 835..945)
  const mobilePreviewMix =
    frame >= 830 && frame < 955
      ? easeRange(frame, 830, 868, 0, 1, travelEasing) *
        (1 - easeRange(frame, 925, 955, 0, 1, travelEasing))
      : 0;

  // Brand Kit swatch transition (frames 1035..1125): slate #1E293B -> Electric Lime #BAFE2A
  const brandLimeMix = easeRange(frame, 1035, 1095, 0, 1, travelEasing);
  const accentBg = lerpColor("#1E293B", "#BAFE2A", brandLimeMix);
  const accentText = lerpColor("#FFFFFF", "#00160A", brandLimeMix);

  // Corner radius morph in Brand Kit (frames 1135..1195)
  const previewRadius = easeRange(frame, 1135, 1190, 6, 14, travelEasing);

  // Social proof counter toggle in Brand Kit (frames 1185..1245)
  const socialProofMix = easeRange(frame, 1185, 1230, 0, 1, arrivalEasing);

  // Publish state & Share drawer (frames 1355..1569)
  const shareDrawerOpen = easeRange(frame, 1385, 1440, 0, 1, arrivalEasing);
  const linkCopied = frame >= 1495;
  const copyPress =
    frame >= 1482 && frame <= 1502 ? 1 - 0.06 * Math.sin(((frame - 1482) / 20) * Math.PI) : 1;

  const previewWidth = 640 - mobilePreviewMix * 260;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "480px 1fr",
        gap: 24,
        height: "100%",
        position: "relative",
      }}
    >
      {/* Left column: Inspector (Page Content + Brand Kit) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E7EA",
          borderRadius: 12,
          padding: "20px 22px",
          boxShadow: "0 1px 2px rgba(0, 22, 10, 0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 12,
            borderBottom: "1px solid #EEF0F2",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#00160A",
                letterSpacing: "-0.01em",
              }}
            >
              Page content
            </div>
            <div style={{ fontSize: 12.5, color: "#687076", marginTop: 2 }}>
              Changes save automatically · Version 3
            </div>
          </div>
          <span
            style={{
              fontFamily: "'Paper Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: 6,
              backgroundColor: "#F2F4F5",
              color: "#4B5258",
            }}
          >
            4 BLOCKS
          </span>
        </div>

        {/* Hero Headline Field */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#2C3237",
              }}
            >
              Hero headline
            </span>
            <span
              style={{
                fontFamily: "'Paper Mono', monospace",
                fontSize: 11,
                color: headlineState.isTyping ? "#196642" : "#8D949A",
              }}
            >
              {headlineState.text.length}/48
            </span>
          </div>
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: headlineState.isTyping ? "1.5px solid #00160A" : "1px solid #D5D9DD",
              boxShadow: headlineState.isTyping ? "0 0 0 3px rgba(186, 254, 42, 0.45)" : "none",
              backgroundColor: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              color: "#00160A",
              display: "flex",
              alignItems: "center",
              minHeight: 40,
            }}
          >
            <span>{headlineState.text}</span>
            {headlineState.isTyping && (
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 16,
                  backgroundColor: "#00160A",
                  marginLeft: 2,
                }}
              />
            )}
          </div>
        </div>

        {/* Subheadline Field */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#2C3237" }}>Introduction</span>
          <div
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid #E4E7EA",
              backgroundColor: "#F9FAFB",
              fontSize: 13,
              color: "#4B5258",
              lineHeight: 1.45,
            }}
          >
            Curated cabin & trail drops within two hours of your city. Early members unlock Friday
            priority booking.
          </div>
        </div>

        {/* Brand Kit Section */}
        <div
          style={{
            marginTop: 4,
            paddingTop: 14,
            borderTop: "1px solid #EEF0F2",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#00160A",
              }}
            >
              Brand kit & tokens
            </span>
            <span
              style={{
                fontFamily: "'Paper Mono', monospace",
                fontSize: 11,
                color: brandLimeMix > 0.5 ? "#196642" : "#687076",
                backgroundColor: brandLimeMix > 0.5 ? "#EAF8F0" : "#F2F4F5",
                padding: "2px 8px",
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              {brandLimeMix > 0.5 ? "LIME · #BAFE2A" : "SLATE · #1E293B"}
            </span>
          </div>

          {/* Swatch Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#F8FAFB",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #EAECEF",
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "#4B5258" }}>
              Primary action accent
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {[
                { color: "#1E293B", active: brandLimeMix < 0.5 },
                { color: "#BAFE2A", active: brandLimeMix >= 0.5 },
                { color: "#10B981", active: false },
                { color: "#F97316", active: false },
              ].map((sw, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    backgroundColor: sw.color,
                    border: sw.active ? "2px solid #00160A" : "1px solid rgba(0,0,0,0.12)",
                    boxShadow: sw.active ? "0 0 0 3px rgba(186, 254, 42, 0.45)" : "none",
                    transform: `scale(${sw.active ? 1.12 : 1})`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Typography + Referral Reward Toggle */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div
              style={{
                padding: "9px 11px",
                borderRadius: 8,
                border: "1px solid #E4E7EA",
                backgroundColor: "#FFFFFF",
              }}
            >
              <div style={{ fontSize: 11, color: "#687076" }}>Display font</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#00160A",
                  marginTop: 2,
                }}
              >
                Manrope Bold
              </div>
            </div>
            <div
              style={{
                padding: "9px 11px",
                borderRadius: 8,
                border: "1px solid #E4E7EA",
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "#687076" }}>Queue proof</div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#00160A",
                    marginTop: 2,
                  }}
                >
                  Live counter
                </div>
              </div>
              <div
                style={{
                  width: 34,
                  height: 20,
                  borderRadius: 999,
                  backgroundColor: lerpColor("#D5D9DD", "#BAFE2A", socialProofMix),
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    backgroundColor: "#00160A",
                    transform: `translateX(${socialProofMix * 14}px)`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right column: Live Responsive Preview Canvas */}
      <div
        style={{
          backgroundColor: "#F6F8F9",
          border: "1px solid #E4E7EA",
          borderRadius: 12,
          padding: "16px 22px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Preview toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#00160A" }}>Live preview</span>
            <span
              style={{
                fontFamily: "'Paper Mono', monospace",
                fontSize: 11.5,
                color: "#687076",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E7EA",
                padding: "2px 8px",
                borderRadius: 6,
              }}
            >
              waitlyze.com/w/weekend
            </span>
          </div>

          {/* Desktop / Mobile Segmented Control */}
          <div
            style={{
              display: "inline-flex",
              padding: 3,
              borderRadius: 8,
              backgroundColor: "#EAECEF",
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 6,
                backgroundColor: mobilePreviewMix < 0.5 ? "#FFFFFF" : "transparent",
                color: mobilePreviewMix < 0.5 ? "#00160A" : "#687076",
                boxShadow: mobilePreviewMix < 0.5 ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              Desktop
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 6,
                backgroundColor: mobilePreviewMix >= 0.5 ? "#FFFFFF" : "transparent",
                color: mobilePreviewMix >= 0.5 ? "#00160A" : "#687076",
                boxShadow: mobilePreviewMix >= 0.5 ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              Mobile
            </span>
          </div>
        </div>

        {/* Hosted Waitlist Preview Card */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: previewWidth,
              backgroundColor: "#FFFFFF",
              borderRadius: previewRadius,
              border: "1px solid #E4E7EA",
              boxShadow: "0 12px 32px -8px rgba(0, 22, 10, 0.08), 0 2px 6px rgba(0, 22, 10, 0.03)",
              padding: mobilePreviewMix > 0.5 ? "28px 24px" : "36px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 999,
                  backgroundColor: brandLimeMix > 0.5 ? "#F4FDE2" : "#F2F4F5",
                  border: brandLimeMix > 0.5 ? "1px solid #CFF678" : "1px solid #E4E7EA",
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#00160A",
                  fontFamily: "'Paper Mono', monospace",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: brandLimeMix > 0.5 ? "#65A30D" : "#64748B",
                  }}
                />
                WEEKEND · DROP 01
              </span>
            </div>

            <div
              style={{
                fontFamily: "var(--wl-font-display), sans-serif",
                fontSize: mobilePreviewMix > 0.5 ? 30 : 38,
                fontWeight: 800,
                color: "#00160A",
                letterSpacing: "-0.035em",
                lineHeight: 1.08,
              }}
            >
              {headlineState.text}
            </div>

            <div
              style={{
                fontSize: 14.5,
                color: "#4B5258",
                lineHeight: 1.5,
                maxWidth: 480,
              }}
            >
              Curated cabin & trail drops within two hours of your city. Early members unlock Friday
              priority booking.
            </div>

            {/* Email input + CTA button */}
            <div
              style={{
                display: "flex",
                flexDirection: mobilePreviewMix > 0.6 ? "column" : "row",
                gap: 10,
                marginTop: 4,
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "11px 14px",
                  borderRadius: Math.max(6, previewRadius - 4),
                  border: "1px solid #D5D9DD",
                  backgroundColor: "#F9FAFB",
                  fontSize: 13.5,
                  color: "#8D949A",
                }}
              >
                you@domain.com
              </div>
              <div
                style={{
                  padding: "11px 20px",
                  borderRadius: Math.max(6, previewRadius - 4),
                  backgroundColor: accentBg,
                  color: accentText,
                  fontSize: 13.5,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  border: brandLimeMix > 0.5 ? "1px solid #9EE01A" : "1px solid transparent",
                }}
              >
                <span>Join the waitlist</span>
                <span>→</span>
              </div>
            </div>

            {/* Social proof footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 10,
                borderTop: "1px solid #F1F3F5",
                opacity: 0.35 + 0.65 * socialProofMix,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex" }}>
                  {["#10B981", "#0EA5E9", "#8B5CF6", "#F59E0B"].map((c, i) => (
                    <span
                      key={i}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 999,
                        backgroundColor: c,
                        border: "2px solid #FFFFFF",
                        marginLeft: i === 0 ? 0 : -6,
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: "#4B5258", fontWeight: 500 }}>
                  <strong style={{ color: "#00160A" }}>1,230 founders</strong> joined · Refer 3
                  friends to jump the line
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 11,
                  color: "#196642",
                  fontWeight: 600,
                }}
              >
                TURNSTILE ✓
              </span>
            </div>
          </div>
        </div>

        {/* Share & Embed Popover Card (Chapters 04 PUBLISH: frames 1385..1569) */}
        {shareDrawerOpen > 0.01 && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 16,
              width: 420,
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              border: "1.5px solid #00160A",
              boxShadow: "0 20px 48px rgba(0, 22, 10, 0.18)",
              padding: "16px 18px",
              opacity: shareDrawerOpen,
              transform: `translate3d(0, ${(1 - shareDrawerOpen) * -12}px, 0) scale(${0.96 + 0.04 * shareDrawerOpen})`,
              zIndex: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: "#196642",
                    boxShadow: "0 0 0 3px #EAF8F0",
                  }}
                />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#00160A" }}>
                  Your waitlist is live
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 11,
                  color: "#196642",
                  backgroundColor: "#EAF8F0",
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                SSL · EDGE READY
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: 8,
                backgroundColor: "#F6F8F9",
                border: "1px solid #E4E7EA",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 12.5,
                  color: "#00160A",
                  fontWeight: 600,
                }}
              >
                https://waitlyze.com/w/weekend
              </span>
              <div
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  backgroundColor: linkCopied ? "#00160A" : "#BAFE2A",
                  color: linkCopied ? "#BAFE2A" : "#00160A",
                  fontSize: 12,
                  fontWeight: 700,
                  transform: `scale(${copyPress.toFixed(3)})`,
                }}
              >
                {linkCopied ? "✓ Copied" : "Copy link"}
              </div>
            </div>

            <div
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                backgroundColor: "#00160A",
                color: "#D5F5E3",
                fontFamily: "'Paper Mono', monospace",
                fontSize: 11,
                lineHeight: 1.45,
              }}
            >
              {'<div class="waitlyze-widget" data-slug="weekend"></div>'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
