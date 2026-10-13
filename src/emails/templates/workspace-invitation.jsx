import { EmailLayout, FallbackLink, Muted, Paragraph, PrimaryLink, DetailList } from "../layout";

export function WorkspaceInvitationEmail({ inviterName, workspaceName, role, url }) {
  return (
    <EmailLayout
      preview={`${inviterName} invited you to ${workspaceName} on Waitlyze`}
      heading="You’ve been invited"
      footer="If you weren’t expecting this invitation, you can safely ignore this email."
    >
      <Paragraph>
        <strong>{inviterName}</strong> invited you to join <strong>{workspaceName}</strong> on Waitlyze.
      </Paragraph>
      <DetailList
        items={[
          { label: "Workspace", value: workspaceName },
          { label: "Role", value: role },
          { label: "Expires", value: "In 7 days" },
        ]}
      />
      <PrimaryLink href={url}>Accept invitation</PrimaryLink>
      <Muted>This invitation link can only be used once and expires in seven days.</Muted>
      <FallbackLink href={url} />
    </EmailLayout>
  );
}

WorkspaceInvitationEmail.PreviewProps = {
  inviterName: "Falak Gala",
  workspaceName: "Acme Inc",
  role: "Admin",
  url: "https://waitlyze.falakgala.dev/accept-invitation/example-token",
};

export default WorkspaceInvitationEmail;
