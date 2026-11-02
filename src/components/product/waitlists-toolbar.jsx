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
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
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

const SearchContext = createContext(null);

export function WaitlistSearchProvider({ query, children }) {
  const [value, setValue] = useState(query);
  const valueRef = useRef(query);
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current === null) {
      valueRef.current = query;
      setValue(query);
    }
  }, [query]);
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const update = useCallback((next) => {
    valueRef.current = next;
    setValue(next);
  }, []);
  const cancelPending = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const currentQuery = useCallback(() => {
    cancelPending();
    return valueRef.current.trim().slice(0, WAITLIST_SEARCH_LIMIT);
  }, [cancelPending]);
  const schedule = useCallback(
    (next, commit) => {
      update(next);
      cancelPending();
      timer.current = setTimeout(() => {
        timer.current = null;
        commit(next.trim().slice(0, WAITLIST_SEARCH_LIMIT));
      }, 300);
    },
    [update, cancelPending],
  );
  const search = useMemo(
    () => ({ value, update, schedule, cancelPending, currentQuery }),
    [value, update, schedule, cancelPending, currentQuery],
  );

  return <SearchContext value={search}>{children}</SearchContext>;
}

function useSearch() {
  return useContext(SearchContext);
}

export function WaitlistSearch({ status, sort }) {
  const [replace, isPending] = useReplaceParams();
  const { value, update, schedule, cancelPending } = useSearch();
  function clear() {
    cancelPending();
    update("");
    replace({ query: "", status, sort });
  }
  return (
    <search className="w-full min-w-0 lg:max-w-80" aria-busy={isPending}>
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
          onChange={(event) =>
            schedule(event.target.value, (query) => replace({ query, status, sort }))
          }
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
    </search>
  );
}

export function StatusTabs({ query, status, sort }) {
  const [replace, isPending] = useReplaceParams();
  const search = useSearch();
  return (
    <fieldset
      className="grid min-w-0 grid-cols-4 items-center gap-1"
      aria-label="Filter waitlists by status"
      aria-busy={isPending}
    >
      {WAITLIST_STATUS_FILTERS.map((filter) => (
        <Button
          key={filter.value || "all"}
          type="button"
          variant="filter"
          size="filter"
          onClick={() =>
            replace({ query: search?.currentQuery() ?? query, status: filter.value, sort })
          }
          aria-pressed={status === filter.value}
        >
          {filter.label}
        </Button>
      ))}
    </fieldset>
  );
}

export function MobileWaitlistSort({ query, status, sort }) {
  const [replace, isPending] = useReplaceParams();
  const search = useSearch();
  return (
    <div className="flex items-center gap-2 text-caption text-product-text-secondary md:hidden">
      <label htmlFor="waitlist-mobile-sort">Sort by</label>
      <select
        id="waitlist-mobile-sort"
        value={sort}
        disabled={isPending}
        onChange={(event) =>
          replace({ query: search?.currentQuery() ?? query, status, sort: event.target.value })
        }
        className="min-h-11 rounded-md border border-product-border-subtle bg-product-bg-surface px-3 text-sm text-product-text-primary"
      >
        <option value="name-asc">Name A–Z</option>
        <option value="name-desc">Name Z–A</option>
        <option value="subscribers-desc">Most subscribers</option>
        <option value="subscribers-asc">Fewest subscribers</option>
      </select>
    </div>
  );
}

export function SortableHeading({ column, label, query, status, sort }) {
  const [replace] = useReplaceParams();
  const search = useSearch();
  const [activeColumn, direction] = sort.split("-");
  const active = activeColumn === column;
  const nextDirection = active && direction === "asc" ? "desc" : "asc";
  const initialDirection = column === "subscribers" ? "desc" : "asc";
  const nextSort = `${column}-${active ? nextDirection : initialDirection}`;
  const sortLabel = direction === "asc" ? "ascending" : "descending";
  const accessibleColumn = column === "subscribers" ? "subscriber count" : "name";
  return (
    <TableHead scope="col" aria-sort={active ? sortLabel : undefined}>
      <Button
        type="button"
        variant="table-sort"
        size="table-sort"
        onClick={() => replace({ query: search?.currentQuery() ?? query, status, sort: nextSort })}
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
      </Button>
    </TableHead>
  );
}
