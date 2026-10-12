import Link from "next/link";
import { Check, ChevronDown, Circle, Clock3 } from "lucide-react";

export function LaunchReadiness({ checks }) {
  const ready = checks.filter((check) => check.status === "ready").length;
  return <section className="launch-readiness" aria-labelledby="launch-readiness-title">
    <details open={ready !== checks.length}>
      <summary className="launch-readiness-summary"><div><h2 id="launch-readiness-title">Launch checklist</h2><span>{ready === checks.length ? "All checks passed" : `${ready} of ${checks.length} checks ready`}</span></div><ChevronDown aria-hidden="true" /></summary>
      <ul>{checks.map((check) => <li key={check.key} data-status={check.status}>
        <span className="launch-readiness-mark" aria-hidden="true">{check.status === "ready" ? <Check /> : check.status === "pending" ? <Clock3 /> : <Circle />}</span>
        <div className="launch-readiness-copy"><div className="launch-readiness-label"><strong>{check.label}</strong><span>{check.status === "ready" ? "Ready" : check.status === "pending" ? check.stateLabel || "Checking" : "Action needed"}</span></div><p>{check.detail}</p></div>
        {check.status === "action" && <Link href={check.href} className="launch-readiness-link" aria-label={`${check.actionLabel}: ${check.label}`}>{check.actionLabel}</Link>}
      </li>)}</ul>
    </details>
  </section>;
}
