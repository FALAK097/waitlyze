import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { buttonVariants } from "@/components/ui/button";
import { ProductContentSkeleton } from "@/components/product/content-skeleton";
import { WaitlistRowActions } from "@/components/product/waitlist-row-actions";
import styles from "@/components/product/waitlist-experience.module.css";
import { SortableHeading, StatusTabs, WaitlistSearch } from "@/components/product/waitlists-toolbar";
import {
  normalizeWaitlistSearch,
  normalizeWaitlistStatus,
  normalizeWaitlistSort,
  waitlistSearchWhere,
  waitlistStatusWhere,
  waitlistSortOrderBy,
  waitlistsHref,
  WAITLIST_STATUS_FILTERS,
} from "@/lib/waitlist-search.mjs";

export const metadata = { title: "Waitlists" };

const PAGE_SIZE = 25;
const WAITLIST_DATE_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function WaitlistsTable({ waitlists, query, status, sort }) {
  return (
    <div className={`product-table-wrap ${styles.tableWrap}`}>
      <Table className={`product-waitlist-table ${styles.table}`}>
        <caption className="product-visually-hidden">Your waitlists</caption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Name</TableHead>
            <TableHead scope="col">Visitors</TableHead>
            <SortableHeading column="subscribers" label="Subscribers" query={query} status={status} sort={sort} />
            <TableHead scope="col">Conversion</TableHead>
            <TableHead scope="col">Updated</TableHead>
            <TableHead scope="col"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {waitlists.map((waitlist) => {
            const visitors = waitlist._count.impressions;
            const signups = waitlist._count.signUps;
            const conversion = visitors > 0 ? `${((signups / visitors) * 100).toFixed(1)}%` : "—";
            return (
              <TableRow key={waitlist.id}>
                <TableHead scope="row">
                  <Link prefetch={false} href={`/waitlists/${waitlist.id}`} aria-label={`Open ${waitlist.name || "Untitled waitlist"}`}>
                    <span>{waitlist.name || "Untitled waitlist"}</span>
                  </Link>
                  {waitlist.description && <p className={styles.rowDescription}>{waitlist.description}</p>}
                </TableHead>
                <TableCell>{visitors.toLocaleString()}</TableCell>
                <TableCell>{signups.toLocaleString()}</TableCell>
                <TableCell>{conversion}</TableCell>
                <TableCell><time dateTime={waitlist.updatedAt.toISOString()}>{WAITLIST_DATE_FORMAT.format(waitlist.updatedAt)}</time></TableCell>
                <TableCell><WaitlistRowActions id={waitlist.id} name={waitlist.name} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function WaitlistsEmptyState({ query, status, sort, hasFilters }) {
  if (!hasFilters) {
    return <div className={`product-empty ${styles.empty}`}><h2>Your next launch starts here.</h2><p>Create a waitlist to collect subscribers and learn who's interested.</p><Link prefetch={false} href="/waitlists/new" className={buttonVariants()}>Create your first waitlist</Link></div>;
  }

  const selectedFilter = WAITLIST_STATUS_FILTERS.find((filter) => filter.value === status) || WAITLIST_STATUS_FILTERS[0];
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

  return <div className={`product-empty ${styles.empty}`}><h2>{title}</h2><p>{description}</p><Link prefetch={false} href={clearHref}>{clearLabel}</Link></div>;
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
      select: { id: true, name: true, description: true, status: true, updatedAt: true, _count: { select: { signUps: true, impressions: true } } },
      orderBy: waitlistSortOrderBy(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
  } catch (error) {
    console.error("Waitlists query failed", error?.code || error?.name || "unknown error");
    return <div className="product-empty" role="alert"><h2>Waitlists couldn’t load</h2><p>Your workspace is safe. Try loading this page again.</p><a href={waitlistsHref({ query, status, sort })}>Try again</a></div>;
  }
  const hasFilters = !!query || !!status;
  const resultsAnnouncement = `${total} ${total === 1 ? "waitlist" : "waitlists"}${query ? ` matching “${query}”` : ""}`;
  return waitlists.length
    ? <><p className="sr-only" aria-live="polite">{resultsAnnouncement}</p><WaitlistsTable waitlists={waitlists} query={query} status={status} sort={sort} />{pageCount > 1 && <nav className={styles.pagination} aria-label="Waitlist pages">{page === 1 ? <span aria-disabled="true">Previous</span> : <Link prefetch={false} href={waitlistsHref({ query, status, sort, page: page - 1 })}>Previous</Link>}<span>Page {page} of {pageCount}</span>{page === pageCount ? <span aria-disabled="true">Next</span> : <Link prefetch={false} href={waitlistsHref({ query, status, sort, page: page + 1 })}>Next</Link>}</nav>}</>
    : <WaitlistsEmptyState query={query} status={status} sort={sort} hasFilters={hasFilters} />;
}

export default async function WaitlistsPage({ searchParams }) {
  const [{ user, workspace }, params] = await Promise.all([currentWorkspace(), searchParams]);
  const query = normalizeWaitlistSearch(params?.q);
  const status = normalizeWaitlistStatus(params?.status);
  const sort = normalizeWaitlistSort(params?.sort);
  const requestedPage = typeof params?.page === "string" && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  return (
    <section aria-label="Waitlists">
      <div className={styles.listToolbar}>
        <StatusTabs query={query} status={status} sort={sort} />
        <WaitlistSearch query={query} status={status} sort={sort} />
        <Link prefetch={false} href="/waitlists/new" className={buttonVariants()}><HugeiconsIcon icon={Add01Icon} aria-hidden="true" />New waitlist</Link>
      </div>
      <Suspense fallback={<ProductContentSkeleton label="Loading waitlists" variant="table" rows={5} />}>
        <WaitlistsResults userId={user.id} workspaceId={workspace.id} query={query} status={status} sort={sort} requestedPage={requestedPage} />
      </Suspense>
    </section>
  );
}
