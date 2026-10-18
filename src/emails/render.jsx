import { render } from "@react-email/render";
import { WorkspaceInvitationEmail } from "./templates/workspace-invitation";
import { WelcomeEmail } from "./templates/welcome";
import { FeedbackEmail } from "./templates/feedback";

/** Renders a workspace invitation for delivery through the platform sender. */
export async function renderWorkspaceInvitation({ inviterName, workspaceName, role, url }) {
  return render(<WorkspaceInvitationEmail inviterName={inviterName} workspaceName={workspaceName} role={role} url={url} />);
}

/** Renders the account welcome email for delivery through the platform sender. */
export async function renderWelcomeEmail({ name, url }) {
  return render(<WelcomeEmail name={name} url={url} />);
}

/** Renders a feedback notification email for the Waitlyze team inbox. */
export async function renderFeedbackEmail(props) {
  return render(<FeedbackEmail {...props} />);
}
