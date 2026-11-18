import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import React from "react";

export const INK = "#00160d";
export const MUTED = "#5d6b60";
export const ACCENT = "#c6fe1e";
export const BORDER = "#e5eae4";
export const SURFACE = "#f7f9f5";

const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const monoFamily =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace";

export function createChangelogEmailElement({
  version = "v0.11.0",
  date = "Nov 11, 2026",
  title = "Flexible API key management and zero-downtime rotation",
  summary = "",
  features = [],
  fixes = [],
  changelogUrl = "https://waitlyze.com/docs/changelog",
}) {
  const previewText = `Waitlyze ${version}: ${title}`;

  return React.createElement(
    Html,
    { lang: "en" },
    React.createElement(Head, null),
    React.createElement(Preview, null, previewText),
    React.createElement(
      Body,
      {
        style: {
          margin: 0,
          padding: "40px 20px",
          backgroundColor: "#ffffff",
          fontFamily,
          color: INK,
        },
      },
      React.createElement(
        Container,
        { style: { maxWidth: 580, margin: "0 auto" } },

        // Header / Wordmark
        React.createElement(
          Section,
          { style: { paddingBottom: 32, borderBottom: `1px solid ${BORDER}` } },
          React.createElement(
            Text,
            {
              style: {
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.035em",
                color: INK,
              },
            },
            "waitlyze",
            React.createElement("span", { style: { color: "#749e14" } }, "."),
          ),
        ),

        // Body content
        React.createElement(
          Section,
          { style: { paddingTop: 32 } },

          // Version badge
          React.createElement(
            "table",
            { style: { borderCollapse: "collapse", marginBottom: 16 } },
            React.createElement(
              "tbody",
              null,
              React.createElement(
                "tr",
                null,
                React.createElement(
                  "td",
                  {
                    style: {
                      backgroundColor: SURFACE,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 9999,
                      padding: "4px 12px",
                    },
                  },
                  React.createElement(
                    Text,
                    {
                      style: {
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                        fontFamily: monoFamily,
                        color: INK,
                      },
                    },
                    React.createElement(
                      "span",
                      { style: { color: "#749e14", marginRight: 5 } },
                      "●",
                    ),
                    `${version} · ${date}`,
                  ),
                ),
              ),
            ),
          ),

          // Release Title
          React.createElement(
            Heading,
            {
              style: {
                margin: "0 0 16px",
                fontSize: 26,
                lineHeight: "34px",
                letterSpacing: "-0.035em",
                fontWeight: 700,
                color: INK,
              },
            },
            title,
          ),

          // Summary
          summary
            ? React.createElement(
                Text,
                {
                  style: {
                    margin: "0 0 24px",
                    fontSize: 15,
                    lineHeight: "25px",
                    color: "#2e3b32",
                  },
                },
                summary,
              )
            : null,

          // Primary CTA Button
          React.createElement(
            Section,
            { style: { padding: "4px 0 28px" } },
            React.createElement(
              Link,
              {
                href: changelogUrl,
                style: {
                  display: "inline-block",
                  backgroundColor: ACCENT,
                  color: INK,
                  fontSize: 14,
                  lineHeight: "20px",
                  fontWeight: 700,
                  textDecoration: "none",
                  padding: "12px 22px",
                  borderRadius: 6,
                },
              },
              "Read full release notes →",
            ),
          ),

          // Features Box
          features && features.length > 0
            ? React.createElement(
                Section,
                {
                  style: {
                    marginBottom: 18,
                    padding: "20px 22px",
                    backgroundColor: SURFACE,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                  },
                },
                React.createElement(
                  Text,
                  {
                    style: {
                      margin: "0 0 14px",
                      fontSize: 11,
                      lineHeight: "16px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#55731d",
                    },
                  },
                  "What’s New",
                ),
                ...features.map((feature, idx) =>
                  React.createElement(
                    "div",
                    {
                      key: feature.title || idx,
                      style: {
                        marginBottom: idx === features.length - 1 ? 0 : 12,
                      },
                    },
                    React.createElement(
                      Text,
                      {
                        style: {
                          margin: 0,
                          fontSize: 14,
                          lineHeight: "22px",
                          color: INK,
                        },
                      },
                      feature.title
                        ? React.createElement(
                            "strong",
                            { style: { fontWeight: 650 } },
                            `${feature.title}. `,
                          )
                        : null,
                      React.createElement(
                        "span",
                        { style: { color: "#3d4940" } },
                        feature.description,
                      ),
                    ),
                  ),
                ),
              )
            : null,

          // Fixes & Polish Box
          fixes && fixes.length > 0
            ? React.createElement(
                Section,
                {
                  style: {
                    marginBottom: 24,
                    padding: "18px 22px",
                    backgroundColor: "#ffffff",
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                  },
                },
                React.createElement(
                  Text,
                  {
                    style: {
                      margin: "0 0 12px",
                      fontSize: 11,
                      lineHeight: "16px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: MUTED,
                    },
                  },
                  "Improvements & Fixes",
                ),
                ...fixes.map((fix, idx) =>
                  React.createElement(
                    "div",
                    {
                      key: fix.title || idx,
                      style: {
                        marginBottom: idx === fixes.length - 1 ? 0 : 10,
                      },
                    },
                    React.createElement(
                      Text,
                      {
                        style: {
                          margin: 0,
                          fontSize: 13,
                          lineHeight: "21px",
                          color: INK,
                        },
                      },
                      React.createElement("span", { style: { color: MUTED, marginRight: 6 } }, "•"),
                      fix.title
                        ? React.createElement(
                            "strong",
                            { style: { fontWeight: 600 } },
                            `${fix.title}. `,
                          )
                        : null,
                      React.createElement("span", { style: { color: "#4f5b52" } }, fix.description),
                    ),
                  ),
                ),
              )
            : null,

          // Fallback Link
          React.createElement(
            Text,
            {
              style: {
                margin: "12px 0 0",
                fontSize: 12,
                lineHeight: "18px",
                color: MUTED,
                wordBreak: "break-all",
              },
            },
            "Or open this link directly: ",
            React.createElement(
              Link,
              { href: changelogUrl, style: { color: MUTED } },
              changelogUrl,
            ),
          ),
        ),

        // Footer
        React.createElement(
          Section,
          { style: { paddingTop: 40 } },
          React.createElement(Hr, {
            style: { borderColor: BORDER, margin: "0 0 20px" },
          }),
          React.createElement(
            Text,
            { style: { margin: 0, fontSize: 12, lineHeight: "20px", color: MUTED } },
            "You’re receiving this email because you have an active account on Waitlyze.",
          ),
          React.createElement(
            Text,
            { style: { margin: "10px 0 0", fontSize: 12, color: MUTED } },
            React.createElement(
              Link,
              {
                href: "https://waitlyze.com",
                style: { color: MUTED, textDecoration: "underline" },
              },
              "Waitlyze",
            ),
            " · Build an audience before you launch.",
          ),
        ),
      ),
    ),
  );
}

/**
 * Renders the HTML string for the changelog release email.
 */
export async function renderChangelogEmailHtml(props) {
  const element = createChangelogEmailElement(props);
  return render(element);
}
