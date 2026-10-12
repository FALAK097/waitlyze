import { Suspense } from "react";
import { currentWorkspace } from "@/lib/workspaces/current";
import { ProfileForm } from "@/components/product/settings-forms";
import prisma from "@/lib/prisma";
import { IntegrationsPanel } from "@/components/product/integrations-panel";
import { SettingsSectionNavigation } from "@/components/product/settings-section-nav";
import { TeamAccessSettings } from "@/components/product/team-access-settings";
import { AuditLog } from "@/components/product/audit-log";
import { DeleteWorkspace } from "@/components/product/delete-workspace";
import { SettingsPanelSkeleton } from "@/components/product/settings-panel-skeleton";
import { SettingsLoadError } from "@/components/product/settings-load-error";
import "@/components/product/settings-page.css";

export const metadata = { title: "Settings" };

async function SelectedSettings({ section, user, workspace, role }) {
  const canManage = ["OWNER", "ADMIN"].includes(role);
  if (section === "profile") return <section className="product-settings-content" aria-labelledby="settings-panel-heading">
    <header><h2 id="settings-panel-heading">Profile</h2><p>Your personal details.</p></header>
    <ProfileForm key={user.id} name={user.name} />
    <div className="product-settings-detail"><h3>Email address</h3><p>{user.email}</p><p className="product-help">Managed by your sign-in provider.</p></div>
  </section>;
  if (section === "team") {
    const results = await Promise.allSettled([
      prisma.workspaceMember.findMany({ where: { workspaceId: workspace.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }], select: { userId: true, role: true, createdAt: true, user: { select: { name: true, email: true, image: true, imageUrl: true } } } }),
      canManage ? prisma.workspaceInvitation.findMany({ where: { workspaceId: workspace.id, status: { in: ["PENDING", "SEND_FAILED"] }, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, emailNormalized: true, role: true, status: true, createdAt: true, expiresAt: true } }) : Promise.resolve([]),
    ]);
    return <section className="product-settings-content" aria-labelledby="settings-panel-heading">
      <header><h2 id="settings-panel-heading">Members</h2><p>People with access to {workspace.name}.</p></header>
      {results.every((result) => result.status === "fulfilled") ? <TeamAccessSettings workspaceId={workspace.id} members={results[0].value} invitations={results[1].value} canManage={canManage} canInviteAdmins={role === "OWNER"} secureInvitesConfigured={Boolean(process.env.WEBHOOK_SECRET_ENCRYPTION_KEY)} currentUserId={user.id} /> : <SettingsLoadError title="Members couldn’t load" message="Try again to see your workspace members and invitations." />}
    </section>;
  }
  if (section === "audit") {
    let events = [];
    try {
      events = await prisma.workspaceAuditEvent.findMany({
        where: { workspaceId: workspace.id },
        orderBy: [{ createdAt: "desc" }],
        take: 200,
        select: { id: true, action: true, resourceType: true, resourceId: true, resourceName: true, detail: true, createdAt: true, user: { select: { name: true, email: true } } },
      });
    } catch {
      return <SettingsLoadError title="Audit couldn’t load" message="Try again to see recent workspace activity." />;
    }
    return <section className="product-settings-content" aria-labelledby="settings-panel-heading">
      <header><h2 id="settings-panel-heading">Audit</h2><p>Every change in this workspace, newest first — who did it and what changed.</p></header>
      <AuditLog events={events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString(), userName: event.user?.name || null, userEmail: event.user?.email || null }))} />
    </section>;
  }
  if (section === "delete") {
    if (!canManage) return <SettingsLoadError title="Delete workspace" message="Only workspace owners and admins can delete this workspace." />;
    return <section className="product-settings-content" aria-labelledby="settings-panel-heading">
      <header><h2 id="settings-panel-heading">Delete workspace</h2><p>Permanently remove this workspace and everything in it.</p></header>
      <DeleteWorkspace workspaceId={workspace.id} workspaceName={workspace.name} isPersonal={Boolean(workspace.personalOwnerId)} />
    </section>;
  }
  let connection;
  try {
    connection = await prisma.workspaceIntegration.findUnique({ where: { workspaceId_provider: { workspaceId: workspace.id, provider: "RESEND" } }, select: { id: true, status: true, fromEmail: true, lastTestedAt: true, lastErrorCode: true } });
  } catch {
    return <SettingsLoadError title="Integrations couldn’t load" message="Try again to see your connected services." />;
  }
  return <section className="product-settings-content" aria-labelledby="settings-panel-heading">
    <IntegrationsPanel initialConnection={connection} accountEmail={user.email} canManage={canManage} />
  </section>;
}

export default async function SettingsPage({ searchParams }) {
  const [context, query] = await Promise.all([currentWorkspace(), searchParams]);
  const section = ["profile", "team", "integrations", "audit", "delete"].includes(query.section) ? query.section : "profile";
  return <div className="product-settings-page">
    <div className="product-settings-layout">
      <aside className="product-settings-menu"><h1 className="product-page-title">Settings</h1><SettingsSectionNavigation section={section} /></aside>
      <Suspense key={`${context.workspace.id}:${section}`} fallback={<SettingsPanelSkeleton />}>
        <SelectedSettings section={section} {...context} role={context.workspace.members[0]?.role} />
      </Suspense>
    </div>
  </div>;
}
