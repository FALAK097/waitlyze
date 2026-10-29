"use client";

import { CheckmarkCircle02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { getCountries } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import labels from "react-phone-number-input/locale/en.json";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function Flag({ code }) {
  const Component = flags[code];
  return Component ? (
    <span className="inline-flex size-5 shrink-0 overflow-hidden rounded-sm [&>svg]:size-full">
      <Component title={labels[code] || code} />
    </span>
  ) : (
    <span aria-hidden="true" className="inline-flex size-5 shrink-0" />
  );
}

const emptySelection = [];

export function CountryMultiSelect({
  label,
  value = emptySelection,
  onChange,
  placeholder = "Search countries",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = Array.isArray(value) ? value : [];
  const countries = useMemo(
    () =>
      getCountries()
        .map((code) => ({ code, name: labels[code] || code }))
        .filter(({ code, name }) => {
          const search = query.trim().toLowerCase();
          return (
            !search || code.toLowerCase().includes(search) || name.toLowerCase().includes(search)
          );
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [query],
  );

  function toggle(code) {
    onChange(
      selected.includes(code) ? selected.filter((item) => item !== code) : [...selected, code],
    );
  }

  return (
    <div className="grid min-w-0 gap-1.5">
      <span className="text-caption font-semibold">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          aria-label={label}
          aria-expanded={open}
          className="flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-product-border-subtle bg-product-bg-surface px-3 text-left text-caption hover:bg-product-bg-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus"
        >
          <span className="min-w-0 truncate text-product-text-secondary">
            {selected.length
              ? selected.map((code) => labels[code] || code).join(", ")
              : "All countries"}
          </span>
          <span className="shrink-0 text-micro text-product-text-muted">
            {selected.length ? `${selected.length} selected` : "Choose"}
          </span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 sm:w-80">
          <label className="mb-2 flex h-10 items-center gap-2 rounded-md border border-product-border-subtle px-2.5">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="shrink-0 text-product-text-muted"
            />
            <input
              autoComplete="off"
              className="min-w-0 flex-1 border-0 bg-transparent text-caption outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              value={query}
            />
          </label>
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="sr-only">{label}</legend>
            <div className="max-h-64 overflow-y-auto">
              {countries.length ? (
                countries.map(({ code, name }) => {
                  const checked = selected.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={checked}
                      onClick={() => toggle(code)}
                      className="flex min-h-10 w-full items-center gap-2 rounded-md border-0 bg-transparent px-2 text-left text-caption hover:bg-product-bg-inset"
                    >
                      <Flag code={code} />
                      <span className="min-w-0 flex-1 truncate">{name}</span>
                      <span
                        className={cn(
                          "grid size-4 place-items-center rounded border",
                          checked && "border-product-accent-solid bg-product-accent-solid",
                        )}
                      >
                        {checked && (
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            size={13}
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="px-2 py-4 text-center text-caption text-product-text-secondary">
                  No countries found.
                </p>
              )}
            </div>
          </fieldset>
          <div className="mt-2 flex items-center justify-between border-t border-product-border-subtle pt-2">
            <span className="text-micro text-product-text-secondary">
              {selected.length ? `${selected.length} selected` : "No restriction"}
            </span>
            <button
              className="min-h-8 rounded-md border-0 bg-transparent px-2 text-micro font-semibold text-product-text-secondary hover:bg-product-bg-inset"
              type="button"
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
            >
              Clear selection
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
