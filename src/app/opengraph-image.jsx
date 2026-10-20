import { ImageResponse } from "next/og";

export const alt = "Waitlyze — Build an audience before you launch";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#ffffff",
        color: "#172018",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700 }}
      >
        <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 42 }}>
          {[24, 34, 42].map((height) => (
            <div
              key={height}
              style={{ display: "flex", width: 13, height, background: "#C6FE1E", borderRadius: 4 }}
            />
          ))}
        </div>
        Waitlyze
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -3,
            maxWidth: 960,
          }}
        >
          Build an audience before you launch.
        </div>
        <div style={{ display: "flex", fontSize: 27, color: "#5a665c" }}>
          Your page. Your signup form. Your next launch.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            background: "#C6FE1E",
            padding: "16px 25px",
            borderRadius: 30,
            fontWeight: 700,
          }}
        >
          Design · Publish · Understand
        </div>
        <div style={{ display: "flex", color: "#5a665c" }}>waitlyze.falakgala.dev</div>
      </div>
    </div>,
    size,
  );
}
