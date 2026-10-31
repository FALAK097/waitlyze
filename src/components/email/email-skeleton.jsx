"use client";

import { useParams } from "next/navigation";

import { EmailToolsNav } from "./email-tools-nav";

const scope = "min-w-0 bg-white text-product-text-primary";
const skelPane = "min-w-0 max-w-195 flex flex-col gap-5 lg:flex-1";
const skelSplit = "flex flex-col gap-6 md:gap-8 xl:gap-10 lg:flex-row lg:items-start";
const skelRail =
  "flex w-full shrink-0 flex-col gap-1 max-lg:flex-row max-lg:flex-wrap max-lg:gap-1.5 lg:w-52";
const skelRailItem =
  "block h-14.5 w-full rounded-product-control bg-product-bg-inset motion-safe:animate-pulse max-lg:min-w-38 max-lg:flex-1";
const skelFields = "grid overflow-hidden rounded-lg border border-product-border-subtle bg-white";
const skelField =
  "h-13 bg-product-bg-inset/70 motion-safe:animate-pulse [&+&]:border-t border-product-border-subtle";
const skelCanvas =
  "h-105 rounded-lg border border-product-border-subtle bg-product-bg-inset/60 motion-safe:animate-pulse";
const pulse = "block rounded-product-control bg-product-bg-inset motion-safe:animate-pulse";

const variants = {
  templates: {
    rail: 4,
    fields: 2,
    hasTemplatePicker: false,
    hasRecipients: false,
    label: "email templates",
  },
  broadcasts: {
    rail: 3,
    fields: 3,
    hasTemplatePicker: true,
    hasRecipients: true,
    label: "broadcasts",
  },
  automations: {
    rail: 4,
    fields: 2,
    hasTemplatePicker: true,
    hasRecipients: false,
    label: "automations",
  },
  logs: { rail: 0, fields: 0, label: "email logs" },
};

export function EmailSkeleton({ variant = "templates" }) {
  const params = useParams();
  const config = variants[variant] || variants.templates;
  return (
    <section className="mt-2">
      <div className={scope} aria-busy="true">
        <p className="sr-only" role="status">
          Loading {config.label}…
        </p>
        <EmailToolsNav
          waitListId={params.id}
          current={variant}
          action={
            variant === "broadcasts" ? (
              <i className={`${pulse} h-10 w-32`} aria-hidden="true" />
            ) : null
          }
        />
        {config.rail === 0 ? (
          <div className="grid gap-4" aria-hidden="true">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-1.5">
                <i className={`${pulse} h-6 w-36`} />
                <i className={`${pulse} h-4 w-72 max-w-full`} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[0, 1, 2, 3].map((pill) => (
                  <i key={pill} className={`${pulse} h-9 w-20`} />
                ))}
              </div>
            </div>
            <div className="grid divide-y divide-product-border-subtle border-t border-product-border-subtle">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="grid min-w-0 gap-1.5">
                    <i className={`${pulse} h-4 w-48 max-w-full`} />
                    <i className={`${pulse} h-3.5 w-64 max-w-full`} />
                  </div>
                  <i className={`${pulse} h-6 w-20 rounded-full`} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={skelSplit} aria-hidden="true">
            <div className={skelRail}>
              {Array.from({ length: config.rail }, (_, index) => (
                <i key={index} className={skelRailItem} />
              ))}
            </div>
            <div className={skelPane}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="grid min-w-0 gap-1.5">
                  <i className={`${pulse} h-6 w-48 max-w-full`} />
                  <i className={`${pulse} h-4 w-72 max-w-full`} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <i className={`${pulse} h-10 w-24`} />
                  {variant === "automations" ? <i className={`${pulse} h-10 w-20`} /> : null}
                </div>
              </div>
              {config.hasTemplatePicker ? (
                <div className="flex flex-wrap items-center gap-2">
                  <i className={`${pulse} h-10 w-56 max-w-full`} />
                  <i className={`${pulse} h-10 w-28`} />
                </div>
              ) : null}
              <div className={skelFields}>
                {Array.from({ length: config.fields }, (_, index) => (
                  <i key={index} className={skelField} />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <i className={`${pulse} h-10 w-44`} />
                <i className={`${pulse} h-10 w-28`} />
              </div>
              <i className={skelCanvas} />
              <div className="flex flex-wrap items-center justify-between gap-3.5">
                <div className="flex flex-wrap gap-1.5">
                  {[0, 1, 2, 3].map((chip) => (
                    <i key={chip} className={`${pulse} h-7 w-24`} />
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <i className={`${pulse} h-10 w-44 max-w-full`} />
                  <i className={`${pulse} h-10 w-24`} />
                </div>
              </div>
              {config.hasRecipients ? (
                <div className="grid gap-3 rounded-lg border border-product-border-subtle p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <i className={`${pulse} h-10 w-52 max-w-full`} />
                      <i className={`${pulse} h-6 w-24 rounded-full`} />
                    </div>
                    <i className={`${pulse} h-10 w-36`} />
                  </div>
                  <i className={`${pulse} h-4 w-80 max-w-full`} />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
