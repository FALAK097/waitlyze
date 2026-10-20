import { EmailLayout, Muted, NextSteps, Paragraph, PrimaryLink } from "../layout";

export function WelcomeEmail({ name, url }) {
  const greeting = name ? `Welcome, ${name}.` : "Welcome to Waitlyze.";
  return (
    <EmailLayout
      preview="Your first waitlist is ready to take shape."
      heading={greeting}
      footer="You’re receiving this email because a Waitlyze account was created for this address."
    >
      <Paragraph>
        Your next idea deserves an audience. Waitlyze gives you a simple page to collect early
        interest and turn every signup into an invitation to share.
      </Paragraph>
      <PrimaryLink href={url}>Create your first waitlist</PrimaryLink>
      <NextSteps
        items={[
          { title: "Shape your page", description: "Add your launch details and make it yours." },
          {
            title: "Invite your first people",
            description: "Share one link wherever your community is.",
          },
          {
            title: "Let interest grow",
            description: "Give new subscribers a personal link to pass along.",
          },
        ]}
      />
      <Muted>Questions as you get started? Reply to this email — we’re happy to help.</Muted>
    </EmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Falak",
  url: "https://waitlyze.falakgala.dev/waitlists/new",
};

export default WelcomeEmail;
