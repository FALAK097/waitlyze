"use client";

import {
  CheckmarkCircle02Icon,
  Copy01Icon,
  Download01Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { copyToClipboard } from "./tool-export-utils";

/**
 * Primary interactive tool container — crisp white surface, hairline border,
 * generous breathing room, strictly Waitlyze light-only tokens.
 */
export function ToolWorkspace({ children, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-product-border-subtle bg-product-bg-surface p-5 sm:p-7",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Quiet editorial stat tile with tabular-nums for deterministic readouts.
 */
export function ToolStatTile({ label, value, hint = "", tone = "neutral", className = "" }) {
  const toneBorder =
    tone === "success"
      ? "border-product-success-text/25 bg-product-success-bg/50"
      : tone === "warning"
        ? "border-product-warning-text/25 bg-product-warning-bg/60"
        : tone === "danger"
          ? "border-product-danger-text/25 bg-product-danger-bg/60"
          : "border-product-border-subtle bg-product-bg-inset/60";

  const valueTone =
    tone === "success"
      ? "text-product-success-text"
      : tone === "warning"
        ? "text-product-warning-text"
        : tone === "danger"
          ? "text-product-danger-text"
          : "text-product-text-primary";

  return (
    <div className={cn("rounded-lg border p-4", toneBorder, className)}>
      <p className="text-caption font-medium text-product-text-secondary">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-product-display text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl",
          valueTone,
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-micro text-product-text-secondary">{hint}</p> : null}
    </div>
  );
}

/**
 * Accessible status badge that always pairs explicit label text with semantic tint.
 */
export function ToolStatusBadge({ tone = "neutral", children, className = "" }) {
  const toneClasses =
    tone === "success"
      ? "bg-product-success-bg text-product-success-text border-product-success-text/20"
      : tone === "warning"
        ? "bg-product-warning-bg text-product-warning-text border-product-warning-text/20"
        : tone === "danger"
          ? "bg-product-danger-bg text-product-danger-text border-product-danger-text/20"
          : tone === "accent"
            ? "bg-product-accent-solid/35 text-product-text-primary border-product-text-primary/15"
            : "bg-product-bg-inset text-product-text-secondary border-product-border-subtle";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-micro font-semibold",
        toneClasses,
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Accessible range + numeric input combo with persistent label, helper text,
 * tabular numbers, and mobile numeric inputMode.
 */
export function ToolSliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
  prefix = "",
  hint = "",
  inputMode = "decimal",
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-caption font-semibold text-product-text-primary">
          {label}
        </label>
        <div className="flex items-center gap-1 rounded-md border border-product-border-control bg-product-bg-surface px-2.5 py-1 focus-within:border-product-text-primary">
          {prefix ? (
            <span className="text-caption text-product-text-secondary" aria-hidden="true">
              {prefix}
            </span>
          ) : null}
          <input
            id={id}
            type="number"
            inputMode={inputMode}
            min={min}
            max={max}
            step={step}
            value={value}
            aria-describedby={hintId}
            onChange={(event) => {
              const raw = event.target.value.trim();
              if (!raw) return;
              const parsed = Number(raw);
              if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
                onChange(Math.min(max, Math.max(min, parsed)));
              }
            }}
            className="w-20 bg-transparent text-right font-product-mono text-caption font-semibold text-product-text-primary tabular-nums focus:outline-none"
          />
          {suffix ? (
            <span className="text-caption text-product-text-secondary" aria-hidden="true">
              {suffix}
            </span>
          ) : null}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => {
          const raw = event.target.value.trim();
          if (!raw) return;
          const parsed = Number(raw);
          if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
            onChange(Math.min(max, Math.max(min, parsed)));
          }
        }}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-product-bg-inset accent-product-text-primary"
      />
      {hint ? (
        <p id={hintId} className="text-micro text-product-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Accessible native select control matching Waitlyze's restrained product-input height.
 */
export function ToolSelectField({ label, value, onChange, options, hint = "", className = "" }) {
  const id = useId();
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-caption font-semibold text-product-text-primary">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-product-border-control bg-product-bg-surface px-3 py-2 text-body text-product-text-primary transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint ? <p className="text-micro text-product-text-secondary">{hint}</p> : null}
    </div>
  );
}

/**
 * Accessible text input with persistent label, optional character counter, and inline error.
 */
export function ToolTextField({
  label,
  value,
  onChange,
  placeholder = "",
  maxLength,
  type = "text",
  inputMode,
  hint = "",
  error = "",
  className = "",
}) {
  const id = useId();
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-caption font-semibold text-product-text-primary">
          {label}
        </label>
        {maxLength ? (
          <span className="font-product-mono text-micro text-product-text-muted tabular-nums">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "min-h-11 w-full rounded-lg border bg-product-bg-surface px-3.5 py-2 text-body text-product-text-primary placeholder:text-product-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus",
          error ? "border-product-danger-text" : "border-product-border-control",
        )}
      />
      {error ? (
        <p role="alert" className="text-micro text-product-danger-text">
          {error}
        </p>
      ) : hint ? (
        <p className="text-micro text-product-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Segmented button group for crisp mode/preset switching without visual clutter.
 */
export function ToolSegmentedControl({ label, value, onChange, options, className = "" }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <span className="text-caption font-semibold text-product-text-primary">{label}</span>
      ) : null}
      <div
        role="group"
        aria-label={label || "Options"}
        className="inline-flex flex-wrap gap-1.5 rounded-lg border border-product-border-subtle bg-product-bg-inset p-1"
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "min-h-9 rounded-md px-3 py-1.5 text-caption font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus motion-safe:active:scale-[0.98]",
                active
                  ? "bg-product-bg-surface text-product-text-primary shadow-2xs ring-1 ring-product-border-subtle"
                  : "text-product-text-secondary hover:text-product-text-primary",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * One-click copy button with crisp state confirmation.
 */
export function ToolCopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  onCopied,
  className = "",
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      toast.success("Copied to clipboard");
      onCopied?.();
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      toast.error("Copy unavailable in this browser.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-product-border-control bg-product-bg-surface px-3.5 py-2 text-caption font-medium text-product-text-primary transition-colors duration-150 hover:bg-product-bg-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus motion-safe:active:scale-[0.98]",
        className,
      )}
    >
      <HugeiconsIcon
        icon={copied ? CheckmarkCircle02Icon : Copy01Icon}
        size={15}
        aria-hidden="true"
        className={copied ? "text-product-success-text" : ""}
      />
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}

/**
 * Secondary export action button (CSV, PNG, .ics, JSON, Share link).
 */
export function ToolActionButton({ icon = "download", children, onClick, className = "" }) {
  const iconObj = icon === "share" ? Share01Icon : Download01Icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-product-border-control bg-product-bg-surface px-3.5 py-2 text-caption font-medium text-product-text-primary transition-colors duration-150 hover:bg-product-bg-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus motion-safe:active:scale-[0.98]",
        className,
      )}
    >
      <HugeiconsIcon icon={iconObj} size={15} aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}
