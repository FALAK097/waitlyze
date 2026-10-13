import { render } from "@react-email/render";
import { WorkspaceInvitationEmail } from "./templates/workspace-invitation";
import { WelcomeEmail } from "./templates/welcome";

export async function renderWorkspaceInvitation({ inviterName, workspaceName, role, url }) {
  return render(<WorkspaceInvitationEmail inviterName={inviterName} workspaceName={workspaceName} role={role} url={url} />);
}

export async function renderWelcomeEmail({ name, url }) {
  return render(<WelcomeEmail name={name} url={url} />);
}
