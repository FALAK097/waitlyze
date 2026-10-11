import { publicFontClasses } from "@/lib/public-fonts";
import { AppShell } from "@/components/product/app-shell";
import { Avatar } from "@/components/product/avatar";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import prisma from "@/lib/prisma";
import "@/components/product/shell.css";

export const metadata = { robots: { index: false, follow: false }, title: { template: "%s | Waitlyze", default: "Waitlists | Waitlyze" } };

export default async function AppLayout({ children }) {
  const { user, workspace, workspaces } = await currentWorkspace();
  const waitlists = await prisma.waitList.findMany({
    where: campaignScope(user.id, "viewCampaign", workspace.id),
    select: { id: true, name: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 20,
  });
  return <div className={`product-ui product-shell ${publicFontClasses}`}>
    <AppShell user={{ name: user.name, email: user.email }} avatar={<Avatar id={user.id} src={user.image || user.imageUrl} size={32} />} waitlists={waitlists} workspaces={workspaces.map(item => ({ id: item.id, name: item.name }))} selectedWorkspace={workspace.id}>{children}</AppShell>
  </div>;
}
