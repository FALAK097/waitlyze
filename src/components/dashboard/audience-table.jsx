"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CopyIcon, Download01Icon, Search01Icon, Upload01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Button, buttonVariants } from "@/components/ui/button";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { formatProductDate } from "@/lib/product-date.mjs";
import { EXPORT_COLUMNS, IMPORT_TEMPLATE_CSV } from "@/lib/audience-query.mjs";
import { importSignups } from "@/app/actions/audience-import";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import "./audience.css";
import { ReferralReview } from "@/components/dashboard/referral-review";
import { toast } from "sonner";

const PAGE_SIZE = 25;
const statuses = [
  { value: "all", label: "All signups" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Needs confirmation" },
];

function formatDate(date) {
  return formatProductDate(date);
}

function timeAgo(value) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function AudienceTable({ waitlist, initialReviews = [], initialReviewsFailed = false, canManage = false }) {
  const [view, setView] = useState("subscribers");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [cursors, setCursors] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [result, setResult] = useState({ data: [], total: 0, nextCursor: null, flags: null });
  const [loadedCriteria, setLoadedCriteria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState(null);
  const [exportError, setExportError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportColumns, setExportColumns] = useState(() => EXPORT_COLUMNS.map((column) => column.key));
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const flags = result.flags || { showReferrals: waitlist.showReferrals, sendEmailsToSubscribers: waitlist.sendEmailsToSubscribers, publicSlug: waitlist.publicSlug };

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
      if (!response.ok) throw new Error(payload.error || "Unable to load signups.");
      setResult(payload);
      setLoadedCriteria(`${status}\u0000${search}`);
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError("Unable to refresh signups.");
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
      const params = new URLSearchParams({ status, columns: exportColumns.join(",") });
      if (search) params.set("q", search);
      const response = await fetch(`/api/wait-lists/${encodeURIComponent(waitlist.id)}/subscribers?${params}`, { method: "POST" });
      if (!response.ok) throw new Error("Unable to export signups.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${waitlist.name || "waitlist"}-signups.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setSheet(null);
    } catch {
      const message = "The export could not be created. Try again.";
      setExportError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  }

  async function runImport(event) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("file");
    setImporting(true);
    setImportResult(null);
    try {
      const data = new FormData();
      data.set("file", file);
      const outcome = await importSignups(waitlist.id, data);
      setImportResult(outcome);
      if (outcome.ok) {
        toast.success(`${outcome.imported.toLocaleString()} signup${outcome.imported === 1 ? "" : "s"} imported.`);
        setRetryCount((count) => count + 1);
      } else toast.error(outcome.message);
    } catch {
      const outcome = { ok: false, message: "Couldn't import that file. Try again." };
      setImportResult(outcome);
      toast.error(outcome.message);
    } finally {
      setImporting(false);
    }
  }

  function copyText(text) {
    setCopied(false);
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => toast.error("Copy didn't work. Select the text manually."),
    );
  }

  const showingStart = result.total === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const showingEnd = Math.min((pageIndex + 1) * PAGE_SIZE, result.total);
  const profile = sheet?.type === "profile" ? sheet.row : null;
  const profileStatus = useMemo(() => profile?.verifiedAt ? "Verified" : "Needs confirmation", [profile]);
  const profileLink = profile?.referralCode && flags.publicSlug && flags.showReferrals
    ? `${window.location.origin}/w/${flags.publicSlug}?r=${profile.referralCode}`
    : null;
  const requestedSearch = query.trim();
  const criteriaChanging = requestedSearch !== search || loadedCriteria !== `${status}\u0000${search}`;
  const isUpdating = loading || (criteriaChanging && !error);
  const loadedFilters = loadedCriteria?.split("\u0000") || [];
  const appliedCriteriaLabel = loadedCriteria
    ? `${loadedFilters[1] ? `“${loadedFilters[1]}” · ` : ""}${statuses.find((item) => item.value === loadedFilters[0])?.label || "All signups"}`
    : "the initial signup list";
  const emptyTitle = search ? "No signups match this search" : status === "verified" ? "No verified signups yet" : status === "pending" ? "No signups need confirmation" : "No signups yet";
  const emptyDescription = search || status !== "all" ? "Try a different search or status filter." : "Publish and share your waitlist page to invite the first signups.";

  const columnHelper = useMemo(() => createColumnHelper(), []);
  const columns = useMemo(() => [
    columnHelper.accessor("email", {
      header: "Email",
      meta: { className: "w-[42%] px-4 py-3 sm:w-auto" },
      cell: ({ row }) => (
        <Button type="button" className="break-all font-medium underline-offset-4 hover:underline focus-visible:underline sm:break-normal" variant="ghost" onClick={() => { setCopied(false); setSheet({ type: "profile", row: row.original }); }}>{row.original.email}</Button>
      ),
    }),
    columnHelper.accessor("country", {
      header: "Country",
      meta: { className: "hidden px-4 py-3 sm:table-cell" },
      cell: ({ row }) => <span className="text-[var(--product-text-secondary)]">{[row.original.city, row.original.country].filter(Boolean).join(", ") || "—"}</span>,
    }),
    ...(flags.showReferrals ? [columnHelper.accessor("position", {
      header: "Position",
      meta: { className: "hidden px-4 py-3 sm:table-cell" },
      cell: ({ getValue }) => <span className="text-[var(--product-text-secondary)]">{getValue() == null ? "—" : `#${getValue()}`}</span>,
    })] : []),
    columnHelper.accessor("createdAt", {
      header: "Joined",
      meta: { className: "hidden px-4 py-3 sm:table-cell" },
      cell: ({ getValue }) => <span className="text-[var(--product-text-secondary)]" title={formatDate(getValue())}>{timeAgo(getValue())}</span>,
    }),
    ...(flags.sendEmailsToSubscribers ? [columnHelper.accessor("verifiedAt", {
      header: "Status",
      meta: { className: "w-[58%] px-4 py-3 text-right sm:w-auto sm:text-left" },
      cell: ({ getValue }) => {
        const verified = Boolean(getValue());
        return <span className={`product-status ${verified ? "product-status-success" : ""}`}><span aria-hidden="true">{verified ? "●" : "○"}</span>{verified ? "Verified" : "Needs confirmation"}</span>;
      },
    })] : []),
  ], [columnHelper, flags.showReferrals, flags.sendEmailsToSubscribers]);
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
            <div className="flex flex-wrap gap-2">
              {canManage && (
                <Button variant="outline" onClick={() => { setImportResult(null); setSheet({ type: "import" }); }}>
                  <HugeiconsIcon icon={Upload01Icon} aria-hidden="true" /> Import
                </Button>
              )}
              <Button variant="outline" onClick={() => { setExportError(""); setSheet({ type: "export" }); }} disabled={isUpdating}>
                <HugeiconsIcon icon={Download01Icon} aria-hidden="true" /> Export
              </Button>
            </div>
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
            <span className="sr-only">Search signups by email</span>
            <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--product-text-secondary)]" aria-hidden="true" />
            <Input className="pl-10" type="search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by email" maxLength={120} />
          </Label>
          <div className="product-audience-filters" role="group" aria-label="Filter signups by status">
            {statuses.map((item) => (
              <Button key={item.value} variant="ghost" aria-pressed={status === item.value} onClick={() => changeStatus(item.value)}>{item.label}</Button>
            ))}
          </div>
        </div>

        {criteriaChanging && !error && result.data.length > 0 && <p className="border-b border-[var(--product-border-subtle)] bg-[var(--product-bg-inset)] px-4 py-3 text-sm text-[var(--product-text-secondary)]" role="status" aria-live="polite">
          Updating results. Showing signups for {appliedCriteriaLabel} until the new results load.
        </p>}
        {error && <div className="product-field-error flex flex-wrap items-center justify-between gap-3 px-4 py-3" role="alert">
          <span>{result.data.length ? `Couldn’t refresh the list. Showing the last loaded results for ${appliedCriteriaLabel}.` : "Signups couldn’t be loaded."}</span>
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
              {!loading && !criteriaChanging && !error && rows.length === 0 && <TableRow><TableCell colSpan={columns.length} className="px-4 py-16 text-center"><HugeiconsIcon icon={UserGroupIcon} className="mx-auto mb-3 text-[var(--product-text-secondary)]" aria-hidden="true" /><p className="font-medium">{emptyTitle}</p><p className="mt-1 text-[var(--product-text-secondary)]">{emptyDescription}</p>{search || status !== "all" ? <Button className="mt-4" variant="outline" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Button> : <Link prefetch={false} className={`${buttonVariants({ variant: "outline" })} mt-4`} href={`/waitlists/${encodeURIComponent(waitlist.id)}/edit`}>Open page builder</Link>}</TableCell></TableRow>}
              {isUpdating && rows.length === 0 && <>
                {[0, 1, 2, 3, 4].map((row) => <TableRow className="product-subscriber-skeleton-row" aria-hidden="true" key={row}><TableCell><i /></TableCell><TableCell><i /></TableCell><TableCell className="hidden sm:table-cell"><i /></TableCell><TableCell className="hidden sm:table-cell"><i /></TableCell></TableRow>)}
              </>}
            </TableBody>
          </Table>
        </div>
        <footer className="product-audience-pagination">
          <span role="status" aria-live="polite" aria-atomic="true">{isUpdating ? "Updating signups…" : error ? "Couldn’t load signups." : `${showingStart}–${showingEnd} of ${result.total}`}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={pageIndex === 0 || isUpdating} onClick={() => setPageIndex((current) => Math.max(0, current - 1))}>Previous</Button>
            <Button variant="outline" disabled={!result.nextCursor || isUpdating} onClick={() => { setCursors((current) => [...current.slice(0, pageIndex + 1), result.nextCursor]); setPageIndex((current) => current + 1); }}>Next</Button>
          </div>
        </footer>
      </div>

      <Sheet open={sheet !== null} onOpenChange={(open) => { if (!open) setSheet(null); }}>
        <SheetContent className="overflow-y-auto">
          {sheet?.type === "profile" && profile && <>
            <SheetHeader><SheetTitle>Signup details</SheetTitle><SheetDescription>Everything recorded for this signup.</SheetDescription></SheetHeader>
            <dl className="grid gap-4 py-4">
              <div><dt className="text-[var(--product-text-secondary)]">Email</dt><dd className="mt-1 break-all font-medium">{profile.email}</dd></div>
              {flags.sendEmailsToSubscribers && <div><dt className="text-[var(--product-text-secondary)]">Status</dt><dd className="mt-1">{profileStatus}</dd></div>}
              {flags.showReferrals && <div><dt className="text-[var(--product-text-secondary)]">Position</dt><dd className="mt-1">{profile.position == null ? "—" : `#${profile.position}`}</dd></div>}
              <div><dt className="text-[var(--product-text-secondary)]">Joined</dt><dd className="mt-1" title={formatDate(profile.createdAt)}>{timeAgo(profile.createdAt)}</dd></div>
              <div><dt className="text-[var(--product-text-secondary)]">Location</dt><dd className="mt-1">{[profile.city, profile.country].filter(Boolean).join(", ") || "Not available"}</dd></div>
              <div><dt className="text-[var(--product-text-secondary)]">Device</dt><dd className="mt-1">{[profile.deviceType, profile.device].filter(Boolean).join(" · ") || "Not available"}</dd></div>
              {flags.showReferrals && <div><dt className="text-[var(--product-text-secondary)]">Referrals</dt><dd className="mt-1">{profile.referralCount}</dd></div>}
              <div><dt className="text-[var(--product-text-secondary)]">Source</dt><dd className="mt-1">{profile.utmSource || "Direct"}</dd></div>
              {profileLink && <div><dt className="text-[var(--product-text-secondary)]">Referral link</dt><dd className="mt-1 break-all">{profileLink}</dd><Button variant="outline" size="sm" className="mt-2" onClick={() => copyText(profileLink)}><HugeiconsIcon icon={CopyIcon} aria-hidden="true" />{copied ? "Copied" : "Copy link"}</Button></div>}
            </dl>
          </>}
          {sheet?.type === "export" && <>
            <SheetHeader><SheetTitle>Export signups</SheetTitle><SheetDescription>Choose columns. Exports the current search and filters.</SheetDescription></SheetHeader>
            <div className="grid gap-2 py-4">
              {EXPORT_COLUMNS.map((column) => <Label key={column.key} className="flex items-center gap-3 py-1.5">
                <Checkbox checked={exportColumns.includes(column.key)} onCheckedChange={(checked) => setExportColumns((current) => checked ? [...current, column.key] : current.filter((key) => key !== column.key))} />
                <span>{column.label}</span>
              </Label>)}
            </div>
            <Button onClick={exportCsv} disabled={exporting || exportColumns.length === 0 || isUpdating} aria-busy={exporting}><HugeiconsIcon icon={Download01Icon} aria-hidden="true" />{exporting ? "Preparing export…" : `Download CSV${exportColumns.length ? ` (${exportColumns.length} columns)` : ""}`}</Button>
          </>}
          {sheet?.type === "import" && <>
            <SheetHeader><SheetTitle>Import signups</SheetTitle><SheetDescription>Add emails in bulk. Imported rows start unverified and receive no emails.</SheetDescription></SheetHeader>
            <div className="grid gap-4 py-4">
              <a className="text-sm font-medium underline underline-offset-4" href={`data:text/csv;charset=utf-8,${encodeURIComponent(IMPORT_TEMPLATE_CSV)}`} download="waitlyze-import-template.csv">Download the CSV template</a>
              <form onSubmit={runImport} className="grid gap-3">
                <Label htmlFor="audience-import-file">CSV file</Label>
                <Input id="audience-import-file" name="file" type="file" accept=".csv,text/csv" required disabled={importing} />
                <Button type="submit" disabled={importing} aria-busy={importing}>{importing ? "Importing…" : "Import"}</Button>
              </form>
              {importResult && (
                importResult.ok
                  ? <p role="status" className="text-sm">{importResult.imported.toLocaleString()} imported{importResult.duplicates > 0 && `, ${importResult.duplicates.toLocaleString()} already on the list`}{importResult.invalid > 0 && `, ${importResult.invalid.toLocaleString()} failed validation`}.</p>
                  : <p role="alert" className="product-field-error text-sm">{importResult.message}</p>
              )}
            </div>
          </>}
        </SheetContent>
      </Sheet>
      </>}
    </section>
  );
}
