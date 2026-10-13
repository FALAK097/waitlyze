import { EmailLayout, Muted, Paragraph, PrimaryLink } from "../layout";

export function WelcomeEmail({ name, url }) {
  const greeting = name ? `Welcome aboard, ${name}.` : "Welcome aboard.";
  return (
    <EmailLayout
      preview="Your Waitlyze workspace is ready"
      heading={greeting}
      footer="You’re receiving this email because a Waitlyze account was created for this address."
    >
      <Paragraph>
        Waitlyze helps you publish a waitlist, collect signups, grow with referrals, and understand your audience before launch.
      </Paragraph>
      <Paragraph>Start by creating your first waitlist — design the page, preview it on any screen, and publish when it’s ready.</Paragraph>
      <PrimaryLink href={url}>Create your first waitlist</PrimaryLink>
      <Muted>You can invite teammates and connect your own email sender later from Settings.</Muted>
    </EmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Falak",
  url: "https://waitlyze.falakgala.dev/waitlists/new",
};

export default WelcomeEmail;
