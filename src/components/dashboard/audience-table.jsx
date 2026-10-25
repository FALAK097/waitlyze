"use client";

import {
  CopyIcon,
  CircleQuestionMarkIcon,
  Download01Icon,
  Mail01Icon,
  Search01Icon,
  Tick01Icon,
  Upload01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { importSignups } from "@/app/actions/audience-import";
import { retryFailedVerification } from "@/app/actions/verification-delivery";
import { ReferralReview } from "@/components/dashboard/referral-review";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EXPORT_COLUMNS, IMPORT_TEMPLATE_CSV } from "@/lib/audience-query.mjs";
import { formatProductDate } from "@/lib/product-date.mjs";

const PAGE_SIZE = 25;
const FILTER_OPTIONS = [
  { value: "all", label: "All signups" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Needs confirmation" },
  { value: "failed", label: "Email failed" },
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
  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "";
  const kind =
    typeof deviceType === "string" && deviceType
      ? deviceType.charAt(0).toUpperCase() + deviceType.slice(1)
      : "";
  return [kind, browser, os].filter(Boolean).join(" · ") || "Not available";
}

function SortHeaderButton({ label, active, direction, onToggle, actionLabel }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 gap-1 px-2 font-medium text-product-text-secondary"
      onClick={onToggle}
      aria-label={active ? actionLabel : `Sort by ${label}`}
    >
      {label} <span aria-hidden="true">{active ? (direction === "asc" ? "↑" : "↓") : "↕"}</span>
    </Button>
  );
}

export function AudienceTable({
  waitlist,
  initialReviews = [],
  initialReviewsFailed = false,
  canManage = false,
}) {
  const [view, setView] = useState("subscribers");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  // Single source of truth for the table filter. status/delivery are derived
  // together so the dropdown selection can never disagree with the query.
  const status = filter === "failed" ? "all" : filter;
  const deliveryFilter = filter === "failed" ? "failed" : "all";
  const [selectedIds, setSelectedIds] = useState([]);
  const [retrying, setRetrying] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(null);
  const [bulkPending, setBulkPending] = useState(false);
  const [deleteTyped, setDeleteTyped] = useState("");
  const [sort, setSort] = useState("joined_desc");
  const [selectAll, setSelectAll] = useState(false);
  const [selectTruncated, setSelectTruncated] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [cursors, setCursors] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [result, setResult] = useState({ data: [], total: 0, nextCursor: null, flags: null });
  const [loadedCriteria, setLoadedCriteria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportColumns, setExportColumns] = useState(() =>
    EXPORT_COLUMNS.map((column) => column.key),
  );
  const [importing, setImporting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const flags = result.flags || {
    showReferrals: waitlist.showReferrals,
    sendEmailsToSubscribers: waitlist.sendEmailsToSubscribers,
    publicSlug: waitlist.publicSlug,
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(query.trim());
      setCursors([null]);
      setPageIndex(0);
      setSelectedIds([]);
      setSelectAll(false);
      setSelectTruncated(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  function resetList() {
    setCursors([null]);
    setPageIndex(0);
    setSelectedIds([]);
    setSelectAll(false);
    setSelectTruncated(false);
  }

  function changeFilter(value) {
    setFilter(value);
    resetList();
  }

  const isJoinedSort = sort === "joined_asc" || sort === "joined_desc";

  function toggleSort() {
    setSort((current) => (current === "joined_asc" ? "joined_desc" : "joined_asc"));
    resetList();
  }

  function toggleColumnSort(column) {
    setSort((current) => {
      const [field, dir] = current.split("_");
      if (field === column) return `${column}_${dir === "asc" ? "desc" : "asc"}`;
      if (column === "email") return "email_asc";
      if (column === "points") return "points_desc";
      if (column === "status") return "status_desc";
      return "position_asc";
    });
    resetList();
  }

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ status, sort, delivery: deliveryFilter });
      if (search) params.set("q", search);
      params.set("page", String(pageIndex));
      if (isJoinedSort && cursors[pageIndex]) params.set("cursor", cursors[pageIndex]);
      try {
        const response = await fetch(
          `/api/wait-lists/${encodeURIComponent(waitlist.id)}/subscribers?${params}`,
          { signal, cache: "no-store" },
        );
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
    },
    [
      cursors,
      deliveryFilter,
      isJoinedSort,
      pageIndex,
      retryCount,
      search,
      sort,
      status,
      waitlist.id,
    ],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function exportCsv() {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        status,
        sort,
        delivery: deliveryFilter,
        columns: exportColumns.join(","),
      });
      if (search) params.set("q", search);
      const response = await fetch(
        `/api/wait-lists/${encodeURIComponent(waitlist.id)}/subscribers?${params}`,
        { method: "POST" },
      );
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
        const parts = [
          `${outcome.imported.toLocaleString()} signup${outcome.imported === 1 ? "" : "s"} imported`,
        ];
        if (outcome.duplicates > 0)
          parts.push(`${outcome.duplicates.toLocaleString()} already on the list`);
        if (outcome.invalid > 0)
          parts.push(`${outcome.invalid.toLocaleString()} failed validation`);
        if (outcome.referralsLinked > 0)
          parts.push(
            `${outcome.referralsLinked.toLocaleString()} referral${outcome.referralsLinked === 1 ? "" : "s"} linked`,
          );
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
    } catch (error) {
      toast.error(error.message || "Could not retry confirmation emails.");
    } finally {
      setRetrying(false);
    }
  }

  async function runBulkBatch(action, ids) {
    const response = await fetch(
      `/api/wait-lists/${encodeURIComponent(waitlist.id)}/subscribers/batch`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Unable to update signups.");
    return payload;
  }

  function refreshAfterBulk() {
    setSelectedIds([]);
    setSelectAll(false);
    setSelectTruncated(false);
    setRetryCount((count) => count + 1);
  }

  async function undoBulkOffboard(ids) {
    try {
      const payload = await runBulkBatch("resubscribe", ids);
      toast.success(
        `Marketing updates restored for ${payload.processed.toLocaleString()} signup${payload.processed === 1 ? "" : "s"}.`,
      );
      refreshAfterBulk();
    } catch (error) {
      toast.error(error.message || "Could not undo the offboard.");
    }
  }

  async function runBulk(action) {
    const ids = selectedIds;
    setBulkPending(true);
    try {
      const payload = await runBulkBatch(action, ids);
      if (action === "delete") {
        toast.success(
          `Deleted ${payload.deleted.toLocaleString()} signup${payload.deleted === 1 ? "" : "s"}. ` +
            `${payload.referralsSevered.toLocaleString()} referral edge${payload.referralsSevered === 1 ? " was" : "s were"} severed.`,
        );
        setBulkConfirm(null);
        setDeleteTyped("");
      } else {
        const fresh = payload.offboardedIds || [];
        if (!fresh.length) {
          toast.success("Everyone selected was already offboarded.");
        } else {
          const emailNote =
            payload.emailsQueued > 0
              ? ` ${payload.emailsQueued.toLocaleString()} goodbye email${payload.emailsQueued === 1 ? " is" : "s are"} on the way.`
              : payload.emailTemplateMissing
                ? " No offboarding template exists, so no goodbye emails were sent."
                : " Email delivery is not configured, so no goodbye emails were sent.";
          toast.success(
            `Offboarded ${fresh.length.toLocaleString()} signup${fresh.length === 1 ? "" : "s"}.${emailNote}`,
            {
              action: { label: "Undo", onClick: () => undoBulkOffboard(fresh) },
              duration: 30_000,
            },
          );
        }
        setBulkConfirm(null);
      }
      refreshAfterBulk();
    } catch (error) {
      toast.error(error.message || "Could not update the selected signups.");
    } finally {
      setBulkPending(false);
    }
  }

  async function selectAllMatching() {
    setSelecting(true);
    try {
      const params = new URLSearchParams({ status, sort, delivery: deliveryFilter });
      if (search) params.set("q", search);
      params.set("select", "ids");
      const response = await fetch(
        `/api/wait-lists/${encodeURIComponent(waitlist.id)}/subscribers?${params}`,
        { cache: "no-store" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to select signups.");
      setSelectedIds(payload.ids);
      setSelectAll(true);
      setSelectTruncated(Boolean(payload.truncated));
    } catch {
      toast.error("Could not select every signup. Try again.");
    } finally {
      setSelecting(false);
    }
  }

  function deliveryLabel(row) {
    const email = row.verificationDelivery;
    if (!email) return row.verifiedAt ? "No confirmation record" : "No confirmation email recorded";
    if (email.status === "DELIVERED") return "Accepted by sender";
    if (email.status === "PENDING" || email.status === "PROCESSING") return "Sending";
    if (email.issue === "RECIPIENT_SUPPRESSED") return "Not sent · suppressed";
    if (email.issue === "SIGNUP_NOT_SENDABLE")
      return deliveryFilter === "failed"
        ? "Failed · needs a fresh link"
        : "Not sent · no longer eligible";
    return "Failed";
  }

  function retryableVerification(row) {
    const email = row.verificationDelivery;
    return (
      !row.verifiedAt &&
      email?.status === "FAILED" &&
      email.issue !== "RECIPIENT_SUPPRESSED" &&
      (email.issue !== "SIGNUP_NOT_SENDABLE" || deliveryFilter === "failed")
    );
  }

  const showingStart = result.total === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const showingEnd = Math.min((pageIndex + 1) * PAGE_SIZE, result.total);
  const profile =
    sheet?.type === "profile"
      ? result.data.find((row) => row.id === sheet.row.id) || sheet.row
      : null;
  const profileStatus = useMemo(
    () => (profile?.verifiedAt ? "Verified" : "Needs confirmation"),
    [profile],
  );
  const profileLink =
    profile?.referralCode && flags.publicSlug && flags.showReferrals
      ? `${window.location.origin}/w/${flags.publicSlug}?r=${profile.referralCode}`
      : null;
  const requestedSearch = query.trim();
  const criteriaChanging =
    requestedSearch !== search ||
    loadedCriteria !== `${status}\u0000${search}\u0000${sort}\u0000${deliveryFilter}`;
  const isUpdating = loading || (criteriaChanging && !error);
  const loadedFilters = loadedCriteria?.split("\u0000") || [];
  const appliedCriteriaLabel = loadedCriteria
    ? `${loadedFilters[1] ? `“${loadedFilters[1]}” · ` : ""}${
        loadedFilters[3] === "failed"
          ? "Email failed"
          : FILTER_OPTIONS.find((option) => option.value === loadedFilters[0])?.label ||
            "All signups"
      }`
    : "the initial signup list";
  const emptyTitle =
    deliveryFilter === "failed"
      ? "No failed confirmation emails"
      : search
        ? "No signups match this search"
        : status === "verified"
          ? "No verified signups yet"
          : status === "pending"
            ? "No signups need confirmation"
            : "No signups yet";
  const emptyDescription =
    search || status !== "all" || deliveryFilter !== "all"
      ? "Try a different search or status filter."
      : "Publish and share your waitlist page to invite the first signups.";

  const columnHelper = useMemo(() => createColumnHelper(), []);
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "selection",
        header: () => (
          <Checkbox
            aria-label="Select all signups on this page"
            checked={
              result.data.length > 0 && result.data.every((row) => selectedIds.includes(row.id))
            }
            onCheckedChange={(checked) => {
              setSelectedIds(checked ? result.data.map((row) => row.id) : []);
              setSelectAll(false);
              setSelectTruncated(false);
            }}
          />
        ),
        meta: { className: "w-10 px-3" },
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.email}`}
            checked={selectedIds.includes(row.original.id)}
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={(checked) => {
              setSelectedIds((items) =>
                checked
                  ? [...items, row.original.id]
                  : items.filter((id) => id !== row.original.id),
              );
              setSelectAll(false);
              setSelectTruncated(false);
            }}
          />
        ),
      }),
      columnHelper.accessor("email", {
        header: "Email",
        meta: { className: "w-21/50 px-4 py-3 sm:w-auto" },
        cell: ({ row }) => (
          <span className="group inline-flex max-w-full items-center gap-1">
            <Button
              type="button"
              className="min-w-0 px-1 font-medium break-all underline-offset-4 focus-visible:underline sm:break-normal"
              variant="ghost"
              onClick={() => {
                setCopiedId(null);
                setSheet({ type: "profile", row: row.original });
              }}
            >
              {row.original.email}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Copy ${row.original.email}`}
              onClick={(event) => {
                event.stopPropagation();
                copyText(row.original.email, row.original.id);
              }}
            >
              <HugeiconsIcon
                icon={copiedId === row.original.id ? Tick01Icon : CopyIcon}
                aria-hidden="true"
              />
            </Button>
          </span>
        ),
      }),
      columnHelper.accessor("country", {
        header: "Country",
        meta: { className: "hidden px-4 py-3 sm:table-cell" },
        cell: ({ row }) => (
          <span className="text-product-text-secondary">
            {locationLabel(row.original.city, row.original.country)}
          </span>
        ),
      }),
      ...(flags.showReferrals
        ? [
            columnHelper.accessor("position", {
              header: () => (
                <SortHeaderButton
                  label="Position"
                  active={sort === "position_asc" || sort === "position_desc"}
                  direction={sort === "position_desc" ? "desc" : "asc"}
                  actionLabel={
                    sort === "position_asc"
                      ? "Sort by lowest position first"
                      : "Sort by leaderboard first"
                  }
                  onToggle={() => toggleColumnSort("position")}
                />
              ),
              meta: { className: "hidden px-4 py-3 sm:table-cell" },
              cell: ({ getValue }) => (
                <span className="text-product-text-secondary">
                  {getValue() == null ? "—" : `#${getValue()}`}
                </span>
              ),
            }),
          ]
        : []),
      columnHelper.accessor("points", {
        header: () => (
          <span className="inline-flex items-center gap-1">
            <SortHeaderButton
              label="Points"
              active={sort === "points_desc" || sort === "points_asc"}
              direction={sort === "points_asc" ? "asc" : "desc"}
              actionLabel={
                sort === "points_desc" ? "Sort by fewest points first" : "Sort by most points first"
              }
              onToggle={() => toggleColumnSort("points")}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      className="flex size-6 cursor-help items-center justify-center rounded-full border-0 bg-transparent p-0 text-product-text-secondary"
                      aria-label="How points work"
                    />
                  }
                >
                  <HugeiconsIcon icon={CircleQuestionMarkIcon} size={14} aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-64">
                  Verifying an email earns 50 points. When someone they referred verifies, the
                  referrer earns 30 points. Referrals only count while marked clear or approved, and
                  signups from one IP over the velocity limit earn nothing.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
        ),
        meta: { className: "hidden px-4 py-3 text-right tabular-nums sm:table-cell" },
        cell: ({ getValue }) => (
          <span className="text-product-text-secondary tabular-nums">
            {(getValue() ?? 0).toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: () => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1 px-2 font-medium text-product-text-secondary"
            onClick={toggleSort}
            aria-label={sort === "joined_asc" ? "Sort by newest first" : "Sort by oldest first"}
          >
            Joined <span aria-hidden="true">{sort === "joined_asc" ? "↑" : "↓"}</span>
          </Button>
        ),
        meta: { className: "hidden px-4 py-3 sm:table-cell" },
        cell: ({ getValue }) => (
          <span className="text-product-text-secondary" title={formatDate(getValue())}>
            {timeAgo(getValue())}
          </span>
        ),
      }),
      ...(flags.sendEmailsToSubscribers
        ? [
            columnHelper.accessor("verifiedAt", {
              header: () => (
                <SortHeaderButton
                  label="Status"
                  active={sort === "status_desc" || sort === "status_asc"}
                  direction={sort === "status_asc" ? "asc" : "desc"}
                  actionLabel={
                    sort === "status_desc" ? "Show needs confirmation first" : "Show verified first"
                  }
                  onToggle={() => toggleColumnSort("status")}
                />
              ),
              meta: { className: "w-29/50 px-4 py-3 text-right sm:w-auto sm:text-left" },
              cell: ({ getValue }) => {
                const verified = Boolean(getValue());
                return (
                  <span className={`product-status ${verified ? "product-status-success" : ""}`}>
                    <span aria-hidden="true">{verified ? "●" : "○"}</span>
                    {verified ? "Verified" : "Needs confirmation"}
                  </span>
                );
              },
            }),
          ]
        : []),
      columnHelper.display({
        id: "emailDelivery",
        header: "Confirmation",
        meta: { className: "px-4 py-3" },
        cell: ({ row }) => {
          const label = deliveryLabel(row.original);
          const failed = label === "Failed";
          return (
            <span
              className={`inline-flex items-center gap-1.5 text-xs ${failed ? "text-product-danger-text" : "text-product-text-secondary"}`}
              title={`Confirmation email: ${label}`}
            >
              <HugeiconsIcon icon={Mail01Icon} size={15} aria-hidden="true" />
              <span className="sr-only">Confirmation email: </span>
              {label}
            </span>
          );
        },
      }),
    ],
    [
      columnHelper,
      flags.showReferrals,
      flags.sendEmailsToSubscribers,
      sort,
      copiedId,
      result.data,
      selectedIds,
    ],
  );
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
    <section className="product-ui" aria-labelledby="audience-title">
      <header className="mb-7 flex items-center justify-between gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <h2 id="audience-title" className="text-2xl!">
              Signups
            </h2>
            <p className="product-description">
              People who joined {waitlist.name || "this waitlist"}.
            </p>
          </div>
          {view === "subscribers" && (
            <div className="flex flex-wrap gap-2">
              {canManage && (
                <Button variant="outline" onClick={() => setSheet({ type: "import" })}>
                  <HugeiconsIcon icon={Upload01Icon} aria-hidden="true" /> Import
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setSheet({ type: "export" })}
                disabled={isUpdating}
              >
                <HugeiconsIcon icon={Download01Icon} aria-hidden="true" /> Export
              </Button>
            </div>
          )}
        </div>
        <div
          className="mt-6 flex flex-wrap gap-2 [&_button[aria-pressed=true]]:bg-product-bg-inset [&_button[aria-pressed=true]]:text-product-text-primary"
          role="group"
          aria-label="Signup views"
        >
          <Button
            variant="ghost"
            aria-pressed={view === "subscribers"}
            onClick={() => setView("subscribers")}
          >
            Signups
          </Button>
          <Button
            variant="ghost"
            aria-pressed={view === "referrals"}
            onClick={() => setView("referrals")}
          >
            Referral review
            {initialReviews.filter((review) => review.reviewStatus === "NEEDS_REVIEW").length > 0 &&
              ` · ${initialReviews.filter((review) => review.reviewStatus === "NEEDS_REVIEW").length}`}
          </Button>
        </div>
      </header>

      {view === "referrals" ? (
        <ReferralReview
          waitListId={waitlist.id}
          initialReviews={initialReviews}
          initialLoadError={initialReviewsFailed}
          canManage={canManage}
        />
      ) : (
        <>
          <div className="min-w-0" aria-busy={isUpdating}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 max-[640px]:items-stretch">
              <Label className="relative block w-full sm:max-w-sm">
                <span className="sr-only">Search signups by email</span>
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-product-text-secondary"
                  aria-hidden="true"
                />
                <Input
                  className="pl-10"
                  type="search"
                  autoComplete="off"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by email"
                  maxLength={120}
                />
              </Label>
              <Select value={filter} onValueChange={changeFilter}>
                <SelectTrigger className="w-52 max-[640px]:w-full" aria-label="Filter signups">
                  <SelectValue>
                    {FILTER_OPTIONS.find((option) => option.value === filter)?.label ?? filter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedIds.length > 0 && (
              <div
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
                role="group"
                aria-label="Selected signups"
              >
                <span>
                  {selectAll
                    ? `All ${selectedIds.length.toLocaleString()} signups selected`
                    : `${selectedIds.length} selected on this page`}
                  {selectTruncated ? " (first 2,000)" : ""}
                </span>
                <Button
                  variant="outline"
                  disabled={
                    !canManage ||
                    retrying ||
                    selectAll ||
                    selectedIds.length > 25 ||
                    !result.data.some(
                      (row) => selectedIds.includes(row.id) && retryableVerification(row),
                    )
                  }
                  onClick={() =>
                    retryEmails(
                      result.data
                        .filter((row) => selectedIds.includes(row.id) && retryableVerification(row))
                        .map((row) => row.id),
                    )
                  }
                >
                  {retrying ? "Retrying…" : "Retry failed confirmations"}
                </Button>
                {(selectAll || selectedIds.length > 25) && (
                  <span className="text-product-text-secondary">
                    Select up to 25 at a time to retry.
                  </span>
                )}
                {canManage && (
                  <>
                    <Button
                      variant="outline"
                      disabled={bulkPending || selectedIds.length > 1000}
                      onClick={() => setBulkConfirm("offboard")}
                    >
                      Offboard
                    </Button>
                    <Button
                      variant="outline-destructive"
                      disabled={bulkPending || selectedIds.length > 1000}
                      onClick={() => {
                        setDeleteTyped("");
                        setBulkConfirm("delete");
                      }}
                    >
                      Delete
                    </Button>
                  </>
                )}
                {selectedIds.length > 1000 && (
                  <span className="text-product-text-secondary">
                    Bulk actions handle up to 1,000 at a time — narrow the search or filter first.
                  </span>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedIds([]);
                    setSelectAll(false);
                    setSelectTruncated(false);
                  }}
                >
                  Clear selection
                </Button>
              </div>
            )}
            {!selectAll &&
              selectedIds.length > 0 &&
              selectedIds.length === result.data.length &&
              result.total > result.data.length && (
                <div className="flex flex-wrap items-center gap-3 px-4 pb-1 text-sm text-product-text-secondary">
                  <span>All {result.data.length} on this page selected.</span>
                  <Button
                    variant="ghost"
                    disabled={selecting || !canManage}
                    onClick={selectAllMatching}
                  >
                    {selecting
                      ? "Selecting…"
                      : `Select all ${result.total.toLocaleString()} signups`}
                  </Button>
                </div>
              )}

            {error && (
              <div
                className="product-field-error flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                role="alert"
              >
                <span>
                  {result.data.length
                    ? `Couldn’t refresh the list. Showing the last loaded results for ${appliedCriteriaLabel}.`
                    : "Signups couldn’t be loaded."}
                </span>
                <Button variant="outline" onClick={() => setRetryCount((count) => count + 1)}>
                  Try again
                </Button>
              </div>
            )}
            <div className="overflow-x-auto [&_td]:px-3 [&_td]:py-4.5 [&_td:first-child]:pl-0 [&_td:last-child]:pr-0 [&_th]:border-b [&_th]:px-3 [&_th]:text-caption [&_th:first-child]:pl-0 [&_th:last-child]:pr-0">
              <Table className="w-full min-w-192 table-fixed border-collapse text-left sm:table-auto">
                <TableHeader className="text-product-text-secondary">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          scope="col"
                          className={`font-medium ${header.column.columnDef.meta?.className || ""}`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.original.id}
                      className="cursor-pointer hover:bg-transparent [&_button]:min-h-10 [&_button]:text-left [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-product-focus"
                      onClick={() => {
                        setCopiedId(null);
                        setSheet({ type: "profile", row: row.original });
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cell.column.columnDef.meta?.className || ""}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {!loading && !criteriaChanging && !error && rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="px-4 py-16 text-center">
                        <HugeiconsIcon
                          icon={UserGroupIcon}
                          className="mx-auto mb-3 text-product-text-secondary"
                          aria-hidden="true"
                        />
                        <p className="font-medium">{emptyTitle}</p>
                        <p className="mt-1 text-product-text-secondary">{emptyDescription}</p>
                        {search || status !== "all" ? (
                          <Button
                            className="mt-4"
                            variant="outline"
                            onClick={() => {
                              setQuery("");
                              setFilter("all");
                            }}
                          >
                            Clear filters
                          </Button>
                        ) : (
                          <Link
                            prefetch={false}
                            className={`${buttonVariants({ variant: "outline" })} mt-4`}
                            href={`/waitlists/${encodeURIComponent(waitlist.id)}`}
                          >
                            Open page builder
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  {isUpdating && rows.length === 0 && (
                    <>
                      {[0, 1, 2, 3, 4].map((row) => (
                        <TableRow aria-hidden="true" key={row}>
                          <TableCell className="h-16">
                            <i className="block h-3.5 w-4/5 rounded bg-product-bg-inset motion-safe:animate-pulse" />
                          </TableCell>
                          <TableCell className="h-16">
                            <i className="block h-5.5 w-24 rounded-full bg-product-bg-inset motion-safe:animate-pulse" />
                          </TableCell>
                          <TableCell className="hidden h-16 sm:table-cell">
                            <i className="block h-3.5 w-17/20 rounded bg-product-bg-inset motion-safe:animate-pulse" />
                          </TableCell>
                          <TableCell className="hidden h-16 sm:table-cell">
                            <i className="block h-3.5 w-10 rounded bg-product-bg-inset motion-safe:animate-pulse" />
                          </TableCell>
                          <TableCell className="hidden h-16 sm:table-cell">
                            <i className="block h-3.5 w-10 rounded bg-product-bg-inset motion-safe:animate-pulse" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-4 pt-6 text-caption text-product-text-secondary tabular-nums">
              <span aria-live="polite" aria-atomic="true">
                {showingStart}–{showingEnd} of {result.total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={pageIndex === 0 || isUpdating}
                  onClick={() => {
                    setSelectedIds([]);
                    setSelectAll(false);
                    setSelectTruncated(false);
                    setPageIndex((current) => Math.max(0, current - 1));
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!(isJoinedSort ? result.nextCursor : result.hasMore) || isUpdating}
                  onClick={() => {
                    setSelectedIds([]);
                    setSelectAll(false);
                    setSelectTruncated(false);
                    if (isJoinedSort) {
                      setCursors((current) => [
                        ...current.slice(0, pageIndex + 1),
                        result.nextCursor,
                      ]);
                    }
                    setPageIndex((current) => current + 1);
                  }}
                >
                  Next
                </Button>
              </div>
            </footer>
          </div>

          <Sheet
            open={sheet !== null}
            onOpenChange={(open) => {
              if (!open) setSheet(null);
            }}
          >
            <SheetContent className="min-w-0 overflow-x-hidden overflow-y-auto">
              {sheet?.type === "profile" && profile && (
                <>
                  <SheetHeader>
                    <SheetTitle>Signup details</SheetTitle>
                    <SheetDescription>Everything recorded for this signup.</SheetDescription>
                  </SheetHeader>
                  <div className="px-4 pb-4">
                    <dl className="grid gap-5 text-sm">
                      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                        <dt className="text-product-text-secondary">Email</dt>
                        <dd className="font-medium break-all">{profile.email}</dd>
                      </div>
                      {flags.sendEmailsToSubscribers && (
                        <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                          <dt className="text-product-text-secondary">Status</dt>
                          <dd>{profileStatus}</dd>
                        </div>
                      )}
                      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                        <dt className="text-product-text-secondary">Confirmation email</dt>
                        <dd>
                          <p>{deliveryLabel(profile)}</p>
                          {profile.verificationDelivery?.issue && (
                            <p className="text-xs text-product-text-secondary">
                              Issue:{" "}
                              {profile.verificationDelivery.issue
                                .replaceAll("_", " ")
                                .toLowerCase()}
                            </p>
                          )}
                          {retryableVerification(profile) && canManage && (
                            <Button
                              className="mt-2"
                              variant="outline"
                              disabled={retrying}
                              onClick={() => retryEmails([profile.id])}
                            >
                              {retrying ? "Retrying…" : "Retry confirmation"}
                            </Button>
                          )}
                        </dd>
                      </div>
                      {flags.showReferrals && (
                        <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                          <dt className="text-product-text-secondary">Position</dt>
                          <dd className="tabular-nums">
                            {profile.position == null ? "—" : `#${profile.position}`}
                          </dd>
                        </div>
                      )}
                      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                        <dt className="text-product-text-secondary">Joined</dt>
                        <dd title={formatDate(profile.createdAt)}>{timeAgo(profile.createdAt)}</dd>
                      </div>
                      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                        <dt className="text-product-text-secondary">Location</dt>
                        <dd>
                          {locationLabel(profile.city, profile.country) === "—"
                            ? "Not available"
                            : locationLabel(profile.city, profile.country)}
                        </dd>
                      </div>
                      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                        <dt className="text-product-text-secondary">Device</dt>
                        <dd title={profile.device || undefined}>
                          {deviceLabel(profile.deviceType, profile.device)}
                        </dd>
                      </div>
                      {flags.showReferrals && (
                        <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                          <dt className="text-product-text-secondary">Referrals</dt>
                          <dd className="tabular-nums">{profile.referralCount ?? "—"}</dd>
                        </div>
                      )}
                      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                        <dt className="text-product-text-secondary">Points</dt>
                        <dd className="tabular-nums">{(profile.points ?? 0).toLocaleString()}</dd>
                      </div>
                      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                        <dt className="text-product-text-secondary">Source</dt>
                        <dd>{profile.utmSource || "Direct"}</dd>
                      </div>
                      {flags.showReferrals && (
                        <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                          <dt className="text-product-text-secondary">Referred by</dt>
                          <dd className="min-w-0">
                            {profile.referredBy?.email ? (
                              <button
                                type="button"
                                title={profile.referredBy.email}
                                onClick={() =>
                                  setSheet({ type: "profile", row: profile.referredBy })
                                }
                                className="block w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left text-product-text-primary underline underline-offset-4 hover:text-product-text-secondary"
                              >
                                {profile.referredBy.email}
                              </button>
                            ) : (
                              "—"
                            )}
                          </dd>
                        </div>
                      )}
                      {profileLink && (
                        <div className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-3">
                          <dt className="text-product-text-secondary">Referral link</dt>
                          <dd className="flex min-w-0 items-center gap-1.5">
                            <span className="min-w-0 flex-1 truncate" title={profileLink}>
                              {profileLink}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="shrink-0"
                              aria-label="Copy referral link"
                              onClick={() => copyText(profileLink, "sheet")}
                            >
                              <HugeiconsIcon
                                icon={copiedId === "sheet" ? Tick01Icon : CopyIcon}
                                aria-hidden="true"
                              />
                            </Button>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </>
              )}
              {sheet?.type === "export" && (
                <>
                  <SheetHeader>
                    <SheetTitle>Export signups</SheetTitle>
                    <SheetDescription>
                      Choose columns. Exports the current search and filters.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-1 px-4 pb-4">
                    <div className="flex gap-1 pb-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExportColumns(EXPORT_COLUMNS.map((column) => column.key))}
                      >
                        Select all
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setExportColumns([])}>
                        Clear
                      </Button>
                    </div>
                    {EXPORT_COLUMNS.map((column) => (
                      <Label key={column.key} className="flex items-center gap-3 py-1.5">
                        <Checkbox
                          checked={exportColumns.includes(column.key)}
                          onCheckedChange={(checked) =>
                            setExportColumns((current) => {
                              const next = new Set(
                                checked
                                  ? [...current, column.key]
                                  : current.filter((key) => key !== column.key),
                              );
                              return EXPORT_COLUMNS.map((item) => item.key).filter((key) =>
                                next.has(key),
                              );
                            })
                          }
                        />
                        <span>{column.label}</span>
                      </Label>
                    ))}
                    <Button
                      onClick={exportCsv}
                      disabled={exporting || exportColumns.length === 0 || isUpdating}
                      aria-busy={exporting}
                    >
                      <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
                      {exporting
                        ? "Preparing export…"
                        : `Download CSV${exportColumns.length ? ` (${exportColumns.length} columns)` : ""}`}
                    </Button>
                  </div>
                </>
              )}
              {sheet?.type === "import" && (
                <>
                  <SheetHeader>
                    <SheetTitle>Import signups</SheetTitle>
                    <SheetDescription>
                      Email is required. Country, points, referral code, referred-by, verified and
                      joined date are optional.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-3 px-4 pb-4">
                    <a
                      className="text-sm font-medium underline underline-offset-4"
                      href={`data:text/csv;charset=utf-8,${encodeURIComponent(IMPORT_TEMPLATE_CSV)}`}
                      download="waitlyze-import-template.csv"
                    >
                      Download the CSV template
                    </a>
                    <form onSubmit={runImport} className="grid gap-3">
                      <Input
                        id="audience-import-file"
                        name="file"
                        type="file"
                        accept=".csv,text/csv"
                        required
                        disabled={importing}
                        aria-label="CSV file to import"
                      />
                      <Button type="submit" disabled={importing} aria-busy={importing}>
                        {importing ? "Importing…" : "Import"}
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>

          <ConfirmDialog
            open={bulkConfirm === "offboard"}
            onOpenChange={(open) => {
              if (!open && !bulkPending) setBulkConfirm(null);
            }}
            title={`Offboard ${selectedIds.length.toLocaleString()} signup${selectedIds.length === 1 ? "" : "s"}?`}
            description={
              "Offboarding keeps every row — position, points, and referral history stay exactly as they are — " +
              "and stops marketing emails immediately. Confirmation and other transactional emails are unaffected. " +
              "Where an offboarding template exists, each newly offboarded signup gets one goodbye email. " +
              "An Undo option appears for 30 seconds afterwards."
            }
            confirmLabel={`Offboard ${selectedIds.length.toLocaleString()} signup${selectedIds.length === 1 ? "" : "s"}`}
            pendingLabel="Offboarding…"
            variant="outline"
            onConfirm={() => runBulk("offboard")}
          />

          <Dialog
            open={bulkConfirm === "delete"}
            onOpenChange={(open) => {
              if (!open && !bulkPending) {
                setBulkConfirm(null);
                setDeleteTyped("");
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogTitle>
                Delete {selectedIds.length.toLocaleString()} signup
                {selectedIds.length === 1 ? "" : "s"}?
              </DialogTitle>
              <DialogDescription>
                This permanently removes the selected rows. There is no undo.
              </DialogDescription>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-product-text-secondary">
                <li>
                  Verification history, broadcast records, and automation runs for these signups are
                  removed with them.
                </li>
                <li>
                  Referral edges vanish with the rows: signups referred by deleted members lose
                  their “referred by” link and count as direct joins.
                </li>
                <li>
                  Referrers keep points they already earned; the append-only points ledger retains
                  its entries without pointing at anyone.
                </li>
              </ul>
              <Label className="grid gap-2">
                <span>
                  Type <strong className="tabular-nums">{selectedIds.length}</strong> to confirm
                </span>
                <Input
                  value={deleteTyped}
                  onChange={(event) => setDeleteTyped(event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={String(selectedIds.length)}
                  aria-label={`Type ${selectedIds.length} to confirm deletion`}
                />
              </Label>
              <div className="product-actions">
                <DialogClose render={<Button variant="outline" />} disabled={bulkPending}>
                  Cancel
                </DialogClose>
                <Button
                  variant="destructive"
                  disabled={bulkPending || deleteTyped.trim() !== String(selectedIds.length)}
                  onClick={() => runBulk("delete")}
                >
                  {bulkPending
                    ? "Deleting…"
                    : `Delete ${selectedIds.length.toLocaleString()} signup${selectedIds.length === 1 ? "" : "s"}`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </section>
  );
}
