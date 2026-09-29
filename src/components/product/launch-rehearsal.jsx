"use client";

import { useState, useTransition } from "react";
import { runWaitlistRehearsal } from "@/app/actions/rehearsal";
import { Button } from "@/components/product/button";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function LaunchRehearsal({ waitListId, initialRuns }) {
  const [runs, setRuns] = useState(initialRuns);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const latest = runs[0];

  function run() {
    setError("");
    startTransition(async () => {
      try {
        const response = await runWaitlistRehearsal(waitListId);
        if (response.error) {
          setError(response.error);
          return;
        }
        setRuns((current) => [response.result, ...current].slice(0, 5));
      } catch {
        setError("The launch check could not be completed. Try again.");
      }
    });
  }

  return (
    <section className="product-panel launch-rehearsal" aria-labelledby="launch-rehearsal-title">
      <div className="launch-rehearsal-heading">
        <div>
          <h2 id="launch-rehearsal-title">Launch check</h2>
          <p className="product-help">Check the saved page and signup setup. This creates a private test record and never sends email or adds a subscriber.</p>
        </div>
        <Button variant="outline" onClick={run} disabled={pending} aria-busy={pending}>
          {pending ? "Checking…" : "Run check"}
        </Button>
      </div>
      {error && <p className="product-field-error" role="alert">{error}</p>}
      {latest && (
        <div className="launch-rehearsal-result" aria-live="polite">
          <p className={`product-status ${latest.status === "PASSED" ? "product-status-success" : ""}`}>
            {latest.status === "PASSED" ? "Page checks passed" : "Review needed"}
            <span> · {latest.checksPassed} of {latest.checksPassed + latest.checksFailed} checks passed · {formatDate(latest.createdAt)}</span>
          </p>
          <ul>
            {latest.checkResults.map((check) => (
              <li key={check.key}>
                <span aria-hidden="true">{check.passed ? "✓" : "!"}</span>
                <span><strong>{check.label}</strong><small>{check.detail}</small></span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {runs.length > 1 && <p className="product-help">{runs.length} recent launch checks are saved for this waitlist.</p>}
    </section>
  );
}
