import { ArrowDown01Icon, CircleIcon, Clock03Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

export function LaunchReadiness({ checks }) {
  const ready = checks.filter((check) => check.status === "ready").length;
  return (
    <section className="launch-readiness" aria-labelledby="launch-readiness-title">
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
          <ul>
            {checks.map((check) => (
              <li key={check.key} data-status={check.status}>
                <span className="launch-readiness-mark" aria-hidden="true">
                  {check.status === "ready" ? (
                    <HugeiconsIcon icon={Tick01Icon} />
                  ) : check.status === "pending" ? (
                    <HugeiconsIcon icon={Clock03Icon} />
                  ) : (
                    <HugeiconsIcon icon={CircleIcon} />
                  )}
                </span>
                <div className="launch-readiness-copy">
                  <div className="launch-readiness-label">
                    <strong>{check.label}</strong>
                    <span>
                      {check.status === "ready"
                        ? "Ready"
                        : check.status === "pending"
                          ? check.stateLabel || "Checking"
                          : "Action needed"}
                    </span>
                  </div>
                  <p>{check.detail}</p>
                </div>
                {check.status === "action" && (
                  <Link
                    prefetch={false}
                    href={check.href}
                    className="launch-readiness-link"
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
