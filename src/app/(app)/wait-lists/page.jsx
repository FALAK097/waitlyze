import Link from "next/link";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { WorkspacePicker } from "@/components/product/settings-forms";
import { buttonVariants } from "@/components/product/button-variants";
import styles from "@/components/product/waitlist-experience.module.css";
import {
  normalizeWaitlistSearch,
  normalizeWaitlistStatus,
  normalizeWaitlistSort,
  waitlistSearchWhere,
  waitlistStatusWhere,
  waitlistSortOrderBy,
  WAITLIST_SEARCH_LIMIT,
  WAITLIST_STATUS_FILTERS,
  WAITLIST_DEFAULT_SORT,
} from "@/lib/waitlist-search.mjs";

export const metadata = { title: "Waitlists" };

const PAGE_SIZE = 25;

function waitlistsHref({ query, status, sort, page = 1, includeQuery = true }) {
  const search = new URLSearchParams();
  if (includeQuery && query) search.set("q", query);
  if (status) search.set("status", status);
  if (sort !== WAITLIST_DEFAULT_SORT) search.set("sort", sort);
  if (page > 1) search.set("page", String(page));
  const serialized = search.toString();
  return serialized ? `/wait-lists?${serialized}` : "/wait-lists";
}

function SortableHeading({ column, label, query, status, sort }) {
  const [activeColumn, direction] = sort.split("-");
  const active = activeColumn === column;
  const nextDirection = active && direction === "asc" ? "desc" : "asc";
  const initialDirection = column === "subscribers" ? "desc" : "asc";
  const nextSort = `${column}-${active ? nextDirection : initialDirection}`;
  const sortLabel = direction === "asc" ? "ascending" : "descending";
  const ariaSort = active ? sortLabel : "none";
  const accessibleColumn = column === "subscribers" ? "subscriber count" : "waitlist name";
  const accessibleName = `Sort by ${accessibleColumn}${active ? `, currently ${sortLabel}` : ""}`;

  return (
    <th scope="col" aria-sort={active ? ariaSort : undefined}>
      <Link
        className="product-table-sort"
        href={waitlistsHref({ query, status, sort: nextSort })}
        aria-label={accessibleName}
      >
        <span>{label}</span>
        <span className={`product-table-sort-indicator${active ? " is-active" : ""}`} aria-hidden="true">
          {active ? (direction === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </Link>
    </th>
  );
}

function WaitlistsTable({ waitlists, query, status, sort }) {
  return (
    <div className="product-table-wrap">
      <table className={`product-waitlist-table ${styles.table}`}>
        <caption className="product-visually-hidden">Your waitlists</caption>
        <thead>
          <tr>
            <SortableHeading column="name" label="Waitlist" query={query} status={status} sort={sort} />
            <SortableHeading column="subscribers" label="Subscribers" query={query} status={status} sort={sort} />
            <th scope="col">Updated</th>
            <th scope="col"><span className="product-visually-hidden">Open waitlist</span></th>
          </tr>
        </thead>
        <tbody>
          {waitlists.map((waitlist) => (
            <tr key={waitlist.id}>
              <th scope="row">
                <Link href={`/wait-lists/${waitlist.id}`} aria-label={`Open ${waitlist.name || "Untitled waitlist"}`}>
                  <span>{waitlist.name || "Untitled waitlist"}</span>{" "}
                  <span className={styles.status} data-status={waitlist.status}>{({ DRAFT: "Draft", PUBLISHED: "Published", PAUSED: "Paused" })[waitlist.status]}</span>
                </Link>
                {waitlist.description && <p>{waitlist.description}</p>}
              </th>
              <td>{waitlist._count.signUps.toLocaleString()}</td>
              <td><time dateTime={waitlist.updatedAt.toISOString()}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(waitlist.updatedAt)}</time></td>
              <td>
                <Link href={`/wait-lists/${waitlist.id}`} aria-label={`Open ${waitlist.name || "Untitled waitlist"}`}>
                  Open<span aria-hidden="true"> →</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WaitlistsEmptyState({ query, status, hasFilters }) {
  if (!hasFilters) {
    return <div className="product-empty"><h2>Your next launch starts here.</h2><p>Create a waitlist to collect subscribers and learn who's interested.</p></div>;
  }

  const selectedFilter = WAITLIST_STATUS_FILTERS.find((filter) => filter.value === status);
  const title = query ? "No waitlists found" : `No ${selectedFilter.label.toLowerCase()} waitlists`;
  const description = query
    ? "Try another name or clear your search."
    : `There aren't any ${selectedFilter.label.toLowerCase()} waitlists in this workspace yet.`;

  return <div className="product-empty"><h2>{title}</h2><p>{description}</p><Link href="/wait-lists">Clear filters</Link></div>;
}

export default async function WaitlistsPage({ searchParams }) {
  const { user, workspace, workspaces } = await currentWorkspace();
  const params = await searchParams;
  const query = normalizeWaitlistSearch(params?.q);
  const status = normalizeWaitlistStatus(params?.status);
  const sort = normalizeWaitlistSort(params?.sort);
  const where = {
    ...campaignScope(user.id, "viewCampaign", workspace.id),
    ...waitlistSearchWhere(query),
    ...waitlistStatusWhere(status),
  };
  const total = await prisma.waitList.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = typeof params?.page === "string" && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const waitlists = await prisma.waitList.findMany({
    where,
    select: { id: true, name: true, description: true, status: true, updatedAt: true, _count: { select: { signUps: true } } },
    orderBy: waitlistSortOrderBy(sort),
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  const hasFilters = !!query || !!status;

  return (
    <section>
      <div className={`product-page-heading ${styles.listHeader}`}>
        <div><p className={styles.eyebrow}>Workspace</p><h1 className={`product-page-title ${styles.listTitle}`}>Waitlists</h1><p className={`product-help ${styles.listIntro}`}>Create, publish, and learn from your launch pages.</p></div>
        <Link href="/wait-lists/new" className={buttonVariants()}>New waitlist</Link>
      </div>
      <WorkspacePicker workspaces={workspaces} selected={workspace.id} />
      <div className={styles.listToolbar}>
      <form className="product-waitlist-search" role="search" action="/wait-lists" method="get">
        <label htmlFor="waitlist-search">Search waitlists</label>
        <input id="waitlist-search" name="q" type="search" maxLength={WAITLIST_SEARCH_LIMIT} defaultValue={query} placeholder="Search by name" />
        {status && <input type="hidden" name="status" value={status} />}
        {sort !== WAITLIST_DEFAULT_SORT && <input type="hidden" name="sort" value={sort} />}
        <button type="submit">Search</button>
        {query && <Link href={waitlistsHref({ query, status, sort, includeQuery: false })}>Clear search</Link>}
      </form>
      <nav className="product-waitlist-filters" aria-label="Filter waitlists by status">
        {WAITLIST_STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.value || "all"}
            href={waitlistsHref({ query, status: filter.value, sort })}
            aria-current={status === filter.value ? "page" : undefined}
          >
            {filter.label}
          </Link>
        ))}
      </nav>
      </div>
      {waitlists.length
        ? <><p className={styles.resultsMeta} aria-live="polite"><span>Showing {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + waitlists.length} of {total} {total === 1 ? "waitlist" : "waitlists"}</span><span>Sorted by {sort.startsWith("subscribers") ? "subscribers" : "name"} · {sort.endsWith("asc") ? "ascending" : "descending"}</span></p><WaitlistsTable waitlists={waitlists} query={query} status={status} sort={sort} />{pageCount > 1 && <nav className={styles.pagination} aria-label="Waitlist pages"><Link href={waitlistsHref({ query, status, sort, page: Math.max(1, page - 1) })} aria-disabled={page === 1} tabIndex={page === 1 ? -1 : undefined}>Previous</Link><span>Page {page} of {pageCount}</span><Link href={waitlistsHref({ query, status, sort, page: Math.min(pageCount, page + 1) })} aria-disabled={page === pageCount} tabIndex={page === pageCount ? -1 : undefined}>Next</Link></nav>}</>
        : <WaitlistsEmptyState query={query} status={status} hasFilters={hasFilters} />}
    </section>
  );
}
