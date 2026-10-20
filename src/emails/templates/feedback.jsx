import { Img, Text } from "@react-email/components";

import { DetailList, EmailLayout, INK, Muted } from "../layout";

/** Internal email containing the feedback, submitter context, and optional screenshot. */
export function FeedbackEmail({
  name,
  email,
  title,
  label,
  feedback,
  page,
  submittedAt,
  hasImage,
}) {
  const items = [
    { label: "From", value: `${name} (${email})` },
    { label: "Type", value: label },
    { label: "Title", value: title },
    ...(page ? [{ label: "Page", value: page }] : []),
    { label: "Sent", value: submittedAt },
  ];

  return (
    <EmailLayout
      preview={`New Waitlyze feedback: ${title}`}
      heading={`Feedback from ${name}`}
      footer="Sent from the Waitlyze app feedback form."
    >
      <DetailList items={items} />
      <Text
        style={{
          margin: "0 0 14px",
          fontSize: 15,
          lineHeight: "24px",
          color: INK,
          whiteSpace: "pre-wrap",
        }}
      >
        {feedback}
      </Text>
      {hasImage ? <Muted>A screenshot is attached to this email.</Muted> : null}
      {hasImage ? (
        <Img src="cid:feedback-screenshot" alt="Feedback screenshot attachment" width="480" />
      ) : null}
    </EmailLayout>
  );
}

FeedbackEmail.PreviewProps = {
  name: "Falak",
  email: "falak@example.com",
  title: "Add bulk signup import",
  label: "Idea",
  feedback:
    "It would be useful to import a CSV of early subscribers.\n\nThis would help teams migrate from another waitlist tool.",
  page: "/waitlists",
  submittedAt: "Oct 18, 2026, 2:30 PM",
  hasImage: false,
};

export default FeedbackEmail;
