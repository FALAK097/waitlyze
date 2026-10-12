import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductContentSkeleton } from "@/components/product/content-skeleton";
import styles from "@/components/product/waitlist-experience.module.css";
import { SortableHeading, StatusTabs, WaitlistSearch, waitlistsHref } from "@/components/product/waitlists-toolbar";
import {
  normalizeWaitlistSearch,
  normalizeWaitlistStatus,
  normalizeWaitlistSort,
  waitlistSearchWhere,
  waitlistStatusWhere,
  waitlistSortOrderBy,
  WAITLIST_STATUS_FILTERS,
} from "@/lib/waitlist-search.mjs";

export const metadata = { title: "Waitlists" };

const PAGE_SIZE = 25;
const WAITLIST_DATE_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const WAITLIST_STATUS_LABELS = { DRAFT: "Draft", PUBLISHED: "Published", PAUSED: "Paused" };

function WaitlistsTable({ waitlists, query, status, sort }) {
  return (
    <div className={`product-table-wrap ${styles.tableWrap}`}>
      <Table className={`product-waitlist-table ${styles.table}`}>
        <caption className="product-visually-hidden">Your waitlists</caption>
        <TableHeader>
          <TableRow>
            <SortableHeading column="name" label="Name" query={query} status={status} sort={sort} />
            <SortableHeading column="subscribers" label="Subscribers" query={query} status={status} sort={sort} />
            <TableHead scope="col">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {waitlists.map((waitlist) => (
            <TableRow key={waitlist.id}>
              <TableHead scope="row">
                <Link href={`/wait-lists/${waitlist.id}`} aria-label={`Open ${waitlist.name || "Untitled waitlist"}, status ${WAITLIST_STATUS_LABELS[waitlist.status]}`}>
                  <span>{waitlist.name || "Untitled waitlist"}</span>{" "}
                  <span className={styles.status} data-status={waitlist.status}>{WAITLIST_STATUS_LABELS[waitlist.status]}</span>
                </Link>
                {waitlist.description && <p className={styles.rowDescription}>{waitlist.description}</p>}<time className={styles.mobileDate} dateTime={waitlist.updatedAt.toISOString()}>Updated {WAITLIST_DATE_FORMAT.format(waitlist.updatedAt)}</time>
              </TableHead>
              <TableCell>{waitlist._count.signUps.toLocaleString()}</TableCell>
              <TableCell><time dateTime={waitlist.updatedAt.toISOString()}>{WAITLIST_DATE_FORMAT.format(waitlist.updatedAt)}</time></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function WaitlistsEmptyState({ query, status, sort, hasFilters }) {
  if (!hasFilters) {
    return <div className={`product-empty ${styles.empty}`}><h2>Your next launch starts here.</h2><p>Create a waitlist to collect subscribers and learn who's interested.</p><Link href="/wait-lists/new" className={buttonVariants()}>Create your first waitlist</Link></div>;
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

  return <div className={`product-empty ${styles.empty}`}><h2>{title}</h2><p>{description}</p><Link href={clearHref}>{clearLabel}</Link></div>;
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
    ? <><p className={styles.resultsMeta} aria-live="polite">{pageCount > 1 ? `${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + waitlists.length} of ` : ""}{total} {total === 1 ? "waitlist" : "waitlists"}</p><WaitlistsTable waitlists={waitlists} query={query} status={status} sort={sort} />{pageCount > 1 && <nav className={styles.pagination} aria-label="Waitlist pages">{page === 1 ? <span aria-disabled="true">Previous</span> : <Link href={waitlistsHref({ query, status, sort, page: page - 1 })}>Previous</Link>}<span>Page {page} of {pageCount}</span>{page === pageCount ? <span aria-disabled="true">Next</span> : <Link href={waitlistsHref({ query, status, sort, page: page + 1 })}>Next</Link>}</nav>}</>
    : <WaitlistsEmptyState query={query} status={status} sort={sort} hasFilters={hasFilters} />;
}

export default async function WaitlistsPage({ searchParams }) {
  const [{ user, workspace }, params] = await Promise.all([currentWorkspace(), searchParams]);
  const query = normalizeWaitlistSearch(params?.q);
  const status = normalizeWaitlistStatus(params?.status);
  const sort = normalizeWaitlistSort(params?.sort);
  const requestedPage = typeof params?.page === "string" && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  return (
    <section>
      <div className={`product-page-heading ${styles.listHeader}`}>
        <h1 className={`product-page-title ${styles.listTitle}`}>Waitlists</h1>
      </div>
      <div className={styles.listToolbar}>
        <WaitlistSearch query={query} status={status} sort={sort} />
        <Button render={<Link href="/wait-lists/new" />}><HugeiconsIcon icon={Add01Icon} aria-hidden="true" />New waitlist</Button>
      </div>
      <StatusTabs query={query} status={status} sort={sort} />
      <Suspense fallback={<ProductContentSkeleton label="Loading waitlists" variant="table" rows={5} />}>
        <WaitlistsResults userId={user.id} workspaceId={workspace.id} query={query} status={status} sort={sort} requestedPage={requestedPage} />
      </Suspense>
    </section>
  );
}
