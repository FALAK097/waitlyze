"use client";

import { HelpCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const identityListValue = (entry) => entry;

export function SelectField({ label, value, options, onChange }) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full min-w-0">
          <SelectValue>{options.find((option) => option.id === value)?.label ?? value}</SelectValue>
        </SelectTrigger>
        <SelectContent
          align="start"
          alignItemWithTrigger={false}
          className="w-max max-w-80 min-w-64"
        >
          {options.map((option) => (
            <SelectItem value={option.id} key={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

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
export function PointsField({ label, value, onCommit, max = 100000, unit }) {
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
      {unit ? (
        <InputGroup className="h-10">
          <InputGroupInput
            id={id}
            type="number"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onBlur={commit}
          />
          <InputGroupAddon align="inline-end">{unit}</InputGroupAddon>
        </InputGroup>
      ) : (
        <Input
          id={id}
          type="number"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={commit}
        />
      )}
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
      {hint ? (
        <span className="inline-flex items-center gap-1.5">
          <span>{label}</span>
          <TooltipProvider delay={150}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="product-ghost"
                    size="icon-xs"
                    aria-label={`${label} information`}
                  >
                    <HugeiconsIcon icon={HelpCircleIcon} size={15} aria-hidden="true" />
                  </Button>
                }
              />
              <TooltipContent side="top" className="max-w-64 text-center">
                {hint}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </span>
      ) : (
        <span>{label}</span>
      )}
    </label>
  );
}

export function HttpsInputField({ label, value, placeholder, disabled, onChange }) {
  const id = useId();
  const normalized = (value || "").replace(/^https?:\/\//i, "");
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <InputGroup className="h-10">
        <InputGroupAddon>https://</InputGroupAddon>
        <InputGroupInput
          id={id}
          autoCapitalize="none"
          autoComplete="url"
          disabled={disabled}
          placeholder={placeholder}
          value={normalized}
          onChange={(event) =>
            onChange(
              event.target.value.trim()
                ? `https://${event.target.value.replace(/^https?:\/\//i, "")}`
                : "",
            )
          }
        />
      </InputGroup>
    </div>
  );
}

export function RedirectUrlField({ value, onChange }) {
  const id = useId();
  const [draft, setDraft] = useState(value || "");
  const dirty = draft !== (value || "");
  useEffect(() => {
    if (!dirty) return;
    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);
  const isPath = draft.startsWith("/");
  const showHttpsPrefix = !isPath && Boolean(draft.trim());
  const shown = /^https?:\/\//i.test(draft) ? draft.replace(/^https?:\/\//i, "") : draft;
  function commit() {
    const next = draft.trim();
    const normalized =
      next.startsWith("/") || !next ? next : `https://${next.replace(/^https?:\/\//i, "")}`;
    setDraft(normalized);
    onChange(normalized);
  }
  return (
    <div className="grid gap-1.5">
      <div className="inline-flex items-center gap-1.5">
        <Label htmlFor={id}>Redirect URL (optional)</Label>
        <TooltipProvider delay={150}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="product-ghost"
                  size="icon-xs"
                  aria-label="Redirect URL information"
                >
                  <HugeiconsIcon icon={HelpCircleIcon} size={15} aria-hidden="true" />
                </Button>
              }
            />
            <TooltipContent side="top" className="max-w-64 text-center">
              Send visitors to a site path like /thanks or an HTTPS URL after signup. Leave empty to
              stay on the confirmation screen.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <InputGroup className="h-10">
        {showHttpsPrefix && <InputGroupAddon>https://</InputGroupAddon>}
        <InputGroupInput
          id={id}
          autoComplete="url"
          placeholder="/thanks or example.com/thanks"
          value={shown}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
              event.currentTarget.blur();
            }
          }}
        />
      </InputGroup>
    </div>
  );
}
