import Link from "next/link";
import { Suspense } from "react";

import { ProductContentSkeleton } from "@/components/product/content-skeleton";
import { CreateWaitlistDialog } from "@/components/product/create-waitlist-dialog";
import { WaitlistRowActions } from "@/components/product/waitlist-row-actions";
import {
  SortableHeading,
  StatusTabs,
  WaitlistSearch,
} from "@/components/product/waitlists-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import prisma from "@/lib/prisma";
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
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export const metadata = { title: "Waitlists" };

const PAGE_SIZE = 25;

/* The waitlist list table: borderless shell, fixed layout, and the column
   rhythm that used to live in the shared experience stylesheet. */
const waitlistTableWrap = [
  "relative overflow-x-auto rounded-none border-0 bg-product-bg-surface no-scrollbar",
  "[&_[data-slot=table-container]]:overflow-x-auto",
  "[&_[data-slot=table-container]]:no-scrollbar",
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_table]:table-fixed",
  "[&_th]:text-left [&_th]:border-b [&_th]:border-product-border-subtle",
  "[&_thead_th]:px-3 [&_thead_th]:pt-0 [&_thead_th]:pb-2",
  "[&_thead_th]:font-medium [&_thead_th]:text-product-text-secondary",
  "[&_tbody_th]:px-3 [&_tbody_th]:py-4 [&_tbody_th]:font-medium",
  "[&_tbody_td]:px-3 [&_tbody_td]:py-4",
  "[&_tbody_td]:text-product-text-secondary [&_tbody_td]:tabular-nums",
  "[&_tbody_td:nth-child(2)]:text-product-text-primary",
  "[&_tbody_tr:hover]:bg-neutral-50",
  "[&_th:first-child]:w-6/25 [&_th:nth-child(2)]:w-11/100 [&_th:nth-child(3)]:w-1/5",
  "[&_th:nth-child(4)]:w-7/50 [&_th:nth-child(5)]:w-4/25 [&_th:nth-child(6)]:w-16",
  "max-[767px]:[&_table]:min-w-180",
].join(" ");

const waitlistRowLink = [
  "flex w-fit min-h-11 flex-wrap items-center gap-3 py-1",
  "text-sm text-product-text-primary hover:underline hover:underline-offset-4",
  "max-[520px]:flex-col max-[520px]:items-start max-[520px]:gap-1.5",
].join(" ");

const waitlistCellLink =
  "inline-flex min-h-11 items-center whitespace-nowrap py-3 text-sm text-product-text-primary";

const waitlistEmpty = [
  "mx-auto grid w-full max-w-2xl justify-items-center border-0 bg-transparent px-5 py-16 text-center",
  "[&_p]:max-w-100 [&_p]:text-balance [&_p]:text-sm [&_p]:text-product-text-secondary",
].join(" ");
const WAITLIST_DATE_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function WaitlistsTable({ waitlists, query, status, sort }) {
  return (
    <div className={waitlistTableWrap}>
      <Table scrollHint="Swipe or scroll to see all columns" scrollLabel="Waitlists">
        <caption className="sr-only">Your waitlists</caption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Name</TableHead>
            <TableHead scope="col">Visitors</TableHead>
            <SortableHeading
              column="subscribers"
              label="Subscribers"
              query={query}
              status={status}
              sort={sort}
            />
            <TableHead scope="col">Conversion</TableHead>
            <TableHead scope="col">Updated</TableHead>
            <TableHead scope="col">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {waitlists.map((waitlist) => {
            const visitors = waitlist._count.impressions;
            const signups = waitlist._count.signUps;
            const conversion = visitors > 0 ? `${((signups / visitors) * 100).toFixed(1)}%` : "-";
            return (
              <TableRow key={waitlist.id}>
                <TableHead scope="row">
                  <Link
                    prefetch={false}
                    href={`/waitlists/${waitlist.id}`}
                    aria-label={`Open ${waitlist.name || "Untitled waitlist"}`}
                    className={waitlistRowLink}
                  >
                    <span>{waitlist.name || "Untitled waitlist"}</span>
                  </Link>
                  {waitlist.description && (
                    <p className="max-w-prose text-caption">{waitlist.description}</p>
                  )}
                </TableHead>
                <TableCell>{visitors.toLocaleString()}</TableCell>
                <TableCell>
                  <Link
                    prefetch={false}
                    href={`/waitlists/${waitlist.id}/subscribers`}
                    aria-label={`View subscribers of ${waitlist.name || "Untitled waitlist"}`}
                    className={waitlistCellLink}
                  >
                    {signups.toLocaleString()}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    prefetch={false}
                    href={`/waitlists/${waitlist.id}/analytics`}
                    aria-label={`View analytics of ${waitlist.name || "Untitled waitlist"}`}
                    className={waitlistCellLink}
                  >
                    {conversion}
                  </Link>
                </TableCell>
                <TableCell>
                  <time dateTime={waitlist.updatedAt.toISOString()}>
                    {WAITLIST_DATE_FORMAT.format(waitlist.updatedAt)}
                  </time>
                </TableCell>
                <TableCell>
                  <WaitlistRowActions id={waitlist.id} name={waitlist.name} />
                </TableCell>
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
    return (
      <div className={waitlistEmpty}>
        <h2 className="mb-2! text-xl">Your next launch starts here.</h2>
        <p>Create a waitlist to collect subscribers and learn who's interested.</p>
        <div className="mt-5">
          <CreateWaitlistDialog first />
        </div>
      </div>
    );
  }

  const selectedFilter =
    WAITLIST_STATUS_FILTERS.find((filter) => filter.value === status) || WAITLIST_STATUS_FILTERS[0];
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

  return (
    <div className={waitlistEmpty}>
      <h2 className="mb-2! text-xl">{title}</h2>
      <p>{description}</p>
      <Link prefetch={false} href={clearHref} className="mt-5 inline-block">
        {clearLabel}
      </Link>
    </div>
  );
}

async function WaitlistsResults(props) {
  return renderWaitlistsResults(props);
}

async function renderWaitlistsResults({ userId, workspaceId, query, status, sort, requestedPage }) {
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
    // Count and page data are independent. Fetch them together for normal
    // navigation, then retry only when the requested page needs clamping.
    const initialPage =
      Number.isSafeInteger(requestedPage) && requestedPage <= 1000 ? Math.max(1, requestedPage) : 1;
    const findPage = (pageNumber) =>
      prisma.waitList.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          updatedAt: true,
          _count: { select: { signUps: true, impressions: true } },
        },
        orderBy: waitlistSortOrderBy(sort),
        skip: (pageNumber - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      });
    const [count, initialWaitlists] = await Promise.all([
      prisma.waitList.count({ where }),
      findPage(initialPage),
    ]);
    total = count;
    pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    page = Math.min(Math.max(1, requestedPage), pageCount);
    waitlists = page === initialPage ? initialWaitlists : await findPage(page);
  } catch (error) {
    console.error("Error loading waitlists:", error);
    return (
      <div
        className="rounded-xl border border-product-border-subtle bg-product-bg-surface px-6 py-16 text-center"
        role="alert"
      >
        <h2 className="mb-2! text-xl">Waitlists couldn’t load</h2>
        <p className="text-sm text-product-text-secondary">
          Your workspace is safe. Try loading this page again.
        </p>
        <a href={waitlistsHref({ query, status, sort })} className="mt-5 inline-block">
          Try again
        </a>
      </div>
    );
  }
  const hasFilters = !!query || !!status;
  const resultsAnnouncement = `${total} ${total === 1 ? "waitlist" : "waitlists"}${query ? ` matching “${query}”` : ""}`;
  return waitlists.length ? (
    <>
      <p className="sr-only" aria-live="polite">
        {resultsAnnouncement}
      </p>
      <WaitlistsTable waitlists={waitlists} query={query} status={status} sort={sort} />
      {pageCount > 1 && (
        <nav
          className="flex items-center justify-end gap-4 py-5 text-caption text-product-text-secondary"
          aria-label="Waitlist pages"
        >
          {page === 1 ? (
            <span aria-disabled="true" className="inline-flex min-h-11 items-center p-2">
              Previous
            </span>
          ) : (
            <Link
              prefetch={false}
              href={waitlistsHref({ query, status, sort, page: page - 1 })}
              className="inline-flex min-h-11 items-center p-2 text-product-text-primary no-underline"
            >
              Previous
            </Link>
          )}
          <span>
            Page {page} of {pageCount}
          </span>
          {page === pageCount ? (
            <span aria-disabled="true" className="inline-flex min-h-11 items-center p-2">
              Next
            </span>
          ) : (
            <Link
              prefetch={false}
              href={waitlistsHref({ query, status, sort, page: page + 1 })}
              className="inline-flex min-h-11 items-center p-2 text-product-text-primary no-underline"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </>
  ) : (
    <WaitlistsEmptyState query={query} status={status} sort={sort} hasFilters={hasFilters} />
  );
}

export default async function WaitlistsPage({ searchParams }) {
  const [{ user, workspace }, params] = await Promise.all([currentWorkspace(), searchParams]);
  const query = normalizeWaitlistSearch(params?.q);
  const status = normalizeWaitlistStatus(params?.status);
  const sort = normalizeWaitlistSort(params?.sort);
  const requestedPage =
    typeof params?.page === "string" && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  return (
    <section aria-label="Waitlists">
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 max-[760px]:items-stretch">
        <StatusTabs query={query} status={status} sort={sort} />
        <WaitlistSearch query={query} status={status} sort={sort} />
        <div className="shrink-0">
          <CreateWaitlistDialog />
        </div>
      </div>
      <Suspense
        fallback={<ProductContentSkeleton label="Loading waitlists" variant="table" rows={5} />}
      >
        <WaitlistsResults
          userId={user.id}
          workspaceId={workspace.id}
          query={query}
          status={status}
          sort={sort}
          requestedPage={requestedPage}
        />
      </Suspense>
    </section>
  );
}
