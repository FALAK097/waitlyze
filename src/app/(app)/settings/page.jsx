import { Suspense } from "react";
import { currentWorkspace } from "@/lib/workspaces/current";
import { ProfileForm, WorkspaceNameForm, WorkspacePicker } from "@/components/product/settings-forms";
import { SignOutButton } from "@/components/product/account-controls";
import { ApiKeysClient } from "@/components/api-keys-client";
import prisma from "@/lib/prisma";
import { ResendIntegration } from "@/components/product/resend-integration";
import { SettingsSectionNavigation } from "@/components/product/settings-section-nav";
import { buttonVariants } from "@/components/product/button-variants";
import { TeamAccessSettings } from "@/components/product/team-access-settings";
import { ProductContentSkeleton } from "@/components/product/content-skeleton";
import { SettingsLoadError } from "@/components/product/settings-load-error";
import "@/components/product/settings-page.css";

export const metadata = { title: "Settings" };

async function SettingsSections({ settingsPromise, user, workspace, workspaces, role, canManageIntegrations, canManageWorkspace }) {
  const [connectionResult, membersResult, invitationsResult] = await settingsPromise;
  const connection = connectionResult.status === "fulfilled" ? connectionResult.value : null;
  const members = membersResult.status === "fulfilled" ? membersResult.value : null;
  const invitations = invitationsResult.status === "fulfilled" ? invitationsResult.value : null;
  return <div className="product-settings-sections">
        <section className="product-settings-group" aria-labelledby="settings-account-heading">
          <div className="product-settings-group-heading">
            <h2 id="settings-account-heading">Account</h2>
            <p>Your personal profile and sign-in.</p>
          </div>
          <section id="profile" className="product-settings-panel" aria-labelledby="settings-profile-heading">
            <h3 id="settings-profile-heading">Profile</h3>
            <p className="product-help">Your account details and sign-in.</p>
            <ProfileForm name={user.name} />
            <dl><dt>Email</dt><dd>{user.email}</dd></dl>
            <p className="product-help">Your email is managed by your sign-in provider.</p>
            <SignOutButton />
          </section>
        </section>

        <section className="product-settings-group" aria-labelledby="settings-workspace-heading">
          <div className="product-settings-group-heading">
            <h2 id="settings-workspace-heading">Workspace</h2>
            <p>Choose a workspace and manage the people who can access it.</p>
          </div>
          <section id="workspace" className="product-settings-panel" aria-labelledby="settings-workspace-name-heading">
            <h3 id="settings-workspace-name-heading">Workspace details</h3>
            <p className="product-help">A clear name makes the right workspace easy to spot.</p>
            <WorkspaceNameForm workspaceId={workspace.id} name={workspace.name} canManage={canManageWorkspace} />
            <dl><dt>Your role</dt><dd>{workspace.members[0]?.role.toLowerCase()}</dd></dl>
            <WorkspacePicker workspaces={workspaces} selected={workspace.id} />
          </section>
          <section id="team" className="product-settings-panel" aria-labelledby="settings-team-heading">
            <h3 id="settings-team-heading">Team access</h3>
            <p className="product-help">Manage who can work in {workspace.name}.</p>
            {members && invitations ? <TeamAccessSettings
              workspaceId={workspace.id}
              members={members}
              invitations={invitations}
              canManage={canManageWorkspace}
              canInviteAdmins={role === "OWNER"}
              secureInvitesConfigured={Boolean(process.env.WEBHOOK_SECRET_ENCRYPTION_KEY)}
            /> : <SettingsLoadError title="Team access couldn’t load" message="Your profile, workspace details, and other settings are still available." />}
          </section>
        </section>

        <section className="product-settings-group" aria-labelledby="settings-connections-heading">
          <div className="product-settings-group-heading">
            <h2 id="settings-connections-heading">Connections</h2>
            <p>Set up services used to send waitlist updates.</p>
          </div>
          <section id="integrations" className="product-settings-panel" aria-labelledby="settings-integrations-heading">
            <h3 id="settings-integrations-heading">Integrations</h3>
            <p className="product-help">Connect the services your waitlists use. Credentials are encrypted and never returned after saving.</p>
            {connectionResult.status === "fulfilled"
              ? <ResendIntegration initialConnection={connection} accountEmail={user.email} canManage={canManageIntegrations} />
              : <SettingsLoadError title="Integrations couldn’t load" message="Your profile and workspace settings are still available." />}
          </section>
        </section>

        <section className="product-settings-group product-settings-group-advanced" aria-labelledby="settings-developer-group-heading">
          <div className="product-settings-group-heading">
            <p className="product-settings-group-kicker">Advanced</p>
            <h2 id="settings-developer-group-heading">Developer</h2>
            <p>Credentials for connecting your waitlists to other systems.</p>
          </div>
          <section id="developers" className="product-settings-panel" aria-labelledby="settings-developers-heading">
            <h3 id="settings-developers-heading">Developers</h3>
            <p className="product-help">Create a waitlist-bound API key for signup integrations. Keys are shown once and can be revoked here.</p>
            <ApiKeysClient />
          </section>
        </section>

        <section className="product-settings-group product-settings-group-advanced" aria-labelledby="settings-data-group-heading">
          <div className="product-settings-group-heading">
            <p className="product-settings-group-kicker">Advanced</p>
            <h2 id="settings-data-group-heading">Data &amp; privacy</h2>
            <p>Download a copy of your account data and understand what it includes.</p>
          </div>
          <section id="privacy" className="product-settings-panel" aria-labelledby="settings-privacy-heading">
            <h3 id="settings-privacy-heading">Privacy &amp; data</h3>
            <p className="product-help">Download a copy of your account, workspace access, campaign configuration, and safe integration metadata.</p>
            <p className="product-help">Subscriber records are separate. Download them from each waitlist’s Subscribers page. Exports never include API keys, integration credentials, webhook signing secrets, or sign-in tokens.</p>
            <a className={buttonVariants()} href="/api/settings/export" download>Download account data</a>
          </section>
        </section>
  </div>;
}

export default async function SettingsPage() {
  const { user, workspace, workspaces } = await currentWorkspace();
  const role = workspace.members[0]?.role;
  const canManageIntegrations = ["OWNER", "ADMIN"].includes(role);
  const canManageWorkspace = canManageIntegrations;
  const settingsPromise = Promise.allSettled([
    prisma.workspaceIntegration.findUnique({
      where: { workspaceId_provider: { workspaceId: workspace.id, provider: "RESEND" } },
      select: { id: true, status: true, fromEmail: true, lastTestedAt: true, lastErrorCode: true },
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: { userId: true, role: true, user: { select: { name: true, email: true, image: true, imageUrl: true } } },
    }),
    canManageWorkspace
      ? prisma.workspaceInvitation.findMany({
          where: { workspaceId: workspace.id, status: { in: ["PENDING", "SEND_FAILED"] }, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, emailNormalized: true, role: true, status: true, createdAt: true, expiresAt: true },
        })
      : Promise.resolve([]),
  ]);

  return <div className="product-settings-page">
    <header className="product-settings-heading">
      <p className="product-settings-eyebrow">Preferences and access</p>
      <h1 className="product-page-title">Settings</h1>
      <p className="product-settings-intro">Manage your account, workspace, connections, and data in one place.</p>
    </header>

    <div className="product-settings-layout">
      <SettingsSectionNavigation />
      <Suspense fallback={<ProductContentSkeleton label="Loading settings" variant="settings" />}>
        <SettingsSections settingsPromise={settingsPromise} user={user} workspace={workspace} workspaces={workspaces} role={role} canManageIntegrations={canManageIntegrations} canManageWorkspace={canManageWorkspace} />
      </Suspense>
    </div>
  </div>;
}
