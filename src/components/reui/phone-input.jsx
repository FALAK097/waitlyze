"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { forwardRef, useId, useMemo, useState } from "react";
import PhoneInputPrimitive, { getCountries, getCountryCallingCode } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import enLabels from "react-phone-number-input/locale/en.json";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return codes;
    const digits = q.replace(/\D/g, "");
    return codes.filter((code) => {
      if (code.toLowerCase().includes(q)) return true;
      if (digits && getCountryCallingCode(code).includes(digits)) return true;
      return countryLabel(code, labels).toLowerCase().includes(q);
    });
  }, [codes, labels, query]);
  const dial = value ? `+${getCountryCallingCode(value)}` : "+";
  return (
    <Popover open={open} onOpenChange={(next) => (setOpen(next), next || setQuery(""))}>
      <PopoverTrigger
        type="button"
        className={cn(
          "flex shrink-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-accent",
          className,
        )}
        aria-label="Country calling code"
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
      </PopoverTrigger>
      <PopoverContent className="w-72 p-1.5" align="start" sideOffset={8}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search countries"
          aria-label="Search countries"
          className="mb-1 h-10 w-full rounded-md border border-product-border-subtle bg-transparent px-3 text-sm outline-none placeholder:text-product-text-secondary focus-visible:outline-2 focus-visible:outline-wl-accent"
        />
        <div role="listbox" aria-label="Countries" className="max-h-60 overflow-y-auto">
          {filtered.map((code) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={code === value}
              onClick={() => {
                onChange(code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent px-2.5 py-2 text-left text-sm hover:bg-product-bg-inset focus-visible:outline-2 focus-visible:outline-wl-accent",
                code === value && "bg-product-bg-inset font-semibold",
              )}
            >
              <CountryFlag country={code} />
              <span className="min-w-0 flex-1 truncate">{countryLabel(code, labels)}</span>
              <span className="shrink-0 text-product-text-secondary tabular-nums">
                +{getCountryCallingCode(code)}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-2.5 py-4 text-center text-sm text-product-text-secondary">
              No countries match “{query}”.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
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
