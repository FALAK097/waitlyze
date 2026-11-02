import { ImageResponse } from "next/og";

import { BrandLogo } from "@/components/og/brand-logo";
import { SITE_URL } from "@/lib/site-metadata";

export const alt = "Waitlyze - Build an audience before you launch";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const host = new URL(SITE_URL).hostname;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #020c06 0%, #05180f 45%, #020c06 100%)",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 76px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
      }}
    >
      {/* Decorative top-right accent glow */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-120px",
          width: "480px",
          height: "480px",
          background:
            "radial-gradient(circle, rgba(200, 249, 63, 0.12) 0%, rgba(200, 249, 63, 0) 70%)",
          borderRadius: "1000px",
          display: "flex",
        }}
      />

      {/* Top navigation row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <BrandLogo textSize={38} height={44} barWidth={10} heights={[24, 42, 32]} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(200, 249, 63, 0.08)",
            border: "1px solid rgba(200, 249, 63, 0.25)",
            padding: "8px 20px",
            borderRadius: 30,
            fontSize: 15,
            fontWeight: 700,
            color: "#c8f93f",
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c8f93f" }} />
          <span>Waitlist & Referral Engine</span>
        </div>
      </div>

      {/* Main hero title & value prop */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: -2.5,
            maxWidth: 1020,
            color: "#ffffff",
          }}
        >
          Build an audience before you launch.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            lineHeight: 1.4,
            color: "#9db0a3",
            maxWidth: 960,
          }}
        >
          Branded waitlist pages, verified referral loops, automated email sequences, and
          privacy-first analytics.
        </div>
      </div>

      {/* Bottom feature badges & host pill */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "24px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ display: "flex", gap: 14 }}>
          {[
            "14 Launch Templates",
            "Verified Referrals",
            "Email Automations",
            "Embed & Public API",
          ].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 600,
                color: "#d7e3da",
              }}
            >
              <span style={{ color: "#c8f93f" }}>✓</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 20,
            fontWeight: 700,
            color: "#c8f93f",
            letterSpacing: -0.5,
          }}
        >
          {host}
        </div>
      </div>
    </div>,
    size,
  );
}
