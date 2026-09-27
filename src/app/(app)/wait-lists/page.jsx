import Link from "next/link";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { WorkspacePicker } from "@/components/product/settings-forms";
import { buttonVariants } from "@/components/product/button-variants";
export const metadata = { title: "Waitlists" };
export default async function WaitlistsPage() {
  const { user, workspace, workspaces } = await currentWorkspace();
  const waitlists = await prisma.waitList.findMany({ where: campaignScope(user.id, "viewCampaign", workspace.id), select: { id: true, name: true, description: true, _count: { select: { signUps: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }] });
  return <section><div className="product-page-heading"><div><h1 className="product-page-title">Waitlists</h1><p className="product-help">A home for your next launch.</p></div><Link href="/wait-lists/new" className={buttonVariants()}>New waitlist</Link></div><WorkspacePicker workspaces={workspaces} selected={workspace.id} />
    {waitlists.length ? <div className="product-table-wrap"><table className="product-waitlist-table"><caption className="product-visually-hidden">Your waitlists</caption><thead><tr><th scope="col">Waitlist</th><th scope="col">Subscribers</th><th scope="col"><span className="product-visually-hidden">Open waitlist</span></th></tr></thead><tbody>{waitlists.map((waitlist) => <tr key={waitlist.id}><th scope="row"><Link href={`/wait-lists/${waitlist.id}`}>{waitlist.name || "Untitled waitlist"}</Link>{waitlist.description && <p>{waitlist.description}</p>}</th><td>{waitlist._count.signUps.toLocaleString()}</td><td><Link href={`/wait-lists/${waitlist.id}`} aria-label={`Open ${waitlist.name || "Untitled waitlist"}`}>Open<span aria-hidden="true"> ↗</span></Link></td></tr>)}</tbody></table></div> : <div className="product-empty"><h2>Your next launch starts here.</h2><p>Create a waitlist to collect subscribers and learn who's interested.</p></div>}
  </section>;
}
