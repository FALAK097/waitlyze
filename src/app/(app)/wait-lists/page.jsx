import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { WorkspacePicker } from "@/components/product/settings-forms";
import { buttonVariants } from "@/components/product/button-variants";
import { ProductContentSkeleton } from "@/components/product/content-skeleton";
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
const WAITLIST_DATE_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const WAITLIST_STATUS_LABELS = { DRAFT: "Draft", PUBLISHED: "Published", PAUSED: "Paused" };

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
          </tr>
        </thead>
        <tbody>
          {waitlists.map((waitlist) => (
            <tr key={waitlist.id}>
              <th scope="row">
                <Link href={`/wait-lists/${waitlist.id}`} aria-label={`Open ${waitlist.name || "Untitled waitlist"}, status ${WAITLIST_STATUS_LABELS[waitlist.status]}`}>
                  <span>{waitlist.name || "Untitled waitlist"}</span>{" "}
                  <span className={styles.status} data-status={waitlist.status}>{WAITLIST_STATUS_LABELS[waitlist.status]}</span>
                </Link>
                {waitlist.description && <p>{waitlist.description}</p>}
              </th>
              <td>{waitlist._count.signUps.toLocaleString()}</td>
              <td><time dateTime={waitlist.updatedAt.toISOString()}>{WAITLIST_DATE_FORMAT.format(waitlist.updatedAt)}</time></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WaitlistsEmptyState({ query, status, sort, hasFilters }) {
  if (!hasFilters) {
    return <div className="product-empty"><h2>Your next launch starts here.</h2><p>Create a waitlist to collect subscribers and learn who's interested.</p><Link href="/wait-lists/new" className={buttonVariants()}>Create your first waitlist</Link></div>;
  }

  const selectedFilter = WAITLIST_STATUS_FILTERS.find((filter) => filter.value === status);
  const title = query ? "No waitlists found" : `No ${selectedFilter.label.toLowerCase()} waitlists`;
  const description = query
    ? status
      ? `Try another name, or clear your search to see all ${selectedFilter.label.toLowerCase()} waitlists.`
      : "Try another name or clear your search."
    : `There aren't any ${selectedFilter.label.toLowerCase()} waitlists in this workspace yet.`;
  const clearHref = query
    ? waitlistsHref({ query, status, sort, includeQuery: false })
    : waitlistsHref({ query, status: null, sort });
  const clearLabel = query
    ? status
      ? `Show ${selectedFilter.label.toLowerCase()} waitlists`
      : "Show all waitlists"
    : "View all waitlists";

  return <div className="product-empty"><h2>{title}</h2><p>{description}</p><Link href={clearHref}>{clearLabel}</Link></div>;
}

async function WaitlistsResults({ userId, workspaceId, query, status, sort, requestedPage }) {
  let total;
  let page;
  let pageCount;
  let waitlists;
  try {
    const where = {
      ...campaignScope(userId, "viewCampaign", workspaceId),
      ...waitlistSearchWhere(query),
      ...waitlistStatusWhere(status),
    };
    total = await prisma.waitList.count({ where });
    pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    page = Math.min(Math.max(1, requestedPage), pageCount);
    waitlists = await prisma.waitList.findMany({
      where,
      select: { id: true, name: true, description: true, status: true, updatedAt: true, _count: { select: { signUps: true } } },
      orderBy: waitlistSortOrderBy(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
  } catch (error) {
    console.error("Waitlists query failed", error?.code || error?.name || "unknown error");
    return <div className="product-empty" role="alert"><h2>Waitlists couldn’t load</h2><p>Your workspace is safe. Try loading this page again.</p><a href={waitlistsHref({ query, status, sort })}>Try again</a></div>;
  }
  const hasFilters = !!query || !!status;
  return waitlists.length
    ? <><p className={styles.resultsMeta} aria-live="polite"><span>Showing {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + waitlists.length} of {total} {total === 1 ? "waitlist" : "waitlists"}</span><span>Sorted by {sort.startsWith("subscribers") ? "subscribers" : "name"} · {sort.endsWith("asc") ? "ascending" : "descending"}</span></p><WaitlistsTable waitlists={waitlists} query={query} status={status} sort={sort} />{pageCount > 1 && <nav className={styles.pagination} aria-label="Waitlist pages">{page === 1 ? <span aria-disabled="true">Previous</span> : <Link href={waitlistsHref({ query, status, sort, page: page - 1 })}>Previous</Link>}<span>Page {page} of {pageCount}</span>{page === pageCount ? <span aria-disabled="true">Next</span> : <Link href={waitlistsHref({ query, status, sort, page: page + 1 })}>Next</Link>}</nav>}</>
    : <WaitlistsEmptyState query={query} status={status} sort={sort} hasFilters={hasFilters} />;
}

export default async function WaitlistsPage({ searchParams }) {
  const { user, workspace, workspaces } = await currentWorkspace();
  const params = await searchParams;
  const query = normalizeWaitlistSearch(params?.q);
  const status = normalizeWaitlistStatus(params?.status);
  const sort = normalizeWaitlistSort(params?.sort);
  const requestedPage = typeof params?.page === "string" && /^\d+$/.test(params.page) ? Number(params.page) : 1;
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
      <Suspense fallback={<ProductContentSkeleton label="Loading waitlists" variant="table" rows={5} />}>
        <WaitlistsResults userId={user.id} workspaceId={workspace.id} query={query} status={status} sort={sort} requestedPage={requestedPage} />
      </Suspense>
    </section>
  );
}
