"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  WAITLIST_SEARCH_LIMIT,
  WAITLIST_STATUS_FILTERS,
  waitlistsHref,
} from "@/lib/waitlist-search.mjs";

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
  useEffect(() => {
    setValue(query);
  }, [query]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
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
    <div
      className="relative ms-auto max-w-90 min-w-0 min-w-55 shrink-1 grow-0 basis-90 max-[767px]:ms-0 max-[767px]:max-w-none max-[767px]:min-w-0 max-[767px]:grow max-[767px]:basis-auto [&_input]:w-full [&_input]:pr-10"
      role="search"
      aria-busy={isPending}
    >
      <Label className="sr-only" htmlFor="waitlist-search">
        Search waitlists by name
      </Label>
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute end-1 top-1/2 -translate-y-1/2"
          onClick={clear}
          aria-label="Clear search"
        >
          <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

export function StatusTabs({ query, status, sort }) {
  const [replace, isPending] = useReplaceParams();
  return (
    <div
      className="mb-8 flex flex-wrap gap-5 max-[767px]:basis-full"
      role="group"
      aria-label="Filter waitlists by status"
      aria-busy={isPending}
    >
      {WAITLIST_STATUS_FILTERS.map((filter) => (
        <button
          key={filter.value || "all"}
          type="button"
          className={cn(
            "inline-flex min-h-11 items-center border-0 border-b-2 border-transparent bg-transparent py-2.5 text-sm text-product-text-secondary hover:text-product-text-primary",
            status === filter.value &&
              "border-product-accent-solid font-semibold text-product-text-primary",
          )}
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
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 border-0 bg-transparent px-1 whitespace-nowrap text-inherit hover:text-product-text-primary"
        onClick={() => replace({ query, status, sort: nextSort })}
        aria-label={`Sort by ${accessibleColumn}${active ? `, currently ${sortLabel}` : ""}`}
      >
        <span>{label}</span>
        <span
          className={cn(
            "text-base leading-none text-product-text-secondary",
            active && "text-product-text-primary",
          )}
          aria-hidden="true"
        >
          {active ? (
            direction === "asc" ? (
              <HugeiconsIcon icon={ArrowUp01Icon} />
            ) : (
              <HugeiconsIcon icon={ArrowDown01Icon} />
            )
          ) : (
            <HugeiconsIcon icon={ArrowUpDownIcon} />
          )}
        </span>
      </button>
    </TableHead>
  );
}
