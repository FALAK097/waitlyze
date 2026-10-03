import { currentWorkspace } from "@/lib/workspaces/current";
import { ProfileForm, WorkspaceNameForm, WorkspacePicker } from "@/components/product/settings-forms";
import { SignOutButton } from "@/components/product/account-controls";
import { ApiKeysClient } from "@/components/api-keys-client";
import prisma from "@/lib/prisma";
import { ResendIntegration } from "@/components/product/resend-integration";
import { SettingsSectionNavigation } from "@/components/product/settings-section-nav";
import { buttonVariants } from "@/components/product/button-variants";
export const metadata = { title: "Settings" };
export default async function SettingsPage() {
  const { user, workspace, workspaces } = await currentWorkspace();
  const connection = await prisma.workspaceIntegration.findUnique({ where: { workspaceId_provider: { workspaceId: workspace.id, provider: "RESEND" } }, select: { id: true, status: true, fromEmail: true, lastTestedAt: true, lastErrorCode: true } });
  const canManageIntegrations = ["OWNER", "ADMIN"].includes(workspace.members[0]?.role);
  const canManageWorkspace = canManageIntegrations;
  return <div><h1 className="product-page-title">Settings</h1><div className="product-settings-layout">
    <SettingsSectionNavigation />
    <div className="product-settings-sections"><section id="profile" className="product-settings-panel"><h2>Profile</h2><p className="product-help">Your account details and sign-in.</p><ProfileForm name={user.name} /><dl><dt>Email</dt><dd>{user.email}</dd></dl><p className="product-help">Your email is managed by your sign-in provider.</p><SignOutButton /></section>
    <section id="workspace" className="product-settings-panel"><h2>Workspace</h2><p className="product-help">A clear name makes the right workspace easy to spot.</p><WorkspaceNameForm workspaceId={workspace.id} name={workspace.name} canManage={canManageWorkspace} /><dl><dt>Your role</dt><dd>{workspace.members[0]?.role.toLowerCase()}</dd></dl><WorkspacePicker workspaces={workspaces} selected={workspace.id} /></section>
    <section id="integrations" className="product-settings-panel"><h2>Integrations</h2><p className="product-help">Connect the services your waitlists use. Credentials are encrypted and never returned after saving.</p><ResendIntegration initialConnection={connection} accountEmail={user.email} canManage={canManageIntegrations} /></section>
    <section id="developers" className="product-settings-panel"><h2>Developers</h2><p className="product-help">Create a waitlist-bound API key for signup integrations. Keys are shown once and can be revoked here.</p><ApiKeysClient /></section>
    <section id="privacy" className="product-settings-panel"><h2>Privacy &amp; data</h2><p className="product-help">Download a copy of your account, workspace access, campaign configuration, and safe integration metadata.</p><p className="product-help">Subscriber records are separate. Download them from each waitlist’s Subscribers page. Exports never include API keys, integration credentials, webhook signing secrets, or sign-in tokens.</p><a className={buttonVariants()} href="/api/settings/export" download>Download account data</a></section></div>
  </div></div>;
}
