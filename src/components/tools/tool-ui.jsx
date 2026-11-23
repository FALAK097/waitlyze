"use client";

import {
  Copy01Icon,
  Download01Icon,
  RefreshIcon,
  Share01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { copyToClipboard } from "./tool-export-utils";

/**
 * Unboxed tool workspace container with clean vertical rhythm and no outer card chrome.
 */
export function ToolWorkspace({ children, className = "" }) {
  return <div className={cn("grid min-w-0 gap-8", className)}>{children}</div>;
}

/**
 * Flat, unboxed typographic metric readout for use inside horizontal stat strips.
 */
export function ToolStatTile({ label, value, hint = "", tone = "neutral", className = "" }) {
  const valueTone =
    tone === "success"
      ? "text-product-success-text"
      : tone === "warning"
        ? "text-product-warning-text"
        : tone === "danger"
          ? "text-product-danger-text"
          : "text-product-text-primary";

  return (
    <div className={cn("min-w-0 py-1", className)}>
      <p className="text-caption text-product-text-secondary">{label}</p>
      <p
        className={cn(
          "mt-1 font-product-display text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.75rem]",
          valueTone,
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-micro text-product-text-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * Open metric group for 2–4 primary tool metrics.
 */
export function ToolStatStrip({ children, className = "" }) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-2 gap-x-4 gap-y-5 py-2 sm:grid-cols-4 sm:gap-x-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Quiet inline status indicator — semantic dot + label text, no pill chrome.
 */
export function ToolStatusBadge({ tone = "neutral", children, className = "" }) {
  const dotClass =
    tone === "success"
      ? "bg-product-success-text"
      : tone === "warning"
        ? "bg-product-warning-text"
        : tone === "danger"
          ? "bg-product-danger-text"
          : tone === "accent"
            ? "bg-product-accent-solid ring-1 ring-product-text-primary/30"
            : "bg-product-text-muted";

  const textClass =
    tone === "success"
      ? "text-product-success-text"
      : tone === "warning"
        ? "text-product-warning-text"
        : tone === "danger"
          ? "text-product-danger-text"
          : "text-product-text-secondary";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-caption font-medium",
        textClass,
        className,
      )}
    >
      <span
        className={cn("inline-block size-1.5 shrink-0 rounded-full", dotClass)}
        aria-hidden="true"
      />
      <span>{children}</span>
    </span>
  );
}

/**
 * Accessible range + numeric input combo using shadcn Label & Input.
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id} className="text-caption font-medium text-product-text-primary">
          {label}
        </Label>
        <div className="flex items-center gap-1">
          {prefix ? (
            <span className="text-caption text-product-text-muted" aria-hidden="true">
              {prefix}
            </span>
          ) : null}
          <Input
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
            className="h-8 w-20 bg-product-bg-surface px-2 text-right font-product-mono text-caption font-medium tabular-nums"
          />
          {suffix ? (
            <span className="text-caption text-product-text-muted" aria-hidden="true">
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
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-product-bg-inset accent-product-text-primary"
      />
      {hint ? (
        <p id={hintId} className="text-micro text-product-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Accessible Base UI Select control matching Waitlyze product styling.
 */
export function ToolSelectField({ label, value, onChange, options, hint = "", className = "" }) {
  const id = useId();
  const activeOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="text-caption font-medium text-product-text-primary">
        {label}
      </Label>
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger
          id={id}
          className="h-10 w-full bg-product-bg-surface px-3 text-body text-product-text-primary"
        >
          <SelectValue>{activeOption?.label ?? value}</SelectValue>
        </SelectTrigger>
        <SelectContent align="start">
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <p className="text-micro text-product-text-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * Accessible text input using shadcn Label & Input.
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
        <Label htmlFor={id} className="text-caption font-medium text-product-text-primary">
          {label}
        </Label>
        {maxLength ? (
          <span className="font-product-mono text-micro text-product-text-muted tabular-nums">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 bg-product-bg-surface px-3 text-body"
      />
      {error ? (
        <p role="alert" className="text-micro text-product-danger-text">
          {error}
        </p>
      ) : hint ? (
        <p className="text-micro text-product-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Accessible textarea using shadcn Label & Textarea.
 */
export function ToolTextareaField({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 5,
  maxLength,
  mono = false,
  error = "",
  className = "",
}) {
  const id = useId();
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-caption font-medium text-product-text-primary">
          {label}
        </Label>
        {maxLength ? (
          <span className="font-product-mono text-micro text-product-text-muted tabular-nums">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "bg-product-bg-surface p-3",
          mono ? "font-product-mono text-caption leading-relaxed" : "text-body",
        )}
      />
      {error ? (
        <p role="alert" className="text-micro text-product-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Segmented control built on Base UI Tabs for crisp, keyboard-accessible mode switching.
 */
export function ToolSegmentedControl({
  label,
  ariaLabel,
  value,
  onChange,
  options,
  className = "",
}) {
  const id = useId();
  const labelId = label ? `${id}-label` : undefined;
  const useSelect = options.length > 4;
  const accessibleName = ariaLabel || label || "Choose an option";

  return (
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      {label ? (
        useSelect ? (
          <Label
            id={labelId}
            htmlFor={id}
            className="text-caption font-medium text-product-text-primary"
          >
            {label}
          </Label>
        ) : (
          <span id={labelId} className="text-caption font-medium text-product-text-primary">
            {label}
          </span>
        )
      ) : null}
      {useSelect ? (
        <Select value={value} onValueChange={(next) => next && onChange(next)}>
          <SelectTrigger
            id={id}
            aria-label={label ? undefined : accessibleName}
            aria-labelledby={labelId}
            className="h-11 w-full bg-product-bg-surface px-3 text-body text-product-text-primary sm:max-w-72"
          >
            <SelectValue>
              {options.find((option) => option.value === value)?.label ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Tabs value={value} onValueChange={(next) => next && onChange(next)} className="min-w-0">
          <TabsList
            id={id}
            aria-label={label ? undefined : accessibleName}
            aria-labelledby={labelId}
            className="inline-flex! h-auto! w-fit max-w-full flex-wrap items-center justify-start gap-1 bg-product-bg-inset p-1"
          >
            {options.map((opt) => (
              <TabsTrigger
                key={opt.value}
                value={opt.value}
                className="h-auto! min-h-10 shrink-0 grow basis-auto px-4 py-2 text-center text-caption leading-none font-medium whitespace-nowrap data-active:bg-product-bg-surface data-active:text-product-text-primary data-active:shadow-2xs"
              >
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
    </div>
  );
}

/**
 * One-click copy button built on shadcn Button + Hugeicons.
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
    <Button
      type="button"
      variant="product-outline"
      size="sm"
      onClick={handleCopy}
      className={cn("h-9 gap-1.5 px-3 text-caption font-medium", className)}
    >
      <HugeiconsIcon
        icon={copied ? Tick01Icon : Copy01Icon}
        size={15}
        aria-hidden="true"
        className={copied ? "text-product-success-text" : ""}
      />
      <span>{copied ? copiedLabel : label}</span>
    </Button>
  );
}

/**
 * Secondary export/action button built on shadcn Button + Hugeicons.
 */
export function ToolActionButton({
  icon = "download",
  children,
  onClick,
  disabled = false,
  className = "",
}) {
  const iconObj = icon === "share" ? Share01Icon : icon === "reset" ? RefreshIcon : Download01Icon;
  return (
    <Button
      type="button"
      variant="product-outline"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className={cn("h-9 gap-1.5 px-3 text-caption font-medium", className)}
    >
      <HugeiconsIcon icon={iconObj} size={15} aria-hidden="true" />
      <span>{children}</span>
    </Button>
  );
}
