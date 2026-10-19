import Link from "next/link";
import { releases } from "./releases";
import "./changelog.css";

export const metadata = {
  title: "Changelog",
  description: "Product updates and improvements from Waitlyze, from v0.1.0 toward 1.0.",
};

export default function ChangelogPage() {
  return (
    <main className="release-page">
      <header className="release-header">
        <Link className="release-wordmark" href="/" aria-label="Waitlyze home">
          <span className="release-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Waitlyze</span>
        </Link>
        <Link className="release-back" href="/waitlists">Back to app <span aria-hidden="true">↗</span></Link>
      </header>

      <section className="release-intro" aria-labelledby="release-title">
        <p className="release-eyebrow"><span className="release-live-dot" /> Product updates</p>
        <h1 id="release-title">Built for every<br /><span>launch milestone.</span></h1>
        <div className="release-intro-bottom">
          <p>Small improvements, bigger launches. A retrospective of what we’ve shipped so far—and what we’re building toward next.</p>
          <span className="release-status">PRE-1.0&nbsp; / &nbsp;V0.1—V0.9</span>
        </div>
      </section>

      <section className="release-list" aria-label="Release history">
        {releases.map((release, index) => (
          <article className="release-entry" key={release.version}>
            <div className="release-meta">
              <span className="release-dot" aria-hidden="true" />
              <span className="release-version">v{release.version}</span>
              {index === 0 && <span className="release-latest">LATEST</span>}
            </div>
            <div className="release-content">
              <h2>{release.label}</h2>
              <p className="release-summary">{release.summary}</p>
              <ul>
                {release.changes.map((change) => <li key={change}>{change}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <footer className="release-footer">
        <p><span>Next up</span> We’re working toward 1.0. Thanks for building with us.</p>
        <Link href="mailto:hi@falakgala.dev">Share an idea <span aria-hidden="true">↗</span></Link>
      </footer>
    </main>
  );
}
