import { EmailLayout, FallbackLink, Muted, Paragraph, PrimaryLink } from "../layout";

export function SignupMilestoneEmail({ waitlistName, count, url }) {
  const first = count === 1;
  const heading = first ? "Your first signup is in." : `${count.toLocaleString("en-US")} signups on ${waitlistName}.`;
  return (
    <EmailLayout
      preview={first ? `${waitlistName} just got its first signup.` : `${count} people have joined ${waitlistName}.`}
      heading={heading}
      footer="You’re receiving this because you own a workspace on Waitlyze."
    >
      <Paragraph>
        {first
          ? `${waitlistName} has a name and an email to prove it. They’re confirming their address now, and they’ll appear in your subscribers list once they do.`
          : `${waitlistName} keeps moving. Every subscriber has a personal referral link, so the people who joined can bring the next wave.`}
      </Paragraph>
      <PrimaryLink href={url}>{first ? "See your subscribers" : "Open the subscribers list"}</PrimaryLink>
      <Muted>
        {first
          ? "Next milestone: 10 signups. Share your page to get there — your thank-you screen does the referring."
          : "You’ll hear from us again at 100 and 1,000 signups."}
      </Muted>
      <FallbackLink href={url} />
    </EmailLayout>
  );
}

SignupMilestoneEmail.PreviewProps = { waitlistName: "The next launch", count: 1, url: "https://waitlyze.falakgala.dev/waitlists/demo/subscribers" };
export default SignupMilestoneEmail;
