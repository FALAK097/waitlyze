"use client";

import { Combobox } from "@base-ui/react/combobox";
import { ArrowDown01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useRef, useState } from "react";
import { getCountries } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import labels from "react-phone-number-input/locale/en.json";

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
  const anchorRef = useRef(null);
  const selected = Array.isArray(value) ? value.map((code) => String(code).toUpperCase()) : [];
  const allCountries = useMemo(
    () =>
      getCountries()
        .map((code) => ({ code, name: labels[code] || code }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const countries = useMemo(() => {
    const search = query.trim().toLowerCase();
    return allCountries.filter(
      ({ code, name }) =>
        !search || code.toLowerCase().includes(search) || name.toLowerCase().includes(search),
    );
  }, [allCountries, query]);
  const selectedCountries = selected.map(
    (code) => allCountries.find((country) => country.code === code) ?? { code, name: code },
  );

  return (
    <div className="grid min-w-0 gap-1.5">
      <span className="text-caption font-semibold">{label}</span>
      <Combobox.Root
        multiple
        autoHighlight
        open={open}
        onOpenChange={setOpen}
        items={allCountries}
        filteredItems={countries}
        value={selectedCountries}
        inputValue={query}
        onInputValueChange={setQuery}
        onValueChange={(next) => {
          onChange(next.map((country) => country.code));
          setQuery("");
        }}
        itemToStringLabel={(country) => country.name}
        itemToStringValue={(country) => country.code}
        isItemEqualToValue={(item, selectedItem) => item.code === selectedItem.code}
      >
        <Combobox.Chips
          ref={anchorRef}
          className="flex min-h-10 w-full min-w-0 flex-wrap items-center gap-1.5 rounded-lg border border-product-border-subtle bg-product-bg-surface px-2 py-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-product-focus"
        >
          <Combobox.Value>
            {(values) =>
              values.map((country) => (
                <Combobox.Chip
                  key={country.code}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-product-border-subtle bg-product-bg-inset py-1 ps-1.5 pe-1 text-micro text-product-text-primary"
                >
                  <Flag code={country.code} />
                  <span className="max-w-32 truncate">{country.name}</span>
                  <Combobox.ChipRemove
                    aria-label={`Remove ${country.name}`}
                    className="grid size-5 shrink-0 place-items-center rounded border-0 bg-transparent text-product-text-secondary hover:bg-product-bg-surface hover:text-product-text-primary"
                  >
                    <span aria-hidden="true">×</span>
                  </Combobox.ChipRemove>
                </Combobox.Chip>
              ))
            }
          </Combobox.Value>
          <Combobox.Input
            aria-label={label}
            autoComplete="off"
            className="h-7 min-w-20 flex-1 border-0 bg-transparent px-1 text-caption outline-none placeholder:text-product-text-muted"
            placeholder={selected.length ? "Add a country…" : placeholder}
          />
          <Combobox.Trigger
            aria-label={`Show ${label.toLowerCase()}`}
            className="grid size-7 shrink-0 place-items-center rounded-md border-0 bg-transparent text-product-text-muted hover:bg-product-bg-inset"
          >
            <HugeiconsIcon icon={ArrowDown01Icon} size={16} aria-hidden="true" />
          </Combobox.Trigger>
        </Combobox.Chips>
        <Combobox.Portal>
          <Combobox.Positioner anchor={anchorRef} align="start" sideOffset={5} className="z-50">
            <Combobox.Popup className="w-(--anchor-width) min-w-64 overflow-hidden rounded-lg border border-product-border-subtle bg-product-bg-surface p-1 shadow-lg">
              <Combobox.List className="max-h-64 overflow-y-auto">
                {countries.map(({ code, name }) => (
                  <Combobox.Item
                    key={code}
                    value={allCountries.find((country) => country.code === code)}
                    className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-caption outline-none data-[highlighted]:bg-product-bg-inset data-[selected]:font-semibold"
                  >
                    <Flag code={code} />
                    <span className="min-w-0 flex-1 truncate">{name}</span>
                    <Combobox.ItemIndicator>
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={15}
                        className="text-product-accent-label"
                        aria-hidden="true"
                      />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                ))}
                <Combobox.Empty className="px-2 py-4 text-center text-caption text-product-text-secondary">
                  No countries found.
                </Combobox.Empty>
              </Combobox.List>
              <div className="flex min-h-9 items-center justify-between gap-3 border-t border-product-border-subtle px-2 pt-1.5">
                <span className="text-micro text-product-text-secondary">
                  {selected.length ? `${selected.length} selected` : "No restriction"}
                </span>
                {selected.length > 0 ? (
                  <button
                    className="min-h-7 rounded-md border-0 bg-transparent px-2 text-micro font-semibold text-product-text-secondary hover:bg-product-bg-inset"
                    type="button"
                    onClick={() => onChange([])}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}
