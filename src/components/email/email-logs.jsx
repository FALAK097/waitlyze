import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

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

const logsPane = "w-full min-w-0";
const logsRuns =
  "m-0 mt-2 list-none overflow-hidden rounded-lg border border-product-border-subtle bg-white p-0";
const logsRun =
  "group flex flex-col gap-2 border-b border-product-border-subtle px-4 py-3.5 no-underline last:border-b-0 hover:bg-product-bg-inset focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-product-success-text! sm:flex-row sm:items-center sm:gap-4";
const logsRunWho = "min-w-0 flex-1";
const logsRunTitle = "block text-caption font-medium text-product-text-primary";
const logsRunDetail = "text-xs text-product-text-secondary wrap-anywhere";
const logsRunMeta = "flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:shrink-0";
const logsRunTime = "text-xs text-product-text-secondary whitespace-nowrap";
const logsRunGo =
  "shrink-0 text-product-text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-product-text-primary motion-reduce:transition-none max-sm:hidden";
const logsEmpty = "m-0 text-caption text-product-text-secondary";

function runHref(waitListId, run) {
  const root = `/waitlists/${waitListId}/emails`;
  if (!run.targetId) return root;
  return run.kind === "Broadcast"
    ? `${root}/broadcasts?broadcast=${run.targetId}`
    : `${root}/automations?recipe=${run.targetId}`;
}

export function EmailLogs({ waitListId, runs }) {
  return (
    <section className={logsPane} aria-label="Email runs">
      {runs.length ? (
        <ul className={logsRuns}>
          {runs.map((run) => (
            <li key={run.id} className="m-0 p-0">
              <Link prefetch={false} href={runHref(waitListId, run)} className={logsRun}>
                <div className={logsRunWho}>
                  <strong className={logsRunTitle}>{run.title}</strong>
                  <span className={logsRunDetail}>
                    {run.kind} · {run.recipient}
                    {run.reason ? ` · ${run.reason}` : ""}
                  </span>
                </div>
                <div className={logsRunMeta}>
                  <span
                    className={cn(
                      statusBadge,
                      statusBadgeTone[String(run.statusCode).toLowerCase()],
                    )}
                  >
                    {run.status}
                  </span>
                  <time dateTime={run.at} className={logsRunTime}>
                    {formatProductDate(run.at)}
                  </time>
                </div>
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" className={logsRunGo} />
              </Link>
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
