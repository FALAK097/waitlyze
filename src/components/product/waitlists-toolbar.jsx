"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon, ArrowUpDownIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TableHead } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  WAITLIST_SEARCH_LIMIT,
  WAITLIST_STATUS_FILTERS,
  WAITLIST_DEFAULT_SORT,
} from "@/lib/waitlist-search.mjs";

export function waitlistsHref({ query, status, sort, page = 1, includeQuery = true }) {
  const search = new URLSearchParams();
  if (includeQuery && query) search.set("q", query);
  if (status) search.set("status", status);
  if (sort !== WAITLIST_DEFAULT_SORT) search.set("sort", sort);
  if (page > 1) search.set("page", String(page));
  const serialized = search.toString();
  return serialized ? `/waitlists?${serialized}` : "/waitlists";
}

function useReplaceParams() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  function replace(params) {
    startTransition(() => {
      router.replace(waitlistsHref(params), { scroll: false });
    });
  }
  return [replace, isPending];
}

export function WaitlistSearch({ query, status, sort }) {
  const [replace, isPending] = useReplaceParams();
  const [value, setValue] = useState(query);
  const timer = useRef(null);
  useEffect(() => { setValue(query); }, [query]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function schedule(next) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      replace({ query: next.trim().slice(0, WAITLIST_SEARCH_LIMIT), status, sort });
    }, 300);
  }
  function clear() {
    if (timer.current) clearTimeout(timer.current);
    setValue("");
    replace({ query: "", status, sort });
  }
  return (
    <div className="product-waitlist-search" role="search" aria-busy={isPending}>
      <Label className="sr-only" htmlFor="waitlist-search">Search waitlists by name</Label>
      <Input
        id="waitlist-search"
        type="search"
        maxLength={WAITLIST_SEARCH_LIMIT}
        value={value}
        onChange={(event) => schedule(event.target.value)}
        placeholder="Search by name"
        autoComplete="off"
      />
      {value && (
        <button type="button" className="product-waitlist-search-clear" onClick={clear} aria-label="Clear search">
          <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function StatusTabs({ query, status, sort }) {
  const [replace, isPending] = useReplaceParams();
  return (
    <div className="product-waitlist-filters" role="group" aria-label="Filter waitlists by status" aria-busy={isPending}>
      {WAITLIST_STATUS_FILTERS.map((filter) => (
        <button
          key={filter.value || "all"}
          type="button"
          onClick={() => replace({ query, status: filter.value, sort })}
          aria-current={status === filter.value ? "page" : undefined}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export function SortableHeading({ column, label, query, status, sort }) {
  const [replace] = useReplaceParams();
  const [activeColumn, direction] = sort.split("-");
  const active = activeColumn === column;
  const nextDirection = active && direction === "asc" ? "desc" : "asc";
  const initialDirection = column === "subscribers" ? "desc" : "asc";
  const nextSort = `${column}-${active ? nextDirection : initialDirection}`;
  const sortLabel = direction === "asc" ? "ascending" : "descending";
  const accessibleColumn = column === "subscribers" ? "subscriber count" : "name";
  return (
    <TableHead scope="col" aria-sort={active ? sortLabel : undefined}>
      <button
        type="button"
        className="product-table-sort"
        onClick={() => replace({ query, status, sort: nextSort })}
        aria-label={`Sort by ${accessibleColumn}${active ? `, currently ${sortLabel}` : ""}`}
      >
        <span>{label}</span>
        <span className={`product-table-sort-indicator${active ? " is-active" : ""}`} aria-hidden="true">
          {active ? (direction === "asc" ? <HugeiconsIcon icon={ArrowUp01Icon} /> : <HugeiconsIcon icon={ArrowDown01Icon} />) : <HugeiconsIcon icon={ArrowUpDownIcon} />}
        </span>
      </button>
    </TableHead>
  );
}
