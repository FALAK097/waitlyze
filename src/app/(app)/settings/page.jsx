import { Suspense } from "react";

import { AuditLog } from "@/components/product/audit-log";
import { DeleteWorkspace } from "@/components/product/delete-workspace";
import { IntegrationsPanel } from "@/components/product/integrations-panel";
import { LeaveWorkspace } from "@/components/product/leave-workspace";
import { ProfileForm, WorkspaceNameForm } from "@/components/product/settings-forms";
import { SettingsLoadError } from "@/components/product/settings-load-error";
import { SettingsPanelSkeleton } from "@/components/product/settings-panel-skeleton";
import { SettingsSectionNavigation } from "@/components/product/settings-section-nav";
import { TeamAccessSettings } from "@/components/product/team-access-settings";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";

export const metadata = { title: "Settings" };

async function SelectedSettings({ section, user, workspace, role }) {
  const canManage = ["OWNER", "ADMIN"].includes(role);
  if (section === "profile")
    return (
      <section className="max-w-190 min-w-0 flex-1" aria-labelledby="settings-panel-heading">
        <header className="mb-9 max-[760px]:mb-6">
          <h2 id="settings-panel-heading" className="mb-1.5!">
            Profile
          </h2>
          <p className="text-product-text-secondary">Your personal details.</p>
        </header>
        <ProfileForm key={user.id} name={user.name} />
        <div className="my-9">
          <h3 className="mb-2! text-sm! font-medium!">Email address</h3>
          <p className="mb-1.5! wrap-anywhere">{user.email}</p>
          <p className="mb-1.5! text-sm leading-relaxed wrap-anywhere text-product-text-secondary">
            Managed by your sign-in provider.
          </p>
        </div>
      </section>
    );
  if (section === "team") {
    const results = await Promise.allSettled([
      prisma.workspaceMember.findMany({
        where: { workspaceId: workspace.id },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: {
          userId: true,
          role: true,
          createdAt: true,
          user: { select: { name: true, email: true, image: true, imageUrl: true } },
        },
      }),
      canManage
        ? prisma.workspaceInvitation.findMany({
            where: {
              workspaceId: workspace.id,
              status: { in: ["PENDING", "SEND_FAILED"] },
              expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
            select: {
              id: true,
              emailNormalized: true,
              role: true,
              status: true,
              createdAt: true,
              expiresAt: true,
            },
          })
        : Promise.resolve([]),
    ]);
    return (
      <section className="max-w-190 min-w-0 flex-1" aria-labelledby="settings-panel-heading">
        <header className="mb-9 max-[760px]:mb-6">
          <h2 id="settings-panel-heading" className="mb-1.5!">
            Members
          </h2>
          <p className="text-product-text-secondary">People with access to {workspace.name}.</p>
        </header>
        {results.every((result) => result.status === "fulfilled") ? (
          <TeamAccessSettings
            workspaceId={workspace.id}
            members={results[0].value}
            invitations={results[1].value}
            canManage={canManage}
            canInviteAdmins={role === "OWNER"}
            secureInvitesConfigured={Boolean(process.env.WEBHOOK_SECRET_ENCRYPTION_KEY)}
            currentUserId={user.id}
            isPersonalWorkspace={Boolean(workspace.personalOwnerId)}
          />
        ) : (
          <SettingsLoadError
            title="Members couldn’t load"
            message="Try again to see your workspace members and invitations."
          />
        )}
      </section>
    );
  }
  if (section === "audit") {
    let events = [];
    try {
      events = await prisma.workspaceAuditEvent.findMany({
        where: { workspaceId: workspace.id },
        orderBy: [{ createdAt: "desc" }],
        take: 200,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          resourceName: true,
          detail: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      });
    } catch {
      return (
        <SettingsLoadError
          title="Audit couldn’t load"
          message="Try again to see recent workspace activity."
        />
      );
    }
    return (
      <section className="max-w-190 min-w-0 flex-1" aria-labelledby="settings-panel-heading">
        <AuditLog
          events={events.map((event) => ({
            ...event,
            createdAt: event.createdAt.toISOString(),
            userName: event.user?.name || null,
            userEmail: event.user?.email || null,
          }))}
        />
      </section>
    );
  }
  if (section === "workspace") {
    const isOwner = role === "OWNER";
    return (
      <section className="max-w-190 min-w-0 flex-1" aria-labelledby="settings-panel-heading">
        <header className="mb-9 max-[760px]:mb-6">
          <h2 id="settings-panel-heading" className="mb-1.5!">
            Workspace
          </h2>
          <p className="text-product-text-secondary">
            Rename or {isOwner ? "delete" : "leave"} {workspace.name}.
          </p>
        </header>
        <WorkspaceNameForm
          key={`workspace-name:${workspace.id}`}
          workspaceId={workspace.id}
          name={workspace.name}
          canManage={canManage}
        />
        {isOwner ? (
          <DeleteWorkspace
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            isPersonal={Boolean(workspace.personalOwnerId)}
          />
        ) : (
          <LeaveWorkspace workspaceId={workspace.id} workspaceName={workspace.name} />
        )}
      </section>
    );
  }
  let connection;
  try {
    connection = await prisma.workspaceIntegration.findUnique({
      where: { workspaceId_provider: { workspaceId: workspace.id, provider: "RESEND" } },
      select: {
        id: true,
        workspaceId: true,
        status: true,
        fromEmail: true,
        lastTestedAt: true,
        lastErrorCode: true,
        webhookSecretCiphertext: true,
      },
    });
  } catch {
    return (
      <SettingsLoadError
        title="Integrations couldn’t load"
        message="Try again to see your connected services."
      />
    );
  }
  return (
    <section className="max-w-190 min-w-0 flex-1" aria-labelledby="settings-panel-heading">
      <IntegrationsPanel
        initialConnection={
          connection && {
            id: connection.id,
            workspaceId: connection.workspaceId,
            status: connection.status,
            fromEmail: connection.fromEmail,
            lastTestedAt: connection.lastTestedAt,
            lastErrorCode: connection.lastErrorCode,
            webhookConfigured: Boolean(connection.webhookSecretCiphertext),
          }
        }
        accountEmail={user.email}
        canManage={canManage}
        appOrigin={env.BETTER_AUTH_URL}
      />
    </section>
  );
}

export default async function SettingsPage({ searchParams }) {
  const [context, query] = await Promise.all([currentWorkspace(), searchParams]);
  const section = ["profile", "workspace", "team", "integrations", "audit"].includes(query.section)
    ? query.section
    : "profile";
  return (
    <div className="mx-auto w-full max-w-280">
      <div className="flex items-start gap-8 max-[760px]:flex-col max-[760px]:gap-8 lg:gap-12 xl:gap-18">
        <aside className="sticky top-6 w-52.5 min-w-0 shrink-0 max-[760px]:static max-[760px]:w-full">
          <h1 className="mt-0! mb-7.5! text-xl! max-[760px]:mb-4!">Settings</h1>
          <SettingsSectionNavigation section={section} />
        </aside>
        <Suspense key={`${context.workspace.id}:${section}`} fallback={<SettingsPanelSkeleton />}>
          <SelectedSettings
            section={section}
            {...context}
            role={context.workspace.members[0]?.role}
          />
        </Suspense>
      </div>
    </div>
  );
}
