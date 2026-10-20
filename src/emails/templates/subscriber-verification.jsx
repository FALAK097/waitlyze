import { EmailLayout, FallbackLink, Paragraph, PrimaryLink } from "../layout";

export function SubscriberVerificationEmail({ waitlistName, url }) {
  return (
    <EmailLayout
      brandName={waitlistName}
      preview={`Confirm your address to secure your place on ${waitlistName}.`}
      heading="One quick step."
      footer={`This message was sent on behalf of ${waitlistName}. If you didn’t request a place, you can safely ignore it.`}
    >
      <Paragraph>Confirm your email address to secure your place on <strong>{waitlistName}</strong>. Your confirmation link is valid for 24 hours.</Paragraph>
      <PrimaryLink href={url}>Confirm my place</PrimaryLink>
      <FallbackLink href={url} />
    </EmailLayout>
  );
}

SubscriberVerificationEmail.PreviewProps = { waitlistName: "The next launch", url: "https://waitlyze.falakgala.dev/verify/example" };
export default SubscriberVerificationEmail;
