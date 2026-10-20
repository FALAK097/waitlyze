"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { runWaitlistRehearsal } from "@/app/actions/rehearsal";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { formatProductDate } from "@/lib/product-date.mjs";

function formatDate(value) {
  return formatProductDate(value);
}

export function LaunchRehearsal({
  waitListId,
  initialRuns,
  className = "",
  summaryClassName = "",
  titleClassName = "",
  bodyClassName = "",
}) {
  const [runs, setRuns] = useState(initialRuns);
  const [pending, startTransition] = useTransition();
  const latest = runs[0];

  function run() {
    startTransition(async () => {
      try {
        const response = await runWaitlistRehearsal(waitListId);
        if (response.error) {
          toast.error(response.error);
          return;
        }
        setRuns((current) => [response.result, ...current].slice(0, 5));
      } catch {
        toast.error("The launch check could not be completed. Try again.");
      }
    });
  }

  return (
    <div className={`product-panel p-5 ${className}`}>
      <Collapsible>
        <CollapsibleTrigger className={summaryClassName}>
          <span className={titleClassName}>
            <strong>Private page test</strong>
            <span>
              {latest
                ? `${latest.status === "PASSED" ? "Latest test passed" : "Latest test needs review"} · ${formatDate(latest.createdAt)}`
                : "Test this page and signup setup without creating a subscriber"}
            </span>
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className={bodyClassName}>
            <div className="flex items-start justify-between gap-5 max-[600px]:flex-col">
              <div>
                <h2 id="launch-rehearsal-title" className="mb-1! text-base!">
                  Private page test
                </h2>
                <p className="m-0 max-w-prose text-sm leading-relaxed text-product-text-secondary">
                  Checks use a private test record. They do not send email or add a subscriber.
                </p>
              </div>
              <span className="inline-flex min-h-11 items-center">
                <Button variant="outline" onClick={run} disabled={pending} aria-busy={pending}>
                  {pending ? "Checking…" : "Run check"}
                </Button>
              </span>
            </div>
            {latest && (
              <div className="mt-4.5 border-t border-product-border-subtle pt-4" aria-live="polite">
                <p
                  className={`product-status ${latest.status === "PASSED" ? "product-status-success" : ""}`}
                >
                  {latest.status === "PASSED" ? "Page checks passed" : "Review needed"}
                  <span className="text-caption font-normal text-product-text-secondary">
                    {" "}
                    · {latest.checksPassed} of {latest.checksPassed + latest.checksFailed} checks
                    passed · {formatDate(latest.createdAt)}
                  </span>
                </p>
                <ul className="m-0 mt-4 grid list-none gap-3 p-0">
                  {latest.checkResults.map((check) => (
                    <li key={check.key} className="flex items-start gap-2.5 text-sm">
                      <span
                        aria-hidden="true"
                        className="grid size-5 shrink-0 place-items-center rounded-full border border-product-border-control text-xs"
                      >
                        {check.passed ? "✓" : "!"}
                      </span>
                      <span>
                        <strong className="block">{check.label}</strong>
                        <small className="mt-0.5 block text-caption leading-normal text-product-text-secondary">
                          {check.detail}
                        </small>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {runs.length > 1 && (
              <p className="mb-4! text-sm leading-relaxed text-product-text-secondary">
                {runs.length} recent launch checks are saved for this waitlist.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
