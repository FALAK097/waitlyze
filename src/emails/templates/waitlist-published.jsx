import { EmailLayout, FallbackLink, Muted, NextSteps, Paragraph, PrimaryLink } from "../layout";

export function WaitlistPublishedEmail({ waitlistName, pageUrl, dashboardUrl }) {
  return (
    <EmailLayout
      preview={`${waitlistName} is live — share your page.`}
      heading="You’re live."
      footer="You’re receiving this because you own a workspace on Waitlyze."
    >
      <Paragraph>
        <strong>{waitlistName}</strong> is published and ready to collect signups. Share the link
        below wherever your community is — every join feeds your referral loop.
      </Paragraph>
      <PrimaryLink href={pageUrl}>Open your live page</PrimaryLink>
      <NextSteps
        items={[
          {
            title: "Share your link",
            description: "Post it where your early audience already hangs out.",
          },
          {
            title: "Watch the first signups land",
            description: "We’ll email you when the first person joins.",
          },
          {
            title: "Keep the loop warm",
            description: "Broadcasts and automations turn interest into momentum.",
          },
        ]}
      />
      <Muted>Manage this waitlist anytime from your dashboard: {dashboardUrl}</Muted>
      <FallbackLink href={pageUrl} />
    </EmailLayout>
  );
}

WaitlistPublishedEmail.PreviewProps = {
  waitlistName: "The next launch",
  pageUrl: "https://waitlyze.falakgala.dev/w/the-next-launch",
  dashboardUrl: "https://waitlyze.falakgala.dev/waitlists/demo",
};

export default WaitlistPublishedEmail;
