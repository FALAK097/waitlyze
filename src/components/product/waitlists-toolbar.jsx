"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  Cancel01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
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
    <div className="w-full min-w-0 sm:max-w-80" role="search" aria-busy={isPending}>
      <Label className="sr-only" htmlFor="waitlist-search">
        Search waitlists by name
      </Label>
      <InputGroup className="h-10">
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id="waitlist-search"
          type="search"
          maxLength={WAITLIST_SEARCH_LIMIT}
          value={value}
          onChange={(event) => schedule(event.target.value)}
          placeholder="Search by name"
          autoComplete="off"
        />
        {value && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" onClick={clear} aria-label="Clear search">
              <HugeiconsIcon icon={Cancel01Icon} size={15} aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </div>
  );
}

export function StatusTabs({ query, status, sort }) {
  const [replace, isPending] = useReplaceParams();
  return (
    <div
      className="grid min-w-0 grid-cols-4 items-center gap-1"
      role="group"
      aria-label="Filter waitlists by status"
      aria-busy={isPending}
    >
      {WAITLIST_STATUS_FILTERS.map((filter) => (
        <button
          key={filter.value || "all"}
          type="button"
          className={cn(
            "inline-flex min-h-11 min-w-0 items-center justify-center border-0 border-b-2 border-transparent bg-transparent px-2 py-2.5 text-sm text-product-text-secondary hover:text-product-text-primary sm:px-3",
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
