import { Avatar as DiceBearAvatar, Style } from "@dicebear/core";
import shapes from "@dicebear/styles/shapes.json" with { type: "json" };
import { Suspense } from "react";

import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { AppShell, AppShellControls } from "@/components/product/app-shell";
import { ProductContentSkeleton } from "@/components/product/content-skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getOwnedWorkspaceEntitlements, getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import { PostHogUserSync } from "@/lib/posthog/user-sync";
import prisma from "@/lib/prisma";
import { publicFontClasses } from "@/lib/public-fonts";
import { currentWorkspace } from "@/lib/workspaces/current";
import { ReactQueryProvider } from "@/providers/query";

export const metadata = {
  robots: { index: false, follow: false },
  title: { template: "%s | Waitlyze", default: "Waitlists | Waitlyze" },
};

const diceBearStyle = new Style(shapes);

// Server-rendered account avatar: photo when available, otherwise a
// deterministic generated image. Pass an opaque ID, never an email address.
function AccountAvatar({ id, src, name }) {
  const source =
    src || new DiceBearAvatar(diceBearStyle, { seed: String(id), size: 24 }).toDataUri();
  return (
    <Avatar size="sm">
      <AvatarImage src={source} alt="" />
      <AvatarFallback>{(name || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

async function AppShellControlsData() {
  const { user, workspace, workspaces } = await currentWorkspace();
  const [entitlements, ownedEntitlements, memberCount] = await Promise.all([
    getWorkspaceEntitlements(prisma, workspace.id),
    getOwnedWorkspaceEntitlements(prisma, user.id),
    prisma.workspaceMember.count({ where: { workspaceId: workspace.id } }),
  ]);
  const canManageBilling = workspace.members?.[0]?.role === "OWNER";
  return (
    <>
      <PostHogUserSync
        userId={user.id}
        plan={entitlements.plan}
        role={workspace.members?.[0]?.role || "MEMBER"}
        workspaceId={workspace.id}
        memberCount={memberCount}
      />
      <AppShellControls
        workspaces={workspaces.map((item) => ({ id: item.id, name: item.name }))}
        selectedWorkspace={workspace.id}
        user={{ name: user.name, email: user.email }}
        avatar={<AccountAvatar id={user.id} src={user.image || user.imageUrl} name={user.name} />}
        plan={entitlements.plan}
        canManageBilling={canManageBilling}
        canCreateWorkspace={
          ownedEntitlements.workspaces === null ||
          ownedEntitlements.ownedCount < ownedEntitlements.workspaces
        }
        workspaceId={workspace.id}
      />
    </>
  );
}

function AppShellControlsFallback() {
  return (
    <>
      <div
        className="order-1 h-11 w-44 rounded-lg bg-product-bg-inset motion-safe:animate-pulse"
        aria-hidden="true"
      />
      <div
        className="order-3 ms-auto size-11 rounded-full bg-product-bg-inset motion-safe:animate-pulse max-md:order-2"
        aria-hidden="true"
      />
    </>
  );
}

export default async function AppLayout({ children }) {
  const { user } = await currentWorkspace();
  const onboarding = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isOnboarded: true },
  });

  return (
    <div className={`product-ui min-h-dvh bg-product-bg-page ${publicFontClasses}`}>
      <OnboardingProvider initialOpen={!onboarding?.isOnboarded} userName={user.name}>
        <ReactQueryProvider>
          <AppShell
            headerControls={
              <Suspense fallback={<AppShellControlsFallback />}>
                <AppShellControlsData />
              </Suspense>
            }
          >
            <Suspense
              fallback={
                <section className="product-ui" aria-label="Loading waitlists">
                  <ProductContentSkeleton label="Loading waitlists" variant="table" />
                </section>
              }
            >
              {children}
            </Suspense>
          </AppShell>
        </ReactQueryProvider>
      </OnboardingProvider>
    </div>
  );
}
