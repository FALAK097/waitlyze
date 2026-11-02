import { ImageResponse } from "next/og";

import { BrandLogo } from "@/components/og/brand-logo";
import { SITE_URL } from "@/lib/site-metadata";

export const OG_SIZE = { width: 1200, height: 630 };

/** A light editorial card for articles; docs keep the dark reference card below. */
export function renderBlogOgImage({ title, eyebrow, readingTime, date }) {
  const size = title.length > 75 ? 51 : title.length > 50 ? 61 : 72;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#f9faf6",
        color: "#071b12",
        padding: "54px 72px 50px",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 22,
          height: "100%",
          background: "#c8f93f",
          display: "flex",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BrandLogo textSize={31} height={38} />
        <div style={{ display: "flex", fontSize: 17, fontWeight: 600, color: "#42634e" }}>
          THE WAITLYZE BLOG
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 25, maxWidth: 1030 }}>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "9px 15px",
            borderRadius: 5,
            background: "#e7f8b8",
            color: "#193422",
            fontSize: 17,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: size,
            lineHeight: 1.08,
            fontWeight: 750,
            letterSpacing: -2,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: 22,
          borderTop: "1px solid #cdd8ca",
          fontSize: 18,
          color: "#42634e",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <span>{date}</span>
          <span>·</span>
          <span>{readingTime}</span>
        </div>
        <span>waitlyze.falakgala.dev</span>
      </div>
    </div>,
    OG_SIZE,
  );
}

/**
 * Branded 1200x630 social card shared by blog posts and docs pages.
 * High-contrast dark obsidian canvas with electric lime accents.
 */
export function renderOgImage({ title, eyebrow, readingTime, date }) {
  const host = new URL(SITE_URL).hostname;
  const size = title.length > 75 ? 52 : title.length > 45 ? 64 : 76;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #020c06 0%, #05180f 45%, #020c06 100%)",
        padding: "64px 76px",
        color: "#ffffff",
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
          width: "460px",
          height: "460px",
          background:
            "radial-gradient(circle, rgba(200, 249, 63, 0.12) 0%, rgba(200, 249, 63, 0) 70%)",
          borderRadius: "1000px",
          display: "flex",
        }}
      />

      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <BrandLogo />

        {eyebrow ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(200, 249, 63, 0.08)",
              border: "1px solid rgba(200, 249, 63, 0.25)",
              padding: "7px 18px",
              borderRadius: 30,
              fontSize: 14,
              fontWeight: 700,
              color: "#c8f93f",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            <span>{eyebrow}</span>
          </div>
        ) : null}
      </div>

      {/* Center title area */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "flex",
            fontSize: size,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -2,
            maxWidth: 1040,
            color: "#ffffff",
          }}
        >
          {title}
        </div>
      </div>

      {/* Footer bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "20px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18, color: "#9db0a3" }}
        >
          <span>Waitlyze Knowledge Hub</span>
          {readingTime ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>·</span>
              <span>{readingTime}</span>
            </div>
          ) : null}
          {date ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>·</span>
              <span>{date}</span>
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#c8f93f" }}>
          {host}
        </div>
      </div>
    </div>,
    OG_SIZE,
  );
}
