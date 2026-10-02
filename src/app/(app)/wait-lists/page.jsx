import Link from "next/link";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { WorkspacePicker } from "@/components/product/settings-forms";
import { buttonVariants } from "@/components/product/button-variants";
import { normalizeWaitlistSearch, normalizeWaitlistStatus, waitlistSearchWhere, waitlistStatusWhere, WAITLIST_SEARCH_LIMIT, WAITLIST_STATUS_FILTERS } from "@/lib/waitlist-search.mjs";
export const metadata = { title: "Waitlists" };
export default async function WaitlistsPage({ searchParams }) {
  const { user, workspace, workspaces } = await currentWorkspace();
  const params = await searchParams;
  const query = normalizeWaitlistSearch(params?.q);
  const status = normalizeWaitlistStatus(params?.status);
  const waitlists = await prisma.waitList.findMany({ where: { ...campaignScope(user.id, "viewCampaign", workspace.id), ...waitlistSearchWhere(query), ...waitlistStatusWhere(status) }, select: { id: true, name: true, description: true, status: true, _count: { select: { signUps: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }] });
  const selectedFilter = WAITLIST_STATUS_FILTERS.find((filter) => filter.value === status);
  function listHref(nextStatus, includeQuery = true) {
    const search = new URLSearchParams();
    if (includeQuery && query) search.set("q", query);
    if (nextStatus) search.set("status", nextStatus);
    const serialized = search.toString();
    return serialized ? `/wait-lists?${serialized}` : "/wait-lists";
  }
  const hasFilters = !!query || !!status;
  return <section><div className="product-page-heading"><div><h1 className="product-page-title">Waitlists</h1><p className="product-help">A home for your next launch.</p></div><Link href="/wait-lists/new" className={buttonVariants()}>New waitlist</Link></div><WorkspacePicker workspaces={workspaces} selected={workspace.id} />
    <form className="product-waitlist-search" role="search" action="/wait-lists" method="get"><label htmlFor="waitlist-search">Search waitlists</label><input id="waitlist-search" name="q" type="search" maxLength={WAITLIST_SEARCH_LIMIT} defaultValue={query} placeholder="Search by name" />{status && <input type="hidden" name="status" value={status} />}<button type="submit">Search</button>{query && <Link href={listHref(status, false)}>Clear search</Link>}</form>
    <nav className="product-waitlist-filters" aria-label="Filter waitlists by status">{WAITLIST_STATUS_FILTERS.map((filter) => <Link key={filter.value || "all"} href={listHref(filter.value)} aria-current={status === filter.value ? "page" : undefined}>{filter.label}</Link>)}</nav>
    {waitlists.length ? <div className="product-table-wrap"><table className="product-waitlist-table"><caption className="product-visually-hidden">Your waitlists</caption><thead><tr><th scope="col">Waitlist</th><th scope="col">Subscribers</th><th scope="col"><span className="product-visually-hidden">Open waitlist</span></th></tr></thead><tbody>{waitlists.map((waitlist) => <tr key={waitlist.id}><th scope="row"><Link href={`/wait-lists/${waitlist.id}`}>{waitlist.name || "Untitled waitlist"}</Link><span className="product-waitlist-status">{({ DRAFT: "Draft", PUBLISHED: "Published", PAUSED: "Paused" })[waitlist.status]}</span>{waitlist.description && <p>{waitlist.description}</p>}</th><td>{waitlist._count.signUps.toLocaleString()}</td><td><Link href={`/wait-lists/${waitlist.id}`} aria-label={`Open ${waitlist.name || "Untitled waitlist"}`}>Open<span aria-hidden="true"> →</span></Link></td></tr>)}</tbody></table></div> : hasFilters ? <div className="product-empty"><h2>{query ? "No waitlists found" : `No ${selectedFilter.label.toLowerCase()} waitlists`}</h2><p>{query ? "Try another name or clear your search." : `There aren't any ${selectedFilter.label.toLowerCase()} waitlists in this workspace yet.`}</p><Link href="/wait-lists">Clear filters</Link></div> : <div className="product-empty"><h2>Your next launch starts here.</h2><p>Create a waitlist to collect subscribers and learn who's interested.</p></div>}
  </section>;
}
