import { DetailList, EmailLayout, FallbackLink, Muted, Paragraph, PrimaryLink } from "../layout";

export function SignupMilestoneEmail({ waitlistName, count, url, showReferrals = true }) {
  const first = count === 1;
  const nextMilestone = count < 10 ? 10 : count < 100 ? 100 : count < 1000 ? 1000 : null;
  const heading = first
    ? "Your first signup is in."
    : `${count.toLocaleString("en-US")} signups on ${waitlistName}.`;
  return (
    <EmailLayout
      preview={
        first
          ? `${waitlistName} just got its first signup.`
          : `${count} people have joined ${waitlistName}.`
      }
      heading={heading}
      footer="You’re receiving this because you own a workspace on Waitlyze."
    >
      <Paragraph>
        {first
          ? `${waitlistName} has its first sign of interest. They’re confirming their address now and will appear in your subscriber list once they do.`
          : showReferrals
            ? `${waitlistName} is gathering momentum. Every subscriber has a personal referral link, making it easy for your early audience to bring in the next wave.`
            : `${waitlistName} is gathering momentum. Keep sharing your page to bring in the next wave.`}
      </Paragraph>
      <DetailList
        items={[
          { label: "Waitlist", value: waitlistName },
          {
            label: "Milestone",
            value: first ? "First signup" : `${count.toLocaleString("en-US")} signups`,
          },
          {
            label: "Next up",
            value: nextMilestone
              ? `${nextMilestone.toLocaleString("en-US")} signups`
              : "Keep growing",
          },
        ]}
      />
      <PrimaryLink href={url}>
        {first ? "See your subscribers" : "Open the subscribers list"}
      </PrimaryLink>
      <Muted>
        {first
          ? showReferrals
            ? "Share your page to get there — your thank-you screen makes it easy for the first people to invite others."
            : "Share your page to get there — invite more people to discover your launch."
          : nextMilestone
            ? `You’ll hear from us again at ${nextMilestone.toLocaleString("en-US")} signups.`
            : "Thanks for building with us — keep sharing your page."}
      </Muted>
      <FallbackLink href={url} />
    </EmailLayout>
  );
}

SignupMilestoneEmail.PreviewProps = {
  waitlistName: "The next launch",
  count: 1,
  url: "https://waitlyze.falakgala.dev/waitlists/demo/subscribers",
};
export default SignupMilestoneEmail;
