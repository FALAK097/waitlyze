import { ArrowDown01Icon, CircleIcon, Clock03Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

const readinessShell = [
  "p-0",
  "[&_[data-slot=collapsible-trigger]]:flex",
  "[&_[data-slot=collapsible-trigger]]:min-h-16",
  "[&_[data-slot=collapsible-trigger]]:cursor-pointer",
  "[&_[data-slot=collapsible-trigger]]:list-none",
  "[&_[data-slot=collapsible-trigger]]:items-center",
  "[&_[data-slot=collapsible-trigger]]:justify-between",
  "[&_[data-slot=collapsible-trigger]]:gap-4",
  "[&_[data-slot=collapsible-trigger]_h2]:text-item!",
  "[&_[data-slot=collapsible-trigger]_h2]:mb-1!",
  "[&_[data-slot=collapsible-trigger]_span]:text-caption",
  "[&_[data-slot=collapsible-trigger]_span]:text-product-text-secondary",
  "[&_[data-slot=collapsible-trigger]_>svg]:text-product-text-secondary",
  "[&_[data-slot=collapsible][data-open]_[data-slot=collapsible-trigger]_>svg]:rotate-180",
].join(" ");

export function LaunchReadiness({ checks }) {
  const ready = checks.filter((check) => check.status === "ready").length;
  return (
    <section className={readinessShell} aria-labelledby="launch-readiness-title">
      <Collapsible defaultOpen={ready !== checks.length}>
        <CollapsibleTrigger>
          <div>
            <h2 id="launch-readiness-title">Launch checklist</h2>
            <span>
              {ready === checks.length
                ? "All checks passed"
                : `${ready} of ${checks.length} checks ready`}
            </span>
          </div>
          <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="m-0 mt-6 grid list-none gap-5 p-0">
            {checks.map((check) => (
              <li
                key={check.key}
                data-status={check.status}
                className="flex min-w-0 items-center gap-4 max-[600px]:items-start"
              >
                <span
                  className={`inline-flex shrink-0 basis-5 text-product-text-secondary ${
                    check.status === "ready" ? "text-product-success-text" : ""
                  }`}
                  aria-hidden="true"
                >
                  {check.status === "ready" ? (
                    <HugeiconsIcon icon={Tick01Icon} />
                  ) : check.status === "pending" ? (
                    <HugeiconsIcon icon={Clock03Icon} />
                  ) : (
                    <HugeiconsIcon icon={CircleIcon} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <strong className="text-sm font-medium">{check.label}</strong>
                    <span className="text-xs text-product-text-secondary">
                      {check.status === "ready"
                        ? "Ready"
                        : check.status === "pending"
                          ? check.stateLabel || "Checking"
                          : "Action needed"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-caption leading-normal text-product-text-secondary">
                    {check.detail}
                  </p>
                </div>
                {check.status === "action" && (
                  <Link
                    prefetch={false}
                    href={check.href}
                    className="inline-flex min-h-11 min-w-16 items-center justify-center px-2 text-caption font-medium text-product-text-primary underline underline-offset-4 hover:bg-product-bg-inset max-[600px]:min-w-13"
                    aria-label={`${check.actionLabel}: ${check.label}`}
                  >
                    {check.actionLabel}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
