import { render } from "@react-email/render";
import { WorkspaceInvitationEmail } from "./templates/workspace-invitation";
import { WelcomeEmail } from "./templates/welcome";
import { SubscriberVerificationEmail } from "./templates/subscriber-verification";
import { SignupMilestoneEmail } from "./templates/signup-milestone";
import { BroadcastSummaryEmail } from "./templates/broadcast-summary";

export async function renderWorkspaceInvitation({ inviterName, workspaceName, role, url }) {
  return render(<WorkspaceInvitationEmail inviterName={inviterName} workspaceName={workspaceName} role={role} url={url} />);
}

export async function renderWelcomeEmail({ name, url }) {
  return render(<WelcomeEmail name={name} url={url} />);
}

export async function renderSubscriberVerification({ waitlistName, url }) {
  return render(<SubscriberVerificationEmail waitlistName={waitlistName} url={url} />);
}

export async function renderSignupMilestone({ waitlistName, count, url }) {
  return render(<SignupMilestoneEmail waitlistName={waitlistName} count={count} url={url} />);
}

export async function renderBroadcastSummary({ waitlistName, subject, status, delivered, failed, skipped, canceled, url }) {
  return render(<BroadcastSummaryEmail waitlistName={waitlistName} subject={subject} status={status} delivered={delivered} failed={failed} skipped={skipped} canceled={canceled} url={url} />);
}
