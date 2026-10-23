import { Avatar as DiceBearAvatar, Style } from "@dicebear/core";
import shapes from "@dicebear/styles/shapes.json" with { type: "json" };

import { AppShell } from "@/components/product/app-shell";
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
    src || new DiceBearAvatar(diceBearStyle, { seed: String(id), size: 32 }).toDataUri();
  return (
    <Avatar>
      <AvatarImage src={source} alt="" />
      <AvatarFallback>{(name || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

export default async function AppLayout({ children }) {
  const { user, workspace, workspaces } = await currentWorkspace();
  return (
    <div className={`product-ui min-h-dvh bg-product-bg-page ${publicFontClasses}`}>
      <AppShell
        user={{ name: user.name, email: user.email }}
        avatar={<AccountAvatar id={user.id} src={user.image || user.imageUrl} name={user.name} />}
        workspaces={workspaces.map((item) => ({ id: item.id, name: item.name }))}
        selectedWorkspace={workspace.id}
      >
        {children}
      </AppShell>
    </div>
  );
}
