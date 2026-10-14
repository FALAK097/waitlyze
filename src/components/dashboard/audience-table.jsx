"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon, Search01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Button, buttonVariants } from "@/components/ui/button";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Label } from "@/components/ui/label";

import { formatProductDate } from "@/lib/product-date.mjs";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import "./audience.css";
import { ReferralReview } from "@/components/dashboard/referral-review";
import { toast } from "sonner";

const PAGE_SIZE = 25;
const statuses = [
  { value: "all", label: "All subscribers" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Needs confirmation" },
];

function formatDate(date) {
  return formatProductDate(date);
}

export function AudienceTable({ waitlist, initialReviews = [], initialReviewsFailed = false, canManage = false }) {
  const [view, setView] = useState("subscribers");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [cursors, setCursors] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [result, setResult] = useState({ data: [], total: 0, nextCursor: null });
  const [loadedCriteria, setLoadedCriteria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [exportError, setExportError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(query.trim());
      setCursors([null]);
      setPageIndex(0);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  function changeStatus(nextStatus) {
    setStatus(nextStatus);
    setCursors([null]);
    setPageIndex(0);
  }

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ status });
    if (search) params.set("q", search);
    if (cursors[pageIndex]) params.set("cursor", cursors[pageIndex]);
    try {
      const response = await fetch(`/api/wait-lists/${encodeURIComponent(waitlist.id)}/subscribers?${params}`, { signal, cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load subscribers.");
      setResult(payload);
      setLoadedCriteria(`${status}\u0000${search}`);
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError("Unable to refresh subscribers.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [cursors, pageIndex, retryCount, search, status, waitlist.id]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function exportCsv() {
    setExporting(true);
    setExportError("");
    try {
      const params = new URLSearchParams({ status });
      if (search) params.set("q", search);
      const response = await fetch(`/api/wait-lists/${encodeURIComponent(waitlist.id)}/subscribers?${params}`, { method: "POST" });
      if (!response.ok) throw new Error("Unable to export subscribers.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${waitlist.name || "waitlist"}-subscribers.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      const message = "The export could not be created. Try again.";
      setExportError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  }

  const showingStart = result.total === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const showingEnd = Math.min((pageIndex + 1) * PAGE_SIZE, result.total);
  const selectedStatus = useMemo(() => selected?.verifiedAt ? "Verified" : "Needs confirmation", [selected]);
  const requestedSearch = query.trim();
  const criteriaChanging = requestedSearch !== search || loadedCriteria !== `${status}\u0000${search}`;
  const isUpdating = loading || (criteriaChanging && !error);
  const loadedFilters = loadedCriteria?.split("\u0000") || [];
  const appliedCriteriaLabel = loadedCriteria
    ? `${loadedFilters[1] ? `“${loadedFilters[1]}” · ` : ""}${statuses.find((item) => item.value === loadedFilters[0])?.label || "All subscribers"}`
    : "the initial subscriber list";
  const emptyTitle = search ? "No subscribers match this search" : status === "verified" ? "No verified subscribers yet" : status === "pending" ? "No subscribers need confirmation" : "No subscribers yet";
  const emptyDescription = search || status !== "all" ? "Try a different search or status filter." : "Publish and share your waitlist page to invite the first signups.";

  const columnHelper = useMemo(() => createColumnHelper(), []);
  const columns = useMemo(() => [
    columnHelper.accessor("email", {
      header: "Email",
      meta: { className: "w-[58%] px-4 py-3 sm:w-auto" },
      cell: ({ row }) => (
        <Button type="button" className="break-all font-medium underline-offset-4 hover:underline focus-visible:underline sm:break-normal" variant="ghost" onClick={() => setSelected(row.original)}>{row.original.email}</Button>
      ),
    }),
    columnHelper.accessor("verifiedAt", {
      header: "Status",
      meta: { className: "w-[42%] px-4 py-3 sm:w-auto" },
      cell: ({ getValue }) => {
        const verified = Boolean(getValue());
        return <span className={`product-status ${verified ? "product-status-success" : ""}`}><span aria-hidden="true">{verified ? "●" : "○"}</span>{verified ? "Verified" : "Needs confirmation"}</span>;
      },
    }),
    columnHelper.accessor("createdAt", {
      header: "Joined",
      meta: { className: "hidden px-4 py-3 sm:table-cell" },
      cell: ({ getValue }) => <span className="text-[var(--product-text-secondary)]">{formatDate(getValue())}</span>,
    }),
    columnHelper.accessor("referralCount", {
      header: "Referrals",
      meta: { className: "hidden px-4 py-3 sm:table-cell" },
      cell: ({ getValue }) => <span className="text-[var(--product-text-secondary)]">{getValue()}</span>,
    }),
  ], [columnHelper]);
  const table = useReactTable({
    data: result.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: -1,
    state: { pagination: { pageIndex, pageSize: PAGE_SIZE } },
  });
  const rows = table.getRowModel().rows;

  return (
    <section className="product-ui product-audience" aria-labelledby="audience-title">
      <header className="product-page-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <h2 id="audience-title">Signups</h2>
            <p className="product-description">People who joined {waitlist.name || "this waitlist"}.</p>
          </div>
          {view === "subscribers" && (
            <Button variant="outline" onClick={exportCsv} disabled={exporting || isUpdating} aria-busy={exporting || isUpdating}>
              <HugeiconsIcon icon={Download01Icon} aria-hidden="true" /> {exporting ? "Preparing export…" : "Export CSV"}
            </Button>
          )}
        </div>
        <div className="product-audience-views" role="group" aria-label="Signup views">
          <Button variant="ghost" aria-pressed={view === "subscribers"} onClick={() => setView("subscribers")}>Signups</Button>
          <Button variant="ghost" aria-pressed={view === "referrals"} onClick={() => setView("referrals")}>Referral review{initialReviews.filter((review) => review.reviewStatus === "NEEDS_REVIEW").length > 0 && ` · ${initialReviews.filter((review) => review.reviewStatus === "NEEDS_REVIEW").length}`}</Button>
        </div>
      </header>

      {view === "referrals" ? <ReferralReview waitListId={waitlist.id} initialReviews={initialReviews} initialLoadError={initialReviewsFailed} canManage={canManage} /> : <>

      {exportError && <p className="product-field-error" role="alert">{exportError}</p>}
      <div className="product-audience-data" aria-busy={isUpdating}>
        <div className="product-audience-toolbar">
          <Label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">Search subscribers by email</span>
            <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--product-text-secondary)]" aria-hidden="true" />
            <Input className="pl-10" type="search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by email" maxLength={120} />
          </Label>
          <div className="product-audience-filters" role="group" aria-label="Filter subscribers by status">
            {statuses.map((item) => (
              <Button key={item.value} variant="ghost" aria-pressed={status === item.value} onClick={() => changeStatus(item.value)}>{item.label}</Button>
            ))}
          </div>
        </div>

        {criteriaChanging && !error && result.data.length > 0 && <p className="border-b border-[var(--product-border-subtle)] bg-[var(--product-bg-inset)] px-4 py-3 text-sm text-[var(--product-text-secondary)]" role="status" aria-live="polite">
          Updating results. Showing subscribers for {appliedCriteriaLabel} until the new results load.
        </p>}
        {error && <div className="product-field-error flex flex-wrap items-center justify-between gap-3 px-4 py-3" role="alert">
          <span>{result.data.length ? `Couldn’t refresh the list. Showing the last loaded results for ${appliedCriteriaLabel}.` : "Subscribers couldn’t be loaded."}</span>
          <Button variant="outline" onClick={() => setRetryCount((count) => count + 1)}>Try again</Button>
        </div>}
        <div className="overflow-x-auto">
          <Table className="w-full min-w-0 table-fixed border-collapse text-left sm:min-w-[38rem] sm:table-auto">
            <TableHeader className="text-[var(--product-text-secondary)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => (
                  <TableHead key={header.id} scope="col" className={`font-medium ${header.column.columnDef.meta?.className || ""}`}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}</TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.original.id} className="product-audience-row">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className || ""}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
              {!loading && !criteriaChanging && !error && rows.length === 0 && <TableRow><TableCell colSpan={columns.length} className="px-4 py-16 text-center"><HugeiconsIcon icon={UserGroupIcon} className="mx-auto mb-3 text-[var(--product-text-secondary)]" aria-hidden="true" /><p className="font-medium">{emptyTitle}</p><p className="mt-1 text-[var(--product-text-secondary)]">{emptyDescription}</p>{search || status !== "all" ? <Button className="mt-4" variant="outline" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Button> : <Link prefetch={false} className={`${buttonVariants({ variant: "outline" })} mt-4`} href={`/waitlists/${encodeURIComponent(waitlist.id)}`}>Open waitlist overview</Link>}</TableCell></TableRow>}
              {isUpdating && rows.length === 0 && <>
                {[0, 1, 2, 3, 4].map((row) => <TableRow className="product-subscriber-skeleton-row" aria-hidden="true" key={row}><TableCell><i /></TableCell><TableCell><i /></TableCell><TableCell className="hidden sm:table-cell"><i /></TableCell><TableCell className="hidden sm:table-cell"><i /></TableCell></TableRow>)}
              </>}
            </TableBody>
          </Table>
        </div>
        <footer className="product-audience-pagination">
          <span role="status" aria-live="polite" aria-atomic="true">{isUpdating ? "Updating subscribers…" : error ? "Couldn’t load subscribers." : `${showingStart}–${showingEnd} of ${result.total}`}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={pageIndex === 0 || isUpdating} onClick={() => setPageIndex((current) => Math.max(0, current - 1))}>Previous</Button>
            <Button variant="outline" disabled={!result.nextCursor || isUpdating} onClick={() => { setCursors((current) => [...current.slice(0, pageIndex + 1), result.nextCursor]); setPageIndex((current) => current + 1); }}>Next</Button>
          </div>
        </footer>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="product-subscriber-profile-dialog">
          {selected && <>
            <div className="product-dialog-heading"><DialogTitle>Subscriber profile</DialogTitle><DialogDescription>Signup details for this waitlist.</DialogDescription></div>
            <dl className="grid gap-4">
              <div><dt className="text-[var(--product-text-secondary)]">Email</dt><dd className="mt-1 break-all font-medium">{selected.email}</dd></div>
              <div><dt className="text-[var(--product-text-secondary)]">Status</dt><dd className="mt-1">{selectedStatus}</dd></div>
              <div><dt className="text-[var(--product-text-secondary)]">Joined</dt><dd className="mt-1">{formatDate(selected.createdAt)}</dd></div>
              <div><dt className="text-[var(--product-text-secondary)]">Location</dt><dd className="mt-1">{[selected.city, selected.country].filter(Boolean).join(", ") || "Not available"}</dd></div>
              <div><dt className="text-[var(--product-text-secondary)]">Device</dt><dd className="mt-1">{selected.device || "Not available"}</dd></div>
              <div><dt className="text-[var(--product-text-secondary)]">Referrals</dt><dd className="mt-1">{selected.referralCount}</dd></div>
            </dl>
          </>}
        </DialogContent>
      </Dialog>
      </>}
    </section>
  );
}
