import { DetailList, EmailLayout, FallbackLink, Muted, Paragraph, PrimaryLink } from "../layout";

export function BroadcastSummaryEmail({ waitlistName, subject, status, delivered, failed, skipped, canceled, url }) {
  const failedTotal = failed + canceled;
  const heading = status === "SENT" ? (delivered === 1 ? "Your broadcast landed." : `Your broadcast reached ${delivered.toLocaleString("en-US")} people.`) : status === "CANCELED" ? "Broadcast canceled." : "Broadcast needs attention.";
  return (
    <EmailLayout
      preview={`“${subject}” finished sending to ${waitlistName}.`}
      heading={heading}
      footer="You’re receiving this because you send email from a Waitlyze workspace."
    >
      <Paragraph>
        {status === "SENT" && failedTotal === 0
          ? `Every opted-in subscriber on ${waitlistName} was accepted by the sender. Nothing else to do here.`
          : status === "SENT"
            ? `Most of “${subject}” went out. The addresses below were skipped or rejected — they won’t be retried.`
            : status === "CANCELED"
              ? `You stopped “${subject}” before it finished. Recipients already accepted by the sender may still receive it.`
              : `“${subject}” stopped before it could finish. Open the report to see which recipients failed and why.`}
      </Paragraph>
      <DetailList items={[
        { label: "Delivered", value: `${delivered.toLocaleString("en-US")} accepted` },
        { label: "Skipped", value: `${skipped.toLocaleString("en-US")}` },
        { label: "Failed", value: `${failedTotal.toLocaleString("en-US")}` },
      ]} />
      <PrimaryLink href={url}>Open broadcast report</PrimaryLink>
      <Muted>“Delivered” means the email service accepted the message. Inbox placement depends on the recipient’s provider.</Muted>
      <FallbackLink href={url} />
    </EmailLayout>
  );
}

BroadcastSummaryEmail.PreviewProps = { waitlistName: "The next launch", subject: "We’re opening early access", status: "SENT", delivered: 128, failed: 2, skipped: 4, canceled: 0, url: "https://waitlyze.falakgala.dev/waitlists/demo/emails/broadcasts" };
export default BroadcastSummaryEmail;
