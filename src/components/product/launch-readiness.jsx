import Link from "next/link";

export function LaunchReadiness({ checks }) {
  return <section className="product-panel launch-readiness" aria-labelledby="launch-readiness-title">
    <div className="launch-readiness-heading">
      <div>
        <h2 id="launch-readiness-title">Launch readiness</h2>
        <p className="product-help">Check page structure, signup setup, and publication state before sharing your waitlist.</p>
      </div>
    </div>
    <ul>
      {checks.map((check) => <li key={check.key} data-status={check.status}>
        <span className="launch-readiness-mark" aria-hidden="true">{check.status === "ready" ? "✓" : check.status === "pending" ? "…" : "·"}</span>
        <div className="launch-readiness-copy">
          <div className="launch-readiness-label"><strong>{check.label}</strong><span>{check.status === "ready" ? "Ready" : check.status === "pending" ? "Checking" : "Action needed"}</span></div>
          <p>{check.detail}</p>
        </div>
        {check.status === "action" && <Link href={check.href} className="launch-readiness-link" aria-label={`Review ${check.label}`}>Review</Link>}
      </li>)}
    </ul>
  </section>;
}
