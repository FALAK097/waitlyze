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

function Wordmark({ label = "waitlyze" }) {
  return (
    <Text style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.035em", color: INK }}>
      {label === "waitlyze" ? <>waitlyze<span style={{ color: "#749e14" }}>.</span></> : label}
    </Text>
  );
}

export function EmailLayout({ preview, heading, children, footer, brandName = "waitlyze" }) {
  const isPlatformBrand = brandName === "waitlyze";
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: "44px 20px", backgroundColor: "#ffffff", fontFamily, color: INK }}>
        <Container style={{ maxWidth: 560, margin: "0 auto" }}>
          <Section style={{ paddingBottom: 42, borderBottom: `1px solid ${BORDER}` }}>
            <Wordmark label={brandName} />
          </Section>
          <Section style={{ paddingTop: 36 }}>
            {heading ? <Heading style={{ margin: "0 0 18px", fontSize: 30, lineHeight: "38px", letterSpacing: "-0.04em", fontWeight: 650, color: INK }}>{heading}</Heading> : null}
            {children}
          </Section>
          <Section style={{ paddingTop: 44 }}>
            <Hr style={{ borderColor: BORDER, margin: "0 0 20px" }} />
            <Text style={{ margin: 0, fontSize: 12, lineHeight: "20px", color: MUTED }}>
              {footer || `You’re receiving this email because of activity on ${isPlatformBrand ? "your Waitlyze workspace" : brandName}.`}
            </Text>
            {isPlatformBrand ? (
              <Text style={{ margin: "12px 0 0", fontSize: 12, color: MUTED }}><Link href="https://waitlyze.falakgala.dev" style={{ color: MUTED, textDecoration: "underline" }}>Waitlyze</Link> · Build an audience before you launch.</Text>
            ) : null}
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
    <Section style={{ padding: "4px 0 26px" }}>
      <Link
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: ACCENT,
          color: INK,
          fontSize: 14,
          lineHeight: "20px",
          fontWeight: 700,
          textDecoration: "none",
          padding: "13px 21px",
          borderRadius: 6,
        }}
      >
        {children}
      </Link>
    </Section>
  );
}

export function NextSteps({ items }) {
  return (
    <Section style={{ paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
      <Text style={{ margin: "0 0 18px", fontSize: 12, lineHeight: "18px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>
        A good place to start
      </Text>
      {items.map(({ title, description }, index) => (
        <Text key={title} style={{ margin: index === items.length - 1 ? 0 : "0 0 16px", fontSize: 14, lineHeight: "22px", color: INK }}>
          <span style={{ display: "inline-block", width: 26, color: "#55731d", fontWeight: 700 }}>{String(index + 1).padStart(2, "0")}</span>
          <strong>{title}</strong><br />
          <span style={{ display: "inline-block", paddingLeft: 26, color: MUTED }}>{description}</span>
        </Text>
      ))}
    </Section>
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
