"use client";

import { Combobox } from "@base-ui/react/combobox";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { forwardRef, useId, useMemo, useState } from "react";
import PhoneInputPrimitive, { getCountries, getCountryCallingCode } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import enLabels from "react-phone-number-input/locale/en.json";

import { cn } from "@/lib/utils";

// Product-styled phone field with a searchable flag country picker. Values
// are E.164 in and out (`undefined` when empty); the library owns parsing,
// formatting, country data, and flags while the server stays the validation
// authority.
function CountryFlag({ country, className }) {
  const Flag = country ? flags[country] : null;
  if (!Flag) return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-4 w-[22px] shrink-0 overflow-hidden rounded-[2px] [&>svg]:block [&>svg]:h-full [&>svg]:w-full",
        className,
      )}
    >
      <Flag title={country} />
    </span>
  );
}

function countryLabel(code, labels) {
  return (labels && labels[code]) || enLabels[code] || code;
}

function CountrySelect({ value, onChange, options, labels, className, ...rest }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const codes = useMemo(() => {
    if (Array.isArray(options) && options.length > 0)
      return options
        .map((option) => (typeof option === "string" ? option : option?.value))
        .filter(Boolean);
    return getCountries();
  }, [options]);
  const countriesByDialFragment = useMemo(() => {
    const matches = new Map();
    for (const code of codes) {
      const callingCode = getCountryCallingCode(code);
      for (let start = 0; start < callingCode.length; start += 1) {
        for (let end = start + 1; end <= callingCode.length; end += 1) {
          const fragment = callingCode.slice(start, end);
          let countries = matches.get(fragment);
          if (!countries) {
            countries = new Set();
            matches.set(fragment, countries);
          }
          countries.add(code);
        }
      }
    }
    return matches;
  }, [codes]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return codes;
    const digits = q.replace(/\D/g, "");
    const dialMatches = digits ? countriesByDialFragment.get(digits) : null;
    return codes.filter((code) => {
      if (code.toLowerCase().includes(q)) return true;
      if (dialMatches?.has(code)) return true;
      return countryLabel(code, labels).toLowerCase().includes(q);
    });
  }, [codes, countriesByDialFragment, labels, query]);
  const dial = value ? `+${getCountryCallingCode(value)}` : "+";
  return (
    <Combobox.Root
      items={codes}
      filteredItems={filtered}
      value={value ?? null}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      inputValue={query}
      onInputValueChange={setQuery}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
      }}
      itemToStringLabel={(code) => countryLabel(code, labels)}
      autoHighlight
    >
      <Combobox.Label className="sr-only">Country calling code</Combobox.Label>
      <Combobox.Trigger
        className={cn(
          "flex shrink-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-accent",
          className,
        )}
        {...pickDomProps(rest)}
      >
        <CountryFlag country={value} />
        <span className="text-sm font-semibold whitespace-nowrap tabular-nums">{dial}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={14}
          aria-hidden="true"
          className={cn("shrink-0 transition-transform duration-150", open && "rotate-180")}
        />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner align="start" sideOffset={8} className="z-50">
          <Combobox.Popup
            aria-label="Select country calling code"
            className="z-50 flex w-[min(18rem,calc(100vw-1rem))] flex-col gap-1.5 rounded-lg bg-popover p-1.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden"
          >
            <Combobox.Input
              placeholder="Search countries"
              aria-label="Search countries"
              className="mb-1 h-10 w-full rounded-md border border-product-border-subtle bg-transparent px-3 text-sm outline-none placeholder:text-product-text-secondary focus-visible:outline-2 focus-visible:outline-wl-accent"
            />
            <Combobox.List aria-label="Countries" className="max-h-60 overflow-y-auto">
              {(code) => (
                <Combobox.Item
                  key={code}
                  value={code}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-product-bg-inset focus-visible:outline-2 focus-visible:outline-wl-accent data-highlighted:bg-product-bg-inset data-selected:font-semibold",
                    code === value && "bg-product-bg-inset font-semibold",
                  )}
                >
                  <CountryFlag country={code} />
                  <span className="min-w-0 flex-1 truncate">{countryLabel(code, labels)}</span>
                  <span className="shrink-0 text-product-text-secondary tabular-nums">
                    +{getCountryCallingCode(code)}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
            <Combobox.Empty className="px-2.5 py-4 text-center text-sm text-product-text-secondary">
              No countries match “{query}”.
            </Combobox.Empty>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

// Only DOM-safe props reach native elements: the library forwards its own
// options (iconComponent, flags, …) to custom components, which React would
// warn about on a <select>/<input>.
function pickDomProps(rest) {
  const out = {};
  for (const [key, value] of Object.entries(rest)) {
    if (
      key === "name" ||
      key === "id" ||
      key === "disabled" ||
      key === "required" ||
      key === "autoFocus" ||
      key === "tabIndex" ||
      key === "placeholder" ||
      key === "maxLength" ||
      key.startsWith("aria-") ||
      key.startsWith("data-")
    )
      out[key] = value;
  }
  return out;
}

const PhoneTextInput = forwardRef(function PhoneTextInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="tel"
      autoComplete="tel"
      className={className}
      {...pickDomProps(props)}
      value={props.value}
      onChange={props.onChange}
      onBlur={props.onBlur}
    />
  );
});

export function PhoneInput({
  name,
  value,
  defaultValue,
  onChange,
  defaultCountry = "US",
  required,
  disabled,
  invalid,
  className,
  selectClassName,
  inputClassName,
  inputId,
  placeholder = "415 555 2671",
}) {
  const generatedId = useId();
  const textId = inputId ?? generatedId;
  return (
    <div className={cn("flex gap-2", className)}>
      <PhoneInputPrimitive
        defaultCountry={defaultCountry}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        countrySelectComponent={CountrySelect}
        inputComponent={PhoneTextInput}
        numberInputProps={{
          id: textId,
          className: inputClassName,
          required: required === true,
          disabled,
          placeholder,
          "aria-invalid": invalid === true ? true : undefined,
        }}
        countrySelectProps={{
          className: selectClassName,
          "aria-label": "Country calling code",
        }}
        style={{ display: "contents" }}
      />
      <input type="hidden" name={name} value={value ?? ""} readOnly />
    </div>
  );
}
