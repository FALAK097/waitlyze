import { currentWorkspace } from "@/lib/workspaces/current";
import { ProfileForm, WorkspacePicker } from "@/components/product/settings-forms";
import { SignOutButton } from "@/components/product/account-controls";
export const metadata = { title: "Settings" };
export default async function SettingsPage() {
  const { user, workspace, workspaces } = await currentWorkspace();
  return <div><h1 className="product-page-title">Settings</h1><div className="product-settings-layout">
    <nav aria-label="Settings sections" className="product-settings-index product-settings-desktop"><a href="#profile">Profile</a><a href="#workspace">Workspace</a></nav>
    <div className="product-settings-sections"><details className="product-settings-mobile"><summary>Settings sections</summary><nav aria-label="Settings sections"><a href="#profile">Profile</a><a href="#workspace">Workspace</a></nav></details><section id="profile" className="product-settings-panel"><h2>Profile</h2><p className="product-help">Your account details and sign-in.</p><ProfileForm name={user.name} /><dl><dt>Email</dt><dd>{user.email}</dd></dl><p className="product-help">Your email is managed by your sign-in provider.</p><SignOutButton /></section>
    <section id="workspace" className="product-settings-panel"><h2>Workspace</h2><dl><dt>Name</dt><dd>{workspace.name}</dd><dt>Your role</dt><dd>{workspace.members[0]?.role.toLowerCase()}</dd></dl><WorkspacePicker workspaces={workspaces} selected={workspace.id} /></section></div>
  </div></div>;
}
