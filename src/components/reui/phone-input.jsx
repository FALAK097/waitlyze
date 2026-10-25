"use client";

import { forwardRef, useId } from "react";
import PhoneInputPrimitive, { getCountries, getCountryCallingCode } from "react-phone-number-input";
import enLabels from "react-phone-number-input/locale/en.json";

import { cn } from "@/lib/utils";

// Product-styled phone field with country picker. Values are E.164 in and
// out (`undefined` when empty); the library owns parsing, formatting, and
// country data while the server stays the validation authority. Country
// labels come from the library locale so the list stays correct upstream.
// Only DOM-safe props reach the native elements: the library forwards its
// own options (iconComponent, flags, …) to custom components, which React
// would warn about on a <select>/<input>.
function pickSelectProps(rest) {
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

function CountrySelect({ value, onChange, options, labels, className, ...rest }) {
  const list =
    Array.isArray(options) && options.length > 0
      ? options
      : getCountries().map((code) => ({ value: code }));
  return (
    <select
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value || undefined)}
      className={className}
      {...pickSelectProps(rest)}
    >
      {list.map((option) => {
        const code = typeof option === "string" ? option : option?.value;
        if (!code) return null;
        const label = (labels && labels[code]) || enLabels[code] || code;
        return (
          <option value={code} key={code}>
            +{getCountryCallingCode(code)} {label}
          </option>
        );
      })}
    </select>
  );
}

const PhoneTextInput = forwardRef(function PhoneTextInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="tel"
      autoComplete="tel"
      className={className}
      {...pickSelectProps(props)}
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
        international
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
