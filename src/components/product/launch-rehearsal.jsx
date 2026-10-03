"use client";

import { useState, useTransition } from "react";
import { runWaitlistRehearsal } from "@/app/actions/rehearsal";
import { Button } from "@/components/product/button";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function LaunchRehearsal({ waitListId, initialRuns, className = "", summaryClassName = "", titleClassName = "", bodyClassName = "" }) {
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
    <details className={`product-panel launch-rehearsal ${className}`}>
      <summary className={summaryClassName}>
        <span className={titleClassName}>
          <strong>Optional launch check</strong>
          <span>{latest ? `${latest.status === "PASSED" ? "Latest check passed" : "Latest check needs review"} · ${formatDate(latest.createdAt)}` : "Run a private test of this page and signup setup"}</span>
        </span>
      </summary>
      <div className={bodyClassName}>
        <div className="launch-rehearsal-heading">
          <div>
            <h2 id="launch-rehearsal-title">Launch check</h2>
            <p className="product-help">Checks use a private test record. They do not send email or add a subscriber.</p>
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
      </div>
    </details>
  );
}
