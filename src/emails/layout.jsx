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

export const INK = "#00160d";
export const MUTED = "#5d6b60";
export const ACCENT = "#c6fe1e";
export const BORDER = "#e5eae4";
export const SURFACE = "#f7f9f5";

const fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";

function Wordmark() {
  return (
    <Text style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.035em", color: INK }}>
      waitlyze<span style={{ color: "#749e14" }}>.</span>
    </Text>
  );
}

export function EmailLayout({ preview, heading, children, footer }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: "44px 20px", backgroundColor: "#ffffff", fontFamily, color: INK }}>
        <Container style={{ maxWidth: 560, margin: "0 auto" }}>
          <Section style={{ paddingBottom: 52 }}>
            <Wordmark />
          </Section>
          <Section>
            {heading ? <Heading style={{ margin: "0 0 20px", fontSize: 29, lineHeight: "36px", letterSpacing: "-0.035em", fontWeight: 650, color: INK }}>{heading}</Heading> : null}
            {children}
          </Section>
          <Section style={{ paddingTop: 44 }}>
            <Hr style={{ borderColor: BORDER, margin: "0 0 20px" }} />
            <Text style={{ margin: 0, fontSize: 12, lineHeight: "20px", color: MUTED }}>
              {footer || "You’re receiving this email because of activity on your Waitlyze workspace."}
            </Text>
            <Text style={{ margin: "12px 0 0", fontSize: 12, color: MUTED }}><Link href="https://waitlyze.falakgala.dev" style={{ color: MUTED, textDecoration: "underline" }}>Waitlyze</Link> · Build an audience before you launch.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function Paragraph({ children }) {
  return <Text style={{ margin: "0 0 17px", fontSize: 15, lineHeight: "25px", color: INK }}>{children}</Text>;
}

export function Muted({ children }) {
  return <Text style={{ margin: "20px 0 0", fontSize: 13, lineHeight: "21px", color: MUTED }}>{children}</Text>;
}

export function PrimaryLink({ href, children }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: ACCENT,
        color: INK,
        fontSize: 15,
        fontWeight: 700,
        textDecoration: "none",
        padding: "13px 21px",
        borderRadius: 6,
      }}
    >
      {children}
    </Link>
  );
}

export function DetailList({ items }) {
  return (
    <Section style={{ backgroundColor: SURFACE, borderRadius: 6, padding: "16px 18px", marginBottom: 24 }}>
      {items.map(({ label, value }, index) => (
        <Text key={label} style={{ margin: index === 0 ? 0 : "10px 0 0", fontSize: 13, lineHeight: "20px", color: MUTED }}>
          <span style={{ display: "inline-block", minWidth: 72, color: MUTED }}>{label}</span>
          <span style={{ fontWeight: 600, color: INK }}>{value}</span>
        </Text>
      ))}
    </Section>
  );
}

export function FallbackLink({ href }) {
  return (
    <Text style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: MUTED, wordBreak: "break-all" }}>
      Or paste this link into your browser: <Link href={href} style={{ color: MUTED }}>{href}</Link>
    </Text>
  );
}
