"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CopyIcon, Download01Icon, Mail01Icon, Search01Icon, Tick01Icon, Upload01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Button, buttonVariants } from "@/components/ui/button";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { formatProductDate } from "@/lib/product-date.mjs";
import { EXPORT_COLUMNS, IMPORT_TEMPLATE_CSV } from "@/lib/audience-query.mjs";
import { importSignups } from "@/app/actions/audience-import";
import { retryFailedVerification } from "@/app/actions/verification-delivery";

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

function timeAgo(value) {  const then = new Date(value).getTime();
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

function countryFlag(code) {
  if (typeof code !== "string") return "";
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean)) return "";
  return String.fromCodePoint(...[...clean].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

function locationLabel(city, country) {
  const place = [city, country].filter(Boolean).join(", ");
  if (!place) return "—";
  const flag = countryFlag(country);
  return flag ? `${flag} ${place}` : place;
}

function deviceLabel(deviceType, agent) {
  const ua = typeof agent === "string" ? agent : "";
  const os = /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  const kind = typeof deviceType === "string" && deviceType ? deviceType.charAt(0).toUpperCase() + deviceType.slice(1) : "";
  return [kind, browser, os].filter(Boolean).join(" · ") || "Not available";
}

export function AudienceTable({ waitlist, initialReviews = [], initialReviewsFailed = false, canManage = false }) {
  const [view, setView] = useState("subscribers");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [retrying, setRetrying] = useState(false);
  const [sort, setSort] = useState("joined_desc");
  const [cursors, setCursors] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [result, setResult] = useState({ data: [], total: 0, nextCursor: null, flags: null });
  const [loadedCriteria, setLoadedCriteria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportColumns, setExportColumns] = useState(() => EXPORT_COLUMNS.map((column) => column.key));
  const [importing, setImporting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const flags = result.flags || { showReferrals: waitlist.showReferrals, sendEmailsToSubscribers: waitlist.sendEmailsToSubscribers, publicSlug: waitlist.publicSlug };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(query.trim());
      setCursors([null]);
      setPageIndex(0);
      setSelectedIds([]);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  function changeStatus(nextStatus) {
    setStatus(nextStatus);
    setCursors([null]);
    setPageIndex(0);
    setSelectedIds([]);
  }

  function toggleSort() {
    setSort((current) => (current === "joined_asc" ? "joined_desc" : "joined_asc"));
    setCursors([null]);
    setPageIndex(0);
    setSelectedIds([]);
  }

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ status, sort, delivery: deliveryFilter });
    if (search) params.set("q", search);
    if (cursors[pageIndex]) params.set("cursor", cursors[pageIndex]);
    try {
      const response = await fetch(`/api/wait-lists/${encodeURIComponent(waitlist.id)}/subscribers?${params}`, { signal, cache: "no-store" });
      const payload = await response.json();
      if (signal.aborted) return;
      if (!response.ok) throw new Error(payload.error || "Unable to load signups.");
      setResult(payload);
      setLoadedCriteria(`${status}\u0000${search}\u0000${sort}\u0000${deliveryFilter}`);
    } catch (loadError) {
      if (loadError.name !== "AbortError") {
        setError("Unable to refresh signups.");
        toast.error("Unable to refresh signups.");
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [cursors, deliveryFilter, pageIndex, retryCount, search, sort, status, waitlist.id]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function exportCsv() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ status, sort, delivery: deliveryFilter, columns: exportColumns.join(",") });
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
      toast.error("The export could not be created. Try again.");
    } finally {
      setExporting(false);
    }
  }

  async function runImport(event) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("file");
    setImporting(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const outcome = await importSignups(waitlist.id, data);
      if (outcome.ok) {
        const parts = [`${outcome.imported.toLocaleString()} signup${outcome.imported === 1 ? "" : "s"} imported`];
        if (outcome.duplicates > 0) parts.push(`${outcome.duplicates.toLocaleString()} already on the list`);
        if (outcome.invalid > 0) parts.push(`${outcome.invalid.toLocaleString()} failed validation`);
        toast.success(`${parts.join(", ")}.`);
        setRetryCount((count) => count + 1);
      } else toast.error(outcome.message);
    } catch {
      toast.error("Couldn't import that file. Try again.");
    } finally {
      setImporting(false);
    }
  }

  function copyText(text, id) {
    setCopiedId(null);
    navigator.clipboard?.writeText(text).then(
      () => setCopiedId(id ?? null),
      () => toast.error("Copy didn't work. Select the text manually."),
    );
  }

  async function retryEmails(ids) {
    setRetrying(true);
    try {
      const result = await retryFailedVerification({ waitListId: waitlist.id, signupIds: ids });
      if (!result.ok) throw new Error(result.message);
      toast.success(result.message);
      setSelectedIds([]);
      setRetryCount((count) => count + 1);
    } catch (error) { toast.error(error.message || "Could not retry confirmation emails."); }
    finally { setRetrying(false); }
  }

  function deliveryLabel(row) {
    const email = row.verificationDelivery;
    if (!email) return row.verifiedAt ? "No confirmation record" : "No confirmation email recorded";
    if (email.status === "DELIVERED") return "Accepted by sender";
    if (email.status === "PENDING" || email.status === "PROCESSING") return "Sending";
    if (email.issue === "RECIPIENT_SUPPRESSED") return "Not sent · suppressed";
    if (email.issue === "SIGNUP_NOT_SENDABLE") return "Not sent · no longer eligible";
    return "Failed";
  }

  const showingStart = result.total === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const showingEnd = Math.min((pageIndex + 1) * PAGE_SIZE, result.total);
  const profile = sheet?.type === "profile" ? result.data.find((row) => row.id === sheet.row.id) || sheet.row : null;
  const profileStatus = useMemo(() => profile?.verifiedAt ? "Verified" : "Needs confirmation", [profile]);
  const profileLink = profile?.referralCode && flags.publicSlug && flags.showReferrals
    ? `${window.location.origin}/w/${flags.publicSlug}?r=${profile.referralCode}`
    : null;
  const requestedSearch = query.trim();
  const criteriaChanging = requestedSearch !== search || loadedCriteria !== `${status}\u0000${search}\u0000${sort}\u0000${deliveryFilter}`;
  const isUpdating = loading || (criteriaChanging && !error);
  const loadedFilters = loadedCriteria?.split("\u0000") || [];
  const appliedCriteriaLabel = loadedCriteria
    ? `${loadedFilters[1] ? `“${loadedFilters[1]}” · ` : ""}${statuses.find((item) => item.value === loadedFilters[0])?.label || "All signups"}`
    : "the initial signup list";
  const emptyTitle = deliveryFilter === "failed" ? "No failed confirmation emails" : search ? "No signups match this search" : status === "verified" ? "No verified signups yet" : status === "pending" ? "No signups need confirmation" : "No signups yet";
  const emptyDescription = search || status !== "all" || deliveryFilter !== "all" ? "Try a different search or status filter." : "Publish and share your waitlist page to invite the first signups.";

  const columnHelper = useMemo(() => createColumnHelper(), []);
  const columns = useMemo(() => [
    columnHelper.display({ id: "selection", header: () => <Checkbox aria-label="Select all signups on this page" checked={result.data.length > 0 && result.data.every((row) => selectedIds.includes(row.id))} onCheckedChange={(checked) => setSelectedIds(checked ? result.data.map((row) => row.id) : [])} />, meta: { className: "w-10 px-3" }, cell: ({ row }) => <Checkbox aria-label={`Select ${row.original.email}`} checked={selectedIds.includes(row.original.id)} onClick={(event) => event.stopPropagation()} onCheckedChange={(checked) => setSelectedIds((items) => checked ? [...items, row.original.id] : items.filter((id) => id !== row.original.id))} /> }),
    columnHelper.accessor("email", {
      header: "Email",
      meta: { className: "w-[42%] px-4 py-3 sm:w-auto" },
      cell: ({ row }) => (
        <span className="group inline-flex max-w-full items-center gap-1">
          <Button type="button" className="min-w-0 break-all px-1 font-medium underline-offset-4 focus-visible:underline sm:break-normal" variant="ghost" onClick={() => { setCopiedId(null); setSheet({ type: "profile", row: row.original }); }}>{row.original.email}</Button>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Copy ${row.original.email}`} onClick={(event) => { event.stopPropagation(); copyText(row.original.email, row.original.id); }}>
            <HugeiconsIcon icon={copiedId === row.original.id ? Tick01Icon : CopyIcon} aria-hidden="true" />
          </Button>
        </span>
      ),
    }),
    columnHelper.accessor("country", {
      header: "Country",
      meta: { className: "hidden px-4 py-3 sm:table-cell" },
      cell: ({ row }) => <span className="text-[var(--product-text-secondary)]">{locationLabel(row.original.city, row.original.country)}</span>,
    }),
    ...(flags.showReferrals ? [columnHelper.accessor("position", {
      header: "Position",
      meta: { className: "hidden px-4 py-3 sm:table-cell" },
      cell: ({ getValue }) => <span className="text-[var(--product-text-secondary)]">{getValue() == null ? "—" : `#${getValue()}`}</span>,
    })] : []),
    columnHelper.accessor("points", {
      header: "Points",
      meta: { className: "hidden px-4 py-3 text-right tabular-nums sm:table-cell" },
      cell: ({ getValue }) => <span className="text-[var(--product-text-secondary)] tabular-nums">{(getValue() ?? 0).toLocaleString()}</span>,
    }),
    columnHelper.accessor("createdAt", {
      header: () => (
        <Button type="button" variant="ghost" size="sm" className="-ml-2 gap-1 px-2 font-medium text-[var(--product-text-secondary)]" onClick={toggleSort} aria-label={sort === "joined_asc" ? "Sort by newest first" : "Sort by oldest first"}>
          Joined <span aria-hidden="true">{sort === "joined_asc" ? "↑" : "↓"}</span>
        </Button>
      ),
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
    columnHelper.display({ id: "emailDelivery", header: "Email", meta: { className: "px-4 py-3" }, cell: ({ row }) => { const label = deliveryLabel(row.original); const failed = label === "Failed"; return <span className={`inline-flex items-center gap-1.5 text-xs ${failed ? "text-[#a03932]" : "text-[var(--product-text-secondary)]"}`} title={`Confirmation email: ${label}`}><HugeiconsIcon icon={Mail01Icon} size={15} aria-hidden="true" /><span className="sr-only">Confirmation email: </span>{label}</span>; } }),
  ], [columnHelper, flags.showReferrals, flags.sendEmailsToSubscribers, sort, copiedId, result.data, selectedIds]);
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
                <Button variant="outline" onClick={() => setSheet({ type: "import" })}>
                  <HugeiconsIcon icon={Upload01Icon} aria-hidden="true" /> Import
                </Button>
              )}
              <Button variant="outline" onClick={() => setSheet({ type: "export" })} disabled={isUpdating}>
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
          <Button variant="ghost" aria-pressed={deliveryFilter === "failed"} onClick={() => { setDeliveryFilter((value) => value === "failed" ? "all" : "failed"); setCursors([null]); setPageIndex(0); setSelectedIds([]); }}>Email failed</Button>
        </div>
        {selectedIds.length > 0 && <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm" role="group" aria-label="Selected signups"><span>{selectedIds.length} selected on this page</span><Button variant="outline" disabled={!canManage || retrying || selectedIds.length > 25 || !result.data.some((row) => selectedIds.includes(row.id) && !row.verifiedAt)} onClick={() => retryEmails(result.data.filter((row) => selectedIds.includes(row.id) && !row.verifiedAt).map((row) => row.id))}>{retrying ? "Sending…" : "Resend confirmations"}</Button><Button variant="ghost" onClick={() => setSelectedIds([])}>Clear selection</Button></div>}

        {error && <div className="product-field-error flex flex-wrap items-center justify-between gap-3 px-4 py-3" role="alert">
          <span>{result.data.length ? `Couldn’t refresh the list. Showing the last loaded results for ${appliedCriteriaLabel}.` : "Signups couldn’t be loaded."}</span>
          <Button variant="outline" onClick={() => setRetryCount((count) => count + 1)}>Try again</Button>
        </div>}
        <div className="overflow-x-auto">
           <Table className="w-full min-w-[48rem] table-fixed border-collapse text-left sm:table-auto">
            <TableHeader className="text-[var(--product-text-secondary)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => (
                  <TableHead key={header.id} scope="col" className={`font-medium ${header.column.columnDef.meta?.className || ""}`}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}</TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.original.id} className="product-audience-row cursor-pointer hover:bg-transparent" onClick={() => { setCopiedId(null); setSheet({ type: "profile", row: row.original }); }}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className || ""}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
              {!loading && !criteriaChanging && !error && rows.length === 0 && <TableRow><TableCell colSpan={columns.length} className="px-4 py-16 text-center"><HugeiconsIcon icon={UserGroupIcon} className="mx-auto mb-3 text-[var(--product-text-secondary)]" aria-hidden="true" /><p className="font-medium">{emptyTitle}</p><p className="mt-1 text-[var(--product-text-secondary)]">{emptyDescription}</p>{search || status !== "all" ? <Button className="mt-4" variant="outline" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Button> : <Link prefetch={false} className={`${buttonVariants({ variant: "outline" })} mt-4`} href={`/waitlists/${encodeURIComponent(waitlist.id)}`}>Open page builder</Link>}</TableCell></TableRow>}
              {isUpdating && rows.length === 0 && <>
                {[0, 1, 2, 3, 4].map((row) => <TableRow className="product-subscriber-skeleton-row" aria-hidden="true" key={row}><TableCell><i /></TableCell><TableCell><i /></TableCell><TableCell className="hidden sm:table-cell"><i /></TableCell><TableCell className="hidden sm:table-cell"><i /></TableCell><TableCell className="hidden sm:table-cell"><i /></TableCell></TableRow>)}
              </>}
            </TableBody>
          </Table>
        </div>
        <footer className="product-audience-pagination">
          <span aria-live="polite" aria-atomic="true">{showingStart}–{showingEnd} of {result.total}</span>
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
            <div className="px-4 pb-4">
            <dl className="grid gap-5 text-sm">
              <div className="grid grid-cols-[104px_1fr] gap-3"><dt className="text-[var(--product-text-secondary)]">Email</dt><dd className="break-all font-medium">{profile.email}</dd></div>
               {flags.sendEmailsToSubscribers && <div className="grid grid-cols-[104px_1fr] gap-3"><dt className="text-[var(--product-text-secondary)]">Status</dt><dd>{profileStatus}</dd></div>}
                <div className="grid grid-cols-[104px_1fr] gap-3"><dt className="text-[var(--product-text-secondary)]">Confirmation email</dt><dd><p>{deliveryLabel(profile)}</p>{profile.verificationDelivery?.issue && <p className="text-xs text-[var(--product-text-secondary)]">Issue: {profile.verificationDelivery.issue.replaceAll("_", " ").toLowerCase()}</p>}{!profile.verifiedAt && canManage && <Button className="mt-2" variant="outline" disabled={retrying} onClick={() => retryEmails([profile.id])}>{retrying ? "Sending…" : "Resend confirmation"}</Button>}</dd></div>
              {flags.showReferrals && <div className="grid grid-cols-[104px_1fr] gap-3"><dt className="text-[var(--product-text-secondary)]">Position</dt><dd className="tabular-nums">{profile.position == null ? "—" : `#${profile.position}`}</dd></div>}
              <div className="grid grid-cols-[104px_1fr] gap-3"><dt className="text-[var(--product-text-secondary)]">Joined</dt><dd title={formatDate(profile.createdAt)}>{timeAgo(profile.createdAt)}</dd></div>
              <div className="grid grid-cols-[104px_1fr] gap-3"><dt className="text-[var(--product-text-secondary)]">Location</dt><dd>{locationLabel(profile.city, profile.country) === "—" ? "Not available" : locationLabel(profile.city, profile.country)}</dd></div>
              <div className="grid grid-cols-[104px_1fr] gap-3"><dt className="text-[var(--product-text-secondary)]">Device</dt><dd title={profile.device || undefined}>{deviceLabel(profile.deviceType, profile.device)}</dd></div>
              {flags.showReferrals && <div className="grid grid-cols-[104px_1fr] gap-3"><dt className="text-[var(--product-text-secondary)]">Referrals</dt><dd className="tabular-nums">{profile.referralCount}</dd></div>}
              <div className="grid grid-cols-[104px_1fr] gap-3"><dt className="text-[var(--product-text-secondary)]">Points</dt><dd className="tabular-nums">{(profile.points ?? 0).toLocaleString()}</dd></div>
              <div className="grid grid-cols-[104px_1fr] gap-3"><dt className="text-[var(--product-text-secondary)]">Source</dt><dd>{profile.utmSource || "Direct"}</dd></div>
              {profileLink && <div className="grid grid-cols-[104px_1fr] items-center gap-3"><dt className="text-[var(--product-text-secondary)]">Referral link</dt><dd className="flex min-w-0 items-center gap-1.5"><span className="min-w-0 flex-1 truncate" title={profileLink}>{profileLink}</span><Button variant="ghost" size="icon-sm" className="shrink-0" aria-label="Copy referral link" onClick={() => copyText(profileLink, "sheet")}><HugeiconsIcon icon={copiedId === "sheet" ? Tick01Icon : CopyIcon} aria-hidden="true" /></Button></dd></div>}
            </dl>
            </div>
          </>}
          {sheet?.type === "export" && <>
            <SheetHeader><SheetTitle>Export signups</SheetTitle><SheetDescription>Choose columns. Exports the current search and filters.</SheetDescription></SheetHeader>
            <div className="grid gap-1 px-4 pb-4">
              <div className="flex gap-1 pb-1">
                <Button variant="ghost" size="sm" onClick={() => setExportColumns(EXPORT_COLUMNS.map((column) => column.key))}>Select all</Button>
                <Button variant="ghost" size="sm" onClick={() => setExportColumns([])}>Clear</Button>
              </div>
              {EXPORT_COLUMNS.map((column) => <Label key={column.key} className="flex items-center gap-3 py-1.5">
                <Checkbox checked={exportColumns.includes(column.key)} onCheckedChange={(checked) => setExportColumns((current) => {
                  const next = new Set(checked ? [...current, column.key] : current.filter((key) => key !== column.key));
                  return EXPORT_COLUMNS.map((item) => item.key).filter((key) => next.has(key));
                })} />
                <span>{column.label}</span>
              </Label>)}
              <Button onClick={exportCsv} disabled={exporting || exportColumns.length === 0 || isUpdating} aria-busy={exporting}><HugeiconsIcon icon={Download01Icon} aria-hidden="true" />{exporting ? "Preparing export…" : `Download CSV${exportColumns.length ? ` (${exportColumns.length} columns)` : ""}`}</Button>
            </div>
          </>}
          {sheet?.type === "import" && <>
            <SheetHeader><SheetTitle>Import signups</SheetTitle><SheetDescription>Email is required. Country, points, referral code, referred-by, verified and joined date are optional.</SheetDescription></SheetHeader>
            <div className="grid gap-3 px-4 pb-4">
              <a className="text-sm font-medium underline underline-offset-4" href={`data:text/csv;charset=utf-8,${encodeURIComponent(IMPORT_TEMPLATE_CSV)}`} download="waitlyze-import-template.csv">Download the CSV template</a>
              <form onSubmit={runImport} className="grid gap-3">
                <Input id="audience-import-file" name="file" type="file" accept=".csv,text/csv" required disabled={importing} aria-label="CSV file to import" />
                <Button type="submit" disabled={importing} aria-busy={importing}>{importing ? "Importing…" : "Import"}</Button>
              </form>
            </div>
          </>}
        </SheetContent>
      </Sheet>
      </>}
    </section>
  );
}
