"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatProductDate } from "@/lib/product-date.mjs";

const PANEL = [
  "min-w-0 overflow-hidden rounded-xl border border-product-border-subtle",
  "bg-product-bg-surface shadow-xs",
].join(" ");

/** Funnel pipeline: stage counts, per-signup movement, founder renaming. */
export function PipelineBoard({ waitListId, canManage = false }) {
  const [stages, setStages] = useState([]);
  const [recent, setRecent] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [movingId, setMovingId] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [retryCount, setRetryCount] = useState(0);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/wait-lists/${encodeURIComponent(waitListId)}/pipeline`, {
          signal,
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load the pipeline.");
        if (signal.aborted) return;
        setStages(payload.stages);
        setRecent(payload.recent);
        setTotal(payload.total);
        setDrafts(Object.fromEntries(payload.stages.map((stage) => [stage.key, stage.label])));
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError("Unable to load the pipeline.");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [waitListId, retryCount],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function moveSignup(signupId, stage) {
    setMovingId(signupId);
    try {
      const response = await fetch(`/api/wait-lists/${encodeURIComponent(waitListId)}/pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signupId, stage }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to move the signup.");
      setStages((current) =>
        current.map((entry) => {
          const previous = recent.find((row) => row.id === signupId)?.stage;
          if (entry.key === stage) return { ...entry, count: entry.count + 1 };
          if (entry.key === previous) return { ...entry, count: Math.max(0, entry.count - 1) };
          return entry;
        }),
      );
      setRecent((current) => current.map((row) => (row.id === signupId ? { ...row, stage } : row)));
      toast.success("Signup moved.");
    } catch (moveError) {
      toast.error(moveError.message || "Could not move the signup.");
    } finally {
      setMovingId(null);
    }
  }

  async function renameStages(event) {
    event.preventDefault();
    setRenaming(true);
    try {
      const response = await fetch(`/api/wait-lists/${encodeURIComponent(waitListId)}/pipeline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stages: stages.map((stage) => ({
            key: stage.key,
            label: drafts[stage.key] ?? stage.label,
          })),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to rename the stages.");
      setStages((current) =>
        current.map((stage) => ({ ...stage, label: drafts[stage.key] ?? stage.label })),
      );
      toast.success("Pipeline stages renamed.");
    } catch (renameError) {
      toast.error(renameError.message || "Could not rename the stages.");
    } finally {
      setRenaming(false);
    }
  }

  if (loading && !stages.length) {
    return (
      <p
        className="rounded-xl border border-product-border-subtle px-4 py-10 text-center text-sm text-product-text-secondary"
        role="status"
      >
        Loading pipeline…
      </p>
    );
  }

  if (error && !stages.length) {
    return (
      <div
        className="rounded-xl border border-product-border-subtle px-4 py-10 text-center text-sm text-product-text-secondary"
        role="alert"
      >
        <p className="pb-3 font-medium text-product-text-primary">{error}</p>
        <Button variant="outline" onClick={() => setRetryCount((count) => count + 1)}>
          Try again
        </Button>
      </div>
    );
  }

  const max = Math.max(1, ...stages.map((stage) => stage.count));
  return (
    <div className="grid gap-4" aria-busy={loading}>
      <div className={PANEL}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold">Pipeline stages</h3>
          <span className="text-micro font-medium text-product-text-secondary tabular-nums">
            {total.toLocaleString()} {total === 1 ? "signup" : "signups"}
          </span>
        </div>
        <ol className="m-0 grid list-none gap-0 p-0 sm:grid-cols-4">
          {stages.map((stage) => (
            <li
              key={stage.key}
              className="grid gap-1 border-t border-product-border-subtle px-4 py-3.5 max-sm:first:border-t-0 sm:border-s sm:first:border-s-0"
            >
              <span className="text-xs font-medium text-product-text-primary">{stage.label}</span>
              <span className="font-product-display text-2xl font-semibold tracking-tighter tabular-nums">
                {stage.count.toLocaleString()}
              </span>
              <span
                className="h-1.5 overflow-hidden rounded-full bg-product-bg-inset"
                role="img"
                aria-label={`${stage.label}: ${stage.count} of ${total} signups`}
              >
                <span
                  className="block h-full w-(--stage-w) rounded-full bg-product-accent-solid"
                  style={{ "--stage-w": `${Math.round((stage.count / max) * 100)}%` }}
                />
              </span>
            </li>
          ))}
        </ol>
      </div>

      {canManage ? (
        <form onSubmit={renameStages} className={PANEL} aria-label="Rename pipeline stages">
          <h3 className="px-4 pt-4 pb-1 text-sm font-semibold">Rename stages</h3>
          <p className="px-4 pb-3 text-xs text-product-text-secondary">
            Names are yours to choose; the four stages themselves stay fixed so the launch flow can
            rely on them.
          </p>
          <div className="grid gap-3 border-t border-product-border-subtle px-4 py-4 sm:grid-cols-2">
            {stages.map((stage) => (
              <label key={stage.key} className="grid gap-1 text-xs font-medium">
                <span className="text-product-text-secondary">{stage.key}</span>
                <Input
                  value={drafts[stage.key] ?? stage.label}
                  maxLength={40}
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [stage.key]: event.target.value }))
                  }
                />
              </label>
            ))}
          </div>
          <div className="flex justify-end border-t border-product-border-subtle px-4 py-3">
            <Button type="submit" variant="outline" disabled={renaming}>
              {renaming ? "Saving…" : "Save names"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className={PANEL}>
        <h3 className="px-4 pt-4 pb-2 text-sm font-semibold">Latest signups</h3>
        {recent.length ? (
          <ul className="m-0 grid list-none gap-0 p-0">
            {recent.map((row) => (
              <li
                key={row.id}
                className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-product-border-subtle px-4 py-2.5 text-xs"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-product-text-primary">
                    {row.email}
                  </span>
                  <span className="block text-micro text-product-text-secondary">
                    {formatProductDate(row.createdAt)}
                    {row.verified ? " · verified" : ""}
                  </span>
                </span>
                {canManage ? (
                  <label className="flex shrink-0 items-center gap-2">
                    <span className="sr-only">Move {row.email} to a stage</span>
                    <select
                      className="min-h-9 cursor-pointer rounded-lg border border-product-border-control bg-product-bg-surface px-2 py-1.5 text-xs text-product-text-primary"
                      value={row.stage}
                      disabled={movingId === row.id}
                      onChange={(event) => moveSignup(row.id, event.target.value)}
                      aria-label={`Move ${row.email} to a stage`}
                    >
                      {stages.map((stage) => (
                        <option key={stage.key} value={stage.key}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <span className="shrink-0 text-micro text-product-text-secondary">
                    {stages.find((stage) => stage.key === row.stage)?.label ?? row.stage}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-product-border-subtle px-4 py-6 text-center text-xs text-product-text-secondary">
            No signups yet.
          </p>
        )}
      </div>
    </div>
  );
}
