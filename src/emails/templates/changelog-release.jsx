import { Section, Text } from "@react-email/components";

import {
  BORDER,
  EmailLayout,
  FallbackLink,
  INK,
  MUTED,
  Paragraph,
  PrimaryLink,
  SURFACE,
} from "../layout";

export function ChangelogReleaseEmail({
  version = "",
  date = "",
  title = "New release available",
  summary = "",
  features = [],
  fixes = [],
  changelogUrl = "https://waitlyze.com/docs/changelog",
}) {
  const preview = version ? `Waitlyze ${version}: ${title}` : `Waitlyze: ${title}`;

  return (
    <EmailLayout
      preview={preview}
      heading={null}
      footer="You’re receiving this email because you have a registered account on Waitlyze."
    >
      {/* Top Monospace Badge / Version Tag */}
      <Section style={{ paddingBottom: 16 }}>
        <table style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 9999,
                  padding: "4px 12px",
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    fontFamily: "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
                    color: INK,
                  }}
                >
                  <span style={{ color: "#749e14" }}>●</span> {version}
                  {date ? ` · ${date}` : ""}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Main Release Title */}
      <Text
        style={{
          margin: "0 0 16px",
          fontSize: 26,
          lineHeight: "34px",
          letterSpacing: "-0.035em",
          fontWeight: 700,
          color: INK,
        }}
      >
        {title}
      </Text>

      {/* Executive Summary */}
      {summary ? (
        <Paragraph>
          <span style={{ color: "#2d3730", fontSize: 16, lineHeight: "26px" }}>{summary}</span>
        </Paragraph>
      ) : null}

      {/* Primary CTA Button */}
      <PrimaryLink href={changelogUrl}>Read full release notes →</PrimaryLink>

      {/* Features Section */}
      {features?.length > 0 ? (
        <Section
          style={{
            marginTop: 20,
            padding: "20px 22px",
            backgroundColor: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              margin: "0 0 14px",
              fontSize: 11,
              lineHeight: "16px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#55731d",
            }}
          >
            What’s New
          </Text>
          {features.map((feature, idx) => (
            <div
              key={feature.title || idx}
              style={{
                marginBottom: idx === features.length - 1 ? 0 : 14,
              }}
            >
              <Text style={{ margin: 0, fontSize: 14, lineHeight: "22px", color: INK }}>
                {feature.title ? (
                  <strong style={{ fontWeight: 650 }}>{feature.title}. </strong>
                ) : null}
                <span style={{ color: "#3a443d" }}>{feature.description}</span>
              </Text>
            </div>
          ))}
        </Section>
      ) : null}

      {/* Fixes & Polish Section */}
      {fixes?.length > 0 ? (
        <Section
          style={{
            marginTop: 18,
            padding: "18px 22px",
            backgroundColor: "#ffffff",
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              margin: "0 0 12px",
              fontSize: 11,
              lineHeight: "16px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            Improvements & Fixes
          </Text>
          {fixes.map((fix, idx) => (
            <div
              key={fix.title || idx}
              style={{
                marginBottom: idx === fixes.length - 1 ? 0 : 10,
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: "21px",
                  color: INK,
                }}
              >
                <span style={{ color: MUTED, marginRight: 6 }}>•</span>
                {fix.title ? <strong style={{ fontWeight: 600 }}>{fix.title}. </strong> : null}
                <span style={{ color: "#4b554e" }}>{fix.description}</span>
              </Text>
            </div>
          ))}
        </Section>
      ) : null}

      <Section style={{ paddingTop: 24 }}>
        <FallbackLink href={changelogUrl} />
      </Section>
    </EmailLayout>
  );
}

ChangelogReleaseEmail.PreviewProps = {
  version: "v0.11.0",
  date: "Nov 11, 2026",
  title: "Flexible API key management and zero-downtime rotation",
  summary:
    "Manage server credentials in a structured workspace table with modal generation and safe revocation warnings. Teams can now rotate active API keys without downtime, audit billing events, and follow direct guides for custom domains.",
  features: [
    {
      title: "Modal-based API key creation",
      description:
        "Generate API keys in a modal dialog with one-click secret copying and visibility toggles.",
    },
    {
      title: "Table view for API credentials",
      description:
        "Manage active workspace keys, waitlist bindings, creation dates, and expirations in a unified table.",
    },
    {
      title: "Billing activity in audit logs",
      description:
        "Track plan subscriptions, upgrades, and billing events directly in workspace audit logs.",
    },
  ],
  fixes: [
    {
      title: "Mobile waitlists table scrolling",
      description:
        "Fixed an issue where waitlists data tables did not scroll smoothly horizontally on mobile screens.",
    },
    {
      title: "Notification drawer polish",
      description:
        "Cleaned up Slack and Discord notification drawers and removed unnecessary status badges.",
    },
  ],
  changelogUrl: "https://waitlyze.com/docs/changelog#release-v0-11-0",
};

export default ChangelogReleaseEmail;
