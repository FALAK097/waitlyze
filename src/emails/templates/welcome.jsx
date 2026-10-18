import { EmailLayout, Muted, Paragraph, PrimaryLink } from "../layout";

export function WelcomeEmail({ name, url }) {
  const greeting = name ? `Welcome to Waitlyze, ${name}.` : "Welcome to Waitlyze.";
  return (
    <EmailLayout
      preview="Your Waitlyze workspace is ready"
      heading={greeting}
      footer="You’re receiving this email because a Waitlyze account was created for this address."
    >
      <Paragraph>Your space to turn early interest into an audience is ready.</Paragraph>
      <Paragraph>Create a page, invite people to join, and give each signup a reason to share. You can preview everything before you publish.</Paragraph>
      <PrimaryLink href={url}>Create a waitlist</PrimaryLink>
      <Muted>Questions? Reply to this email. We’re here to help you get the first version live.</Muted>
    </EmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Falak",
  url: "https://waitlyze.falakgala.dev/waitlists/new",
};

export default WelcomeEmail;
