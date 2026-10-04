"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Search, Users } from "lucide-react";
import { Button } from "@/components/product/button";
import { Input } from "@/components/product/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/product/dialog";
import { ReferralReview } from "@/components/dashboard/referral-review";

const PAGE_SIZE = 25;
const statuses = [
  { value: "all", label: "All subscribers" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Needs confirmation" },
];

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export function AudienceTable({ waitlist, initialReviews = [], canManage = false }) {
  const [view, setView] = useState("subscribers");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [cursors, setCursors] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [result, setResult] = useState({ data: [], total: 0, nextCursor: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(query.trim()), 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setCursors([null]);
    setPageIndex(0);
  }, [search, status]);

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
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError(loadError.message || "Unable to load subscribers.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [cursors, pageIndex, search, status, waitlist.id]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function exportCsv() {
    setExporting(true);
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
      setError("The export could not be created. Try again.");
    } finally {
      setExporting(false);
    }
  }

  const showingStart = result.total === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const showingEnd = Math.min((pageIndex + 1) * PAGE_SIZE, result.total);
  const selectedStatus = useMemo(() => selected?.verifiedAt ? "Verified" : "Needs confirmation", [selected]);

  return (
    <section className="product-ui" aria-labelledby="audience-title">
      <header className="product-page-heading">
        <span className="product-eyebrow">WAITLIST / SUBSCRIBERS</span>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <h1 id="audience-title">Subscribers</h1>
            <p className="product-description">People who joined {waitlist.name || "this waitlist"}.</p>
          </div>
          {view === "subscribers" && (
            <Button variant="outline" onClick={exportCsv} disabled={exporting} aria-busy={exporting}>
              <Download aria-hidden="true" /> {exporting ? "Preparing export…" : "Export CSV"}
            </Button>
          )}
        </div>
        <div className="mt-4 flex gap-2" role="group" aria-label="Subscriber views">
          <Button variant={view === "subscribers" ? "outline" : "ghost"} aria-pressed={view === "subscribers"} onClick={() => setView("subscribers")}>Subscribers</Button>
          <Button variant={view === "referrals" ? "outline" : "ghost"} aria-pressed={view === "referrals"} onClick={() => setView("referrals")}>Referral review{initialReviews.filter((review) => review.reviewStatus === "NEEDS_REVIEW").length > 0 && ` · ${initialReviews.filter((review) => review.reviewStatus === "NEEDS_REVIEW").length}`}</Button>
        </div>
      </header>

      {view === "referrals" ? <ReferralReview waitListId={waitlist.id} initialReviews={initialReviews} canManage={canManage} /> : <>

      <div className="product-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--product-border-subtle)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">Search subscribers by email</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--product-text-secondary)]" aria-hidden="true" />
            <Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by email" maxLength={120} />
          </label>
          <div className="flex gap-1 overflow-x-auto" role="group" aria-label="Filter subscribers by status">
            {statuses.map((item) => (
              <Button key={item.value} variant="ghost" aria-pressed={status === item.value} onClick={() => setStatus(item.value)}>{item.label}</Button>
            ))}
          </div>
        </div>

        {error && <p className="product-field-error px-4 py-3" role="alert">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse text-left">
            <thead className="bg-[var(--product-bg-inset)] text-[var(--product-text-secondary)]">
              <tr><th scope="col" className="px-4 py-3 font-medium">Email</th><th scope="col" className="px-4 py-3 font-medium">Status</th><th scope="col" className="px-4 py-3 font-medium">Joined</th><th scope="col" className="px-4 py-3 font-medium">Referrals</th></tr>
            </thead>
            <tbody>
              {result.data.map((subscriber) => (
                <tr key={subscriber.id} className="border-t border-[var(--product-border-subtle)]">
                  <td className="px-4 py-3"><button type="button" className="font-medium underline-offset-4 hover:underline focus-visible:underline" onClick={() => setSelected(subscriber)}>{subscriber.email}</button></td>
                  <td className="px-4 py-3"><span className={`product-status ${subscriber.verifiedAt ? "product-status-success" : ""}`}><span aria-hidden="true">{subscriber.verifiedAt ? "●" : "○"}</span>{subscriber.verifiedAt ? "Verified" : "Needs confirmation"}</span></td>
                  <td className="px-4 py-3 text-[var(--product-text-secondary)]">{formatDate(subscriber.createdAt)}</td>
                  <td className="px-4 py-3 text-[var(--product-text-secondary)]">{subscriber.referralCount}</td>
                </tr>
              ))}
              {!loading && result.data.length === 0 && <tr><td colSpan={4} className="px-4 py-16 text-center"><Users className="mx-auto mb-3 text-[var(--product-text-secondary)]" aria-hidden="true" /><p className="font-medium">{search ? "No subscribers match this search" : "No subscribers yet"}</p><p className="mt-1 text-[var(--product-text-secondary)]">New signups will appear here.</p></td></tr>}
              {loading && result.data.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-[var(--product-text-secondary)]">Loading subscribers…</td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--product-border-subtle)] px-4 py-3 text-[var(--product-text-secondary)]">
          <span aria-live="polite" aria-atomic="true">{loading ? "Updating subscribers…" : `${showingStart}–${showingEnd} of ${result.total}`}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={pageIndex === 0 || loading} onClick={() => setPageIndex((current) => Math.max(0, current - 1))}>Previous</Button>
            <Button variant="outline" disabled={!result.nextCursor || loading} onClick={() => { setCursors((current) => [...current.slice(0, pageIndex + 1), result.nextCursor]); setPageIndex((current) => current + 1); }}>Next</Button>
          </div>
        </footer>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent>
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
