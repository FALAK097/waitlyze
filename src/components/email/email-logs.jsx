import { formatProductDate } from "@/lib/product-date.mjs";
import styles from "./email-tools.module.css";

export function EmailLogs({ runs }) {
  return <section className={styles.logsPane} aria-label="Email runs">
    {runs.length ? <ul className={styles.runs}>{runs.map((run) => <li key={run.id}>
      <div className={styles.who}><strong>{run.title}</strong><span>{run.kind} · {run.recipient}{run.reason ? ` · ${run.reason}` : ""}</span></div>
      <span className={`automation-status automation-status-${run.statusCode.toLowerCase()}`}>{run.status}</span>
      <time dateTime={run.at}>{formatProductDate(run.at)}</time>
    </li>)}</ul> : <p className={styles.runsEmpty}>No emails have gone out from this waitlist yet. Enable an automation or send a broadcast and it will show up here.</p>}
  </section>;
}
