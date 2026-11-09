import { ImageResponse } from "next/og";

import { BrandLogo } from "@/components/og/brand-logo";
import { SITE_URL } from "@/lib/site-metadata";

export const OG_SIZE = { width: 1200, height: 630 };

/** A light editorial card for articles. */
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
        <span>waitlyze.com</span>
      </div>
    </div>,
    OG_SIZE,
  );
}

/**
 * Branded light 1200x630 social card for docs pages.
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
        background: "#f9faf6",
        padding: "64px 76px",
        color: "#071b12",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
      }}
    >
      {/* A quiet brand accent, consistent with the public pages. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 22,
          height: "100%",
          background: "#c8f93f",
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
              background: "#e7f8b8",
              padding: "7px 18px",
              borderRadius: 30,
              fontSize: 14,
              fontWeight: 700,
              color: "#193422",
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
            color: "#071b12",
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
          borderTop: "1px solid #cdd8ca",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18, color: "#42634e" }}
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
        <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#42634e" }}>
          {host}
        </div>
      </div>
    </div>,
    OG_SIZE,
  );
}
