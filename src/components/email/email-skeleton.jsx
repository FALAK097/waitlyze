"use client";

import { useParams } from "next/navigation";

import { EmailToolsNav } from "./email-tools-nav";

const scope = "min-w-0 bg-white text-product-text-primary";
const skelPane = "grid max-w-195 gap-4 lg:min-w-0 lg:flex-1";
const skelHead =
  "block h-5 w-47.5 rounded-product-control bg-product-bg-inset motion-safe:animate-pulse";
const skelLogRow =
  "block h-11 rounded-product-control bg-product-bg-inset motion-safe:animate-pulse";
const skelSplit = "flex flex-col gap-6 md:gap-8 xl:gap-10 lg:flex-row lg:items-start";
const skelRail = "flex flex-col gap-2 max-lg:flex-row max-lg:flex-wrap lg:w-52 lg:shrink-0";
const skelRailItem =
  "block h-14.5 w-full rounded-product-control bg-product-bg-inset motion-safe:animate-pulse max-lg:min-w-38 max-lg:flex-1";
const skelFields = "grid overflow-hidden rounded-lg border border-product-border-subtle";
const skelField =
  "h-13 bg-product-bg-inset motion-safe:animate-pulse [&+&]:border-t border-product-border-subtle";
const skelCanvas =
  "h-105 border border-product-border-subtle bg-product-bg-inset motion-safe:animate-pulse";
const skelBar =
  "block h-4 w-65 rounded-product-control bg-product-bg-inset motion-safe:animate-pulse";
const skelActions =
  "block h-9 w-57.5 rounded-product-control bg-product-bg-inset motion-safe:animate-pulse";

const variants = {
  templates: { rail: 2, fields: 2, label: "email templates" },
  broadcasts: { rail: 3, fields: 3, label: "broadcasts" },
  automations: { rail: 3, fields: 3, label: "automations" },
  logs: { rail: 0, fields: 0, label: "email logs" },
};

export function EmailSkeleton({ variant = "templates" }) {
  const params = useParams();
  const config = variants[variant] || variants.templates;
  return (
    <div className="mt-6">
      <div className={scope} aria-busy="true">
        <p className="sr-only" role="status">
          Loading {config.label}…
        </p>
        <EmailToolsNav waitListId={params.id} current={variant} />
        {config.rail === 0 ? (
          <div className={skelPane} aria-hidden="true">
            <i className={skelHead} />
            {Array.from({ length: 8 }, (_, index) => (
              <i key={index} className={skelLogRow} />
            ))}
          </div>
        ) : (
          <div className={skelSplit} aria-hidden="true">
            <div className={skelRail}>
              {Array.from({ length: config.rail }, (_, index) => (
                <i key={index} className={skelRailItem} />
              ))}
            </div>
            <div className={skelPane}>
              <i className={skelHead} />
              <div className={skelFields}>
                {Array.from({ length: config.fields }, (_, index) => (
                  <i key={index} className={skelField} />
                ))}
              </div>
              <i className={skelCanvas} />
              <i className={skelBar} />
              <i className={skelActions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
