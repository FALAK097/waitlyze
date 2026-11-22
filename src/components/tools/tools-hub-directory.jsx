"use client";

import { ArrowRight01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const EXECUTION_BADGE = Object.freeze({
  "waitlist-landing-page-grader": "Live URL + HTML",
  "email-deliverability-checker": "Live DNS lookup",
  "waitlist-health-check": "Zero-upload CSV",
  "waitlist-benchmarks": "Cohort dataset",
});

export function ToolsHubDirectory({ categories, tools }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => selectedCategory === "all" || cat.id === selectedCategory)
      .map((cat) => {
        const items = tools.filter((tool) => {
          if (tool.category !== cat.id) return false;
          if (!normalizedQuery) return true;
          const hay =
            `${tool.title} ${tool.shortTitle} ${tool.targetJob} ${cat.label}`.toLowerCase();
          return hay.includes(normalizedQuery);
        });
        return { ...cat, items };
      })
      .filter((cat) => cat.items.length > 0);
  }, [categories, tools, selectedCategory, normalizedQuery]);

  const totalMatches = filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="grid gap-8">
      {/* Category Filters + Instant Search */}
      <div className="flex flex-col gap-3 border-b border-product-border-subtle pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filter Launch Lab tools by category"
          className="flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            aria-pressed={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-caption font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus motion-safe:active:scale-[0.98]",
              selectedCategory === "all"
                ? "border-product-text-primary bg-product-text-primary text-product-bg-page"
                : "border-product-border-subtle bg-product-bg-surface text-product-text-secondary hover:border-product-text-secondary hover:text-product-text-primary",
            )}
          >
            <span>All tools</span>
            <span className="font-product-mono text-micro opacity-75">{tools.length}</span>
          </button>
          {categories.map((category) => {
            const count = tools.filter((t) => t.category === category.id).length;
            const active = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-caption font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus motion-safe:active:scale-[0.98]",
                  active
                    ? "border-product-text-primary bg-product-text-primary text-product-bg-page"
                    : "border-product-border-subtle bg-product-bg-surface text-product-text-secondary hover:border-product-text-secondary hover:text-product-text-primary",
                )}
              >
                <span>{category.label}</span>
                <span className="font-product-mono text-micro opacity-75">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-product-text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter tools (e.g. K-factor, DNS, copy)…"
            aria-label="Filter Launch Lab tools"
            className="min-h-11 w-full rounded-full border border-product-border-control bg-product-bg-surface py-2 pr-4 pl-9 text-caption text-product-text-primary placeholder:text-product-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus"
          />
        </div>
      </div>

      {/* Categorized Tool Sections */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {totalMatches} {totalMatches === 1 ? "tool" : "tools"} found
      </p>
      {totalMatches === 0 ? (
        <div className="rounded-xl border border-product-border-subtle bg-product-bg-inset/50 px-6 py-10 text-center">
          <p className="text-body font-semibold text-product-text-primary">
            No tools match &ldquo;{query}&rdquo;
          </p>
          <p className="mt-1 text-caption text-product-text-secondary">
            Try searching for viral, grader, copy, embed, DNS, CSV, or checklist.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSelectedCategory("all");
            }}
            className="mt-4 inline-flex min-h-10 items-center rounded-full border border-product-text-primary bg-product-bg-surface px-4 py-1.5 text-caption font-semibold text-product-text-primary hover:bg-product-bg-inset"
          >
            Show all {tools.length} tools
          </button>
        </div>
      ) : (
        <div className="divide-y divide-product-border-subtle">
          {filteredCategories.map((category, catIdx) => (
            <section
              key={category.id}
              id={category.id}
              className={cn("scroll-mt-24", catIdx === 0 ? "pb-12" : "py-12")}
              aria-labelledby={`cat-${category.id}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="max-w-2xl">
                  <h2
                    id={`cat-${category.id}`}
                    className="font-product-display text-2xl font-semibold tracking-tight text-product-text-primary sm:text-3xl"
                  >
                    {category.label}
                  </h2>
                  <p className="mt-1.5 text-body text-product-text-secondary">
                    {category.description}
                  </p>
                </div>
                <span className="font-product-mono text-micro text-product-text-muted">
                  {category.items.length} {category.items.length === 1 ? "tool" : "tools"}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((tool) => {
                  const modeBadge = EXECUTION_BADGE[tool.slug] || "Instant · In-browser";
                  return (
                    <Link
                      key={tool.slug}
                      href={tool.path}
                      className="group flex flex-col justify-between rounded-xl border border-product-border-subtle bg-product-bg-surface p-5 transition-colors duration-150 hover:border-product-text-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus motion-safe:active:scale-[0.99]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-product-mono text-micro font-medium text-product-success-text">
                            {category.label}
                          </span>
                          <span className="rounded-full bg-product-bg-inset px-2 py-0.5 font-product-mono text-micro text-product-text-secondary">
                            {modeBadge}
                          </span>
                        </div>
                        <h3 className="mt-3 font-product-display text-lg leading-snug font-semibold tracking-tight text-product-text-primary group-hover:underline">
                          {tool.title}
                        </h3>
                        <p className="mt-2 text-caption leading-relaxed text-product-text-secondary">
                          {tool.targetJob}
                        </p>
                      </div>
                      <span className="mt-5 inline-flex items-center gap-1 text-caption font-semibold text-product-text-primary">
                        Open tool
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={14}
                          aria-hidden="true"
                          className="transition-transform duration-150 group-hover:translate-x-0.5"
                        />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
