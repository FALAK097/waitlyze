import { Avatar as DiceBearAvatar, Style } from "@dicebear/core";
import shapes from "@dicebear/styles/shapes.json" with { type: "json" };
import { Suspense } from "react";

import { AppShell, AppShellControls } from "@/components/product/app-shell";
import { ProductContentSkeleton } from "@/components/product/content-skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { publicFontClasses } from "@/lib/public-fonts";
import { currentWorkspace } from "@/lib/workspaces/current";

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
  return (
    <AppShellControls
      workspaces={workspaces.map((item) => ({ id: item.id, name: item.name }))}
      selectedWorkspace={workspace.id}
      user={{ name: user.name, email: user.email }}
      avatar={<AccountAvatar id={user.id} src={user.image || user.imageUrl} name={user.name} />}
    />
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

export default function AppLayout({ children }) {
  return (
    <div className={`product-ui min-h-dvh bg-product-bg-page ${publicFontClasses}`}>
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
    </div>
  );
}
