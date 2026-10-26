"use client";

import { useId, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const identityListValue = (entry) => entry;

export function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
  maxLength,
  placeholder = "",
  disabled = false,
  onFocus,
  onBlur,
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5 [&_input]:text-caption [&_label]:text-caption [&_label]:font-semibold [&_textarea]:text-caption">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      )}
    </div>
  );
}

// Number input that lets founders clear the field while typing and commits a
// clamped integer on blur, instead of snapping to 0 mid-edit.
export function PointsField({ label, value, onCommit, max = 100000 }) {
  const id = useId();
  // Callers pass `key={value}` so React remounts and re-syncs the text state
  // when the committed value changes, instead of resetting it from an effect.
  const [text, setText] = useState(value == null ? "" : String(value));
  const commit = () => {
    if (text === "" || text == null) {
      onCommit(0);
      return;
    }
    const parsed = Math.trunc(Number(text));
    onCommit(!Number.isSafeInteger(parsed) || parsed < 0 ? 0 : Math.min(parsed, max));
  };
  return (
    <div className="grid gap-1.5 [&_input]:text-caption [&_label]:text-caption [&_label]:font-semibold">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
      />
    </div>
  );
}

export function ListField({ label, value, onChange, placeholder, normalize = identityListValue }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const text = Array.isArray(value) ? value.join(", ") : "";
  const parse = (raw) =>
    raw
      .split(/[,;\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map(normalize);

  return (
    <Field
      label={label}
      value={editing ? draft : text}
      placeholder={placeholder}
      onFocus={() => {
        setDraft(text);
        setEditing(true);
      }}
      onChange={(raw) => {
        setDraft(raw);
        onChange(parse(raw));
      }}
      onBlur={(event) => {
        const entries = parse(event.currentTarget.value);
        setDraft(entries.join(", "));
        setEditing(false);
        onChange(entries);
      }}
    />
  );
}

export function Toggle({ label, checked, onChange, disabled = false, hint = "" }) {
  return (
    <label
      className={
        disabled
          ? "flex items-center gap-2 text-caption font-medium text-product-text-muted"
          : "flex items-center gap-2 text-caption font-medium"
      }
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <span>{label}</span>
      {hint && <span className="text-micro text-product-text-muted">{hint}</span>}
    </label>
  );
}
