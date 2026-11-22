"use client";

import {
  AnalyticsUpIcon,
  ArrowRight01Icon,
  ChartBarLineIcon,
  CheckListIcon,
  CodeIcon,
  Edit02Icon,
  GiftIcon,
  GridViewIcon,
  Layout01Icon,
  LeftToRightListBulletIcon,
  Link01Icon,
  Mail01Icon,
  MailValidation01Icon,
  RankingIcon,
  Search01Icon,
  Shield01Icon,
  TaskEdit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";

import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

const TOOL_ICON_MAP = {
  "waitlist-landing-page-grader": Search01Icon,
  "waitlist-template-finder": Layout01Icon,
  "viral-coefficient-calculator": AnalyticsUpIcon,
  "waitlist-landing-page-generator": Edit02Icon,
  "product-launch-checklist": CheckListIcon,
  "referral-reward-calculator": GiftIcon,
  "waitlist-queue-simulator": RankingIcon,
  "beta-application-questions": TaskEdit01Icon,
  "waitlist-email-generator": Mail01Icon,
  "waitlist-health-check": Shield01Icon,
  "email-deliverability-checker": MailValidation01Icon,
  "waitlist-utm-builder": Link01Icon,
  "waitlist-embed-generator": CodeIcon,
  "waitlist-benchmarks": ChartBarLineIcon,
};

export function ToolsHubDirectory({ categories, tools }) {
  const [view, setView] = useState("grid");

  const grouped = categories
    .map((category) => ({
      ...category,
      items: tools.filter((tool) => tool.category === category.id),
    }))
    .filter((category) => category.items.length > 0);

  return (
    <div className="grid gap-12">
      {/* Section Jump Links + Grid / List View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <nav aria-label="Tool groups" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {grouped.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="text-caption font-medium text-product-text-secondary transition-colors duration-150 hover:text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-product-focus"
            >
              {category.label}
            </a>
          ))}
        </nav>

        <div
          role="group"
          aria-label="Layout view"
          className="inline-flex items-center gap-1 rounded-lg bg-product-bg-inset p-0.5"
        >
          <Toggle
            size="sm"
            pressed={view === "grid"}
            onPressedChange={() => setView("grid")}
            aria-label="Grid view"
            className={cn(
              "h-7 gap-1.5 rounded-md px-2.5 text-caption font-medium",
              view === "grid"
                ? "bg-product-bg-surface text-product-text-primary shadow-2xs"
                : "text-product-text-secondary hover:bg-transparent hover:text-product-text-primary",
            )}
          >
            <HugeiconsIcon icon={GridViewIcon} size={14} aria-hidden="true" />
            <span>Grid</span>
          </Toggle>
          <Toggle
            size="sm"
            pressed={view === "list"}
            onPressedChange={() => setView("list")}
            aria-label="List view"
            className={cn(
              "h-7 gap-1.5 rounded-md px-2.5 text-caption font-medium",
              view === "list"
                ? "bg-product-bg-surface text-product-text-primary shadow-2xs"
                : "text-product-text-secondary hover:bg-transparent hover:text-product-text-primary",
            )}
          >
            <HugeiconsIcon icon={LeftToRightListBulletIcon} size={14} aria-hidden="true" />
            <span>List</span>
          </Toggle>
        </div>
      </div>

      {/* Grouped Tools — All Visible, Zero Filters, Zero Cards/Badges */}
      <div className="grid gap-14">
        {grouped.map((category) => (
          <section
            key={category.id}
            id={category.id}
            aria-labelledby={`cat-${category.id}`}
            className="scroll-mt-24"
          >
            <div className="max-w-2xl">
              <h2
                id={`cat-${category.id}`}
                className="font-product-display text-xl font-semibold tracking-tight text-product-text-primary sm:text-2xl"
              >
                {category.label}
              </h2>
              <p className="mt-1 text-body text-product-text-secondary">{category.description}</p>
            </div>

            {view === "grid" ? (
              <ul className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((tool) => {
                  const icon = TOOL_ICON_MAP[tool.slug] || Search01Icon;
                  return (
                    <li key={tool.slug} className="flex">
                      <Link
                        href={tool.path}
                        className="group flex flex-1 flex-col py-1 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-product-focus"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <HugeiconsIcon
                              icon={icon}
                              size={17}
                              aria-hidden="true"
                              className="mt-0.5 shrink-0 text-product-text-secondary transition-colors duration-150 group-hover:text-product-text-primary"
                            />
                            <h3 className="font-product-display text-base leading-snug font-semibold tracking-tight text-product-text-primary group-hover:underline">
                              {tool.title}
                            </h3>
                          </div>
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            size={15}
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 text-product-text-muted opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-product-text-primary group-hover:opacity-100"
                          />
                        </div>
                        <p className="mt-2 text-caption leading-relaxed text-product-text-secondary">
                          {tool.targetJob}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="mt-5 grid gap-1">
                {category.items.map((tool) => {
                  const icon = TOOL_ICON_MAP[tool.slug] || Search01Icon;
                  return (
                    <li key={tool.slug}>
                      <Link
                        href={tool.path}
                        className="group flex flex-col gap-1.5 rounded-lg px-2 py-3.5 transition-colors duration-150 hover:bg-product-bg-inset/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                      >
                        <div className="flex min-w-0 items-center gap-2.5 sm:w-84 sm:shrink-0">
                          <HugeiconsIcon
                            icon={icon}
                            size={16}
                            aria-hidden="true"
                            className="shrink-0 text-product-text-secondary transition-colors duration-150 group-hover:text-product-text-primary"
                          />
                          <span className="truncate font-product-display text-body font-semibold text-product-text-primary group-hover:underline">
                            {tool.title}
                          </span>
                        </div>
                        <p className="min-w-0 flex-1 text-caption text-product-text-secondary sm:truncate">
                          {tool.targetJob}
                        </p>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={15}
                          aria-hidden="true"
                          className="hidden shrink-0 text-product-text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-product-text-primary sm:block"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
