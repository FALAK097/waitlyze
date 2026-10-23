import { formatProductDate } from "@/lib/product-date.mjs";
import { cn } from "@/lib/utils";

const statusBadge =
  "inline-flex min-h-6 items-center rounded-full border border-product-border-subtle px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-product-text-secondary";
const statusBadgeTone = {
  enabled: "border-product-success-text/34 text-product-success-text",
  sent: "border-product-success-text/34 text-product-success-text",
  failed: "border-product-danger-text/34 text-product-danger-text",
  canceled: "bg-product-bg-inset",
  skipped: "bg-product-bg-inset",
};

const logsPane = "max-w-215";
const logsRuns = "mt-2 list-none border-t border-product-border-subtle p-0";
const logsRun =
  "flex items-center gap-x-4 gap-y-1.5 border-b border-product-border-subtle py-2.75 max-sm:flex-col max-sm:items-start max-sm:gap-1.5";
const logsRunWho = "min-w-0 flex-1";
const logsRunTitle = "block text-caption font-medium";
const logsRunDetail = "text-xs text-product-text-secondary wrap-anywhere";
const logsRunTime = "text-xs text-product-text-secondary whitespace-nowrap";
const logsEmpty = "m-0 text-caption text-product-text-secondary";

export function EmailLogs({ runs }) {
  return (
    <section className={logsPane} aria-label="Email runs">
      {runs.length ? (
        <ul className={logsRuns}>
          {runs.map((run) => (
            <li key={run.id} className={logsRun}>
              <div className={logsRunWho}>
                <strong className={logsRunTitle}>{run.title}</strong>
                <span className={logsRunDetail}>
                  {run.kind} · {run.recipient}
                  {run.reason ? ` · ${run.reason}` : ""}
                </span>
              </div>
              <span
                className={cn(statusBadge, statusBadgeTone[String(run.statusCode).toLowerCase()])}
              >
                {run.status}
              </span>
              <time dateTime={run.at} className={logsRunTime}>
                {formatProductDate(run.at)}
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <p className={logsEmpty}>
          No emails have gone out from this waitlist yet. Enable an automation or send a broadcast
          and it will show up here.
        </p>
      )}
    </section>
  );
}
