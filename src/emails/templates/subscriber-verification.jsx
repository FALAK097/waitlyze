import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components";

export function SubscriberVerificationEmail({ waitlistName, url }) {
  return <Html lang="en"><Head /><Preview>Confirm your address to secure your place on {waitlistName}.</Preview>
    <Body style={{ backgroundColor: "#ffffff", color: "#17261b", fontFamily: "Arial, Helvetica, sans-serif", margin: 0, padding: "44px 20px" }}>
      <Container style={{ maxWidth: 560, margin: "0 auto" }}>
        <Text style={{ fontSize: 14, fontWeight: 700, margin: "0 0 48px" }}>{waitlistName}</Text>
        <Heading style={{ fontSize: 29, letterSpacing: "-0.03em", lineHeight: "36px", fontWeight: 700, margin: "0 0 16px" }}>One quick step.</Heading>
        <Text style={{ fontSize: 15, lineHeight: "25px", margin: "0 0 28px" }}>Confirm your email to secure your place on {waitlistName}. This link expires in 24 hours.</Text>
        <Section><Link href={url} style={{ display: "inline-block", padding: "13px 21px", backgroundColor: "#c6fe1e", color: "#17261b", textDecoration: "none", borderRadius: 6, fontSize: 15, fontWeight: 700 }}>Confirm my place</Link></Section>
        <Text style={{ margin: "30px 0 0", fontSize: 12, lineHeight: "20px", color: "#617267" }}>If you didn’t request this, you can ignore it. This message was sent on behalf of {waitlistName}.</Text>
        <Text style={{ margin: "18px 0 0", fontSize: 12, lineHeight: "20px", color: "#617267", wordBreak: "break-all" }}>Button not working? <Link href={url} style={{ color: "#365f3b" }}>Open the confirmation link</Link>.</Text>
      </Container>
    </Body>
  </Html>;
}

SubscriberVerificationEmail.PreviewProps = { waitlistName: "The next launch", url: "https://waitlyze.falakgala.dev/verify/example" };
export default SubscriberVerificationEmail;
