"use client";

import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useDeferredValue, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ensureFontLoaded, googleFontsStylesheet, resolveFontFamily } from "@/lib/google-fonts.mjs";
import { cn } from "@/lib/utils";

const categories = ["all", "sans-serif", "serif", "display", "handwriting", "monospace"];

function FontPreview({ family }) {
  return (
    <span className="truncate text-xs text-product-text-muted" style={{ fontFamily: family }}>
      Make the launch worth waiting for
    </span>
  );
}

export function FontPicker({ label, value, onValueChange }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [fonts, setFonts] = useState([]);
  const [state, setState] = useState("idle");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const selected = resolveFontFamily(value);

  async function loadFonts(force = false) {
    if (!force && state !== "idle") return;
    setState("loading");
    try {
      const response = await fetch("/api/fonts");
      const result = await response.json();
      if (!response.ok || !Array.isArray(result.fonts)) throw new Error();
      setFonts(result.fonts);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  const matches = fonts
    .filter(
      (font) =>
        (category === "all" || font.category === category) &&
        (!deferredSearch || font.family.toLowerCase().includes(deferredSearch)),
    )
    .slice(0, 160);
  const previewFamilies = matches
    .slice(0, 24)
    .map((font) => font.family)
    .join("|");
  useEffect(() => {
    if (!previewFamilies) return;
    const href = googleFontsStylesheet(previewFamilies.split("|"));
    if (!href) return;
    const link = document.createElement("link");
    link.href = href;
    link.rel = "stylesheet";
    link.dataset.waitlyzeFontPreview = "true";
    document.head.append(link);
    return () => link.remove();
  }, [previewFamilies]);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) void loadFonts();
        }}
      >
        <PopoverTrigger
          render={
            <Button
              aria-expanded={open}
              aria-haspopup="dialog"
              className="w-full justify-between font-normal"
              id={id}
              variant="outline"
            />
          }
        >
          <span className="truncate">{selected}</span>
          <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent align="start" aria-label={`${label} picker`} className="w-80 p-0">
          <div className="grid gap-2 border-b border-product-border-subtle p-2.5">
            <Input
              aria-label="Search Google Fonts"
              autoComplete="off"
              placeholder="Search Google Fonts"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {categories.map((item) => (
                <button
                  aria-pressed={category === item}
                  className="min-h-7 shrink-0 cursor-pointer rounded-full border border-product-border-subtle bg-transparent px-2.5 text-micro text-product-text-secondary capitalize aria-pressed:border-product-text-primary aria-pressed:text-product-text-primary"
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                >
                  {item === "all" ? "All" : item}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto p-1" aria-label={`${label} options`}>
            {state === "loading" ? (
              <p className="px-3 py-8 text-center text-caption text-product-text-muted">
                Loading fonts…
              </p>
            ) : null}
            {state === "error" ? (
              <div className="grid gap-2 px-3 py-6 text-center">
                <p className="text-caption text-product-danger-text">Fonts could not be loaded.</p>
                <Button size="sm" variant="outline" onClick={() => void loadFonts(true)}>
                  Try again
                </Button>
              </div>
            ) : null}
            {state === "ready" && !matches.length ? (
              <p className="px-3 py-8 text-center text-caption text-product-text-muted">
                No matching fonts.
              </p>
            ) : null}
            {state === "ready"
              ? matches.map((font) => (
                  <button
                    aria-pressed={selected === font.family}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-2.5 py-2 text-left hover:bg-product-bg-inset focus-visible:outline-2 focus-visible:outline-product-focus",
                      selected === font.family && "bg-product-bg-inset",
                    )}
                    key={font.family}
                    type="button"
                    onClick={() => {
                      const family = font.family;
                      setOpen(false);
                      // Preload the binaries first so the canvas keeps
                      // rendering the old font until the new one is ready.
                      void ensureFontLoaded(family).finally(() => onValueChange(family));
                    }}
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      {selected === font.family ? (
                        <HugeiconsIcon icon={Tick02Icon} size={14} aria-hidden="true" />
                      ) : null}
                    </span>
                    <span className="grid min-w-0 gap-0.5">
                      <span className="truncate text-caption font-medium">{font.family}</span>
                      <FontPreview family={font.family} />
                    </span>
                  </button>
                ))
              : null}
          </div>
          {state === "ready" ? (
            <p className="border-t border-product-border-subtle px-3 py-2 text-micro text-product-text-muted">
              {matches.length === 160 ? "Showing the first 160 matches" : `${matches.length} fonts`}
            </p>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
