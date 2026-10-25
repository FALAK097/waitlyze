import Link from "next/link";

import { OVERVIEW_REFERRAL_FILTERS } from "@/lib/dashboard/overview.mjs";
import { formatProductDate } from "@/lib/product-date.mjs";
import { waitlistsHref } from "@/lib/waitlist-search.mjs";

const PANEL = [
  "min-w-0 overflow-hidden rounded-xl border border-product-border-subtle",
  "bg-product-bg-surface shadow-xs",
].join(" ");

const REFERRAL_LABELS = { all: "All signups", organic: "Organic", referred: "Referred" };

function overviewHref({ query, status, sort, referral }) {
  const base = waitlistsHref({ query, status, sort });
  const params = new URLSearchParams(base.includes("?") ? base.slice(base.indexOf("?") + 1) : "");
  if (referral && referral !== "all") params.set("ref", referral);
  else params.delete("ref");
  const serialized = params.toString();
  return serialized ? `/waitlists?${serialized}` : "/waitlists";
}

function Stat({ label, value, detail }) {
  return (
    <div className="grid min-w-0 content-start gap-0.5 border-s border-product-border-subtle px-4 pt-4.25 pb-3.5 nth-[4]:border-s-0 nth-[n+4]:border-t @min-[33rem]:nth-[4]:border-s @min-[33rem]:nth-[4]:border-t-0 @min-[33rem]:nth-[5]:border-s-0 @min-[41.25rem]:nth-[5]:border-s @min-[41.25rem]:nth-[5]:border-t-0">
      <dt className="truncate text-xs text-product-text-secondary">{label}</dt>
      <dd className="mt-0.5 truncate font-product-display text-2xl leading-tight font-semibold tracking-tighter text-product-text-primary tabular-nums">
        {value}
      </dd>
      {detail ? (
        <small className="pt-0.75 text-micro leading-snug text-product-text-secondary">
          {detail}
        </small>
      ) : null}
    </div>
  );
}

/** Cross-waitlist overview: totals, referral filter, recent activity, per-list health. */
export function WorkspaceOverview({ overview, query, status, sort }) {
  const { totals, recent, lists } = overview;
  const formatCount = (value) => (value ?? 0).toLocaleString();
  return (
    <section aria-labelledby="workspace-overview-title" className="mb-6 grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="workspace-overview-title" className="text-lg font-semibold">
            Overview
          </h2>
          <p className="pt-1 text-caption text-product-text-secondary">
            All-time totals across this workspace · {totals.waitlists}{" "}
            {totals.waitlists === 1 ? "waitlist" : "waitlists"}
          </p>
        </div>
        <div
          className="inline-flex items-center gap-0.5 rounded-lg border border-product-border-subtle bg-product-bg-surface p-0.75"
          role="group"
          aria-label="Filter overview by referral data"
        >
          {OVERVIEW_REFERRAL_FILTERS.map((value) => (
            <Link
              key={value}
              prefetch={false}
              href={overviewHref({ query, status, sort, referral: value })}
              aria-pressed={overview.referral === value}
              className={`inline-flex min-h-9 items-center rounded-lg px-2.5 py-1.5 text-xs font-medium no-underline ${
                overview.referral === value
                  ? "bg-product-bg-inset text-product-text-primary"
                  : "text-product-text-secondary"
              }`}
            >
              {REFERRAL_LABELS[value]}
            </Link>
          ))}
        </div>
      </div>

      <div className={PANEL}>
        <dl className="m-0 grid grid-cols-3 @min-[33rem]:grid-cols-4 @min-[41.25rem]:grid-cols-5">
          <Stat label="Waitlists" value={formatCount(totals.waitlists)} />
          <Stat
            label={
              overview.referral === "all"
                ? "Signups"
                : `Signups · ${REFERRAL_LABELS[overview.referral].toLowerCase()}`
            }
            value={formatCount(totals.signups)}
            detail={
              totals.verificationRate == null
                ? "No signups yet"
                : `${totals.verificationRate}% verified`
            }
          />
          <Stat
            label="Page views"
            value={formatCount(totals.visitors)}
            detail="Stored impressions"
          />
          <Stat
            label="Referred"
            value={formatCount(totals.referred)}
            detail={
              totals.allSignups === 0
                ? "No signups yet"
                : `${Math.round((totals.referred / totals.allSignups) * 1000) / 10}% of all signups`
            }
          />
          <Stat label="Verified" value={formatCount(totals.verified)} detail="Confirmed email" />
        </dl>
      </div>

      <div className="grid grid-cols-5 gap-4 max-[900px]:grid-cols-1">
        <div className={`${PANEL} col-span-2 pb-2`}>
          <h3 className="px-4 pt-4 pb-2 text-sm font-semibold">Recent activity</h3>
          {recent.length ? (
            <ul className="m-0 grid list-none gap-0 p-0">
              {recent.map((row) => (
                <li
                  key={row.id}
                  className="flex min-w-0 items-center justify-between gap-3 border-t border-product-border-subtle px-4 py-2.5 text-xs"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-product-text-primary">
                      {row.email}
                    </span>
                    <Link
                      prefetch={false}
                      href={`/waitlists/${row.waitListId}/subscribers`}
                      className="block truncate text-product-text-secondary"
                    >
                      {row.waitListName}
                    </Link>
                  </span>
                  <span className="shrink-0 text-micro text-product-text-secondary tabular-nums">
                    {formatProductDate(row.createdAt)}
                    {row.verified ? " · verified" : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t border-product-border-subtle px-4 py-6 text-center text-xs text-product-text-secondary">
              No signups match this filter yet.
            </p>
          )}
        </div>

        <div className={`${PANEL} col-span-3 pb-2`}>
          <h3 className="px-4 pt-4 pb-2 text-sm font-semibold">Per-list health</h3>
          {lists.length ? (
            <div className="no-scrollbar overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <caption className="sr-only">Signup health per waitlist</caption>
                <thead>
                  <tr className="[&_th]:border-b [&_th]:border-product-border-subtle [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_th]:text-product-text-secondary">
                    <th scope="col">Waitlist</th>
                    <th scope="col">Signups</th>
                    <th scope="col">Views</th>
                    <th scope="col">Conversion</th>
                    <th scope="col">Referred</th>
                  </tr>
                </thead>
                <tbody>
                  {lists.slice(0, 10).map((list) => (
                    <tr
                      key={list.id}
                      className="[&_td]:border-b [&_td]:border-product-border-subtle [&_td]:px-3 [&_td]:py-2.5 [&_td]:tabular-nums"
                    >
                      <th scope="row" className="font-medium">
                        <Link
                          prefetch={false}
                          href={`/waitlists/${list.id}/analytics`}
                          className="text-product-text-primary"
                        >
                          {list.name}
                        </Link>
                      </th>
                      <td>{formatCount(list.signups)}</td>
                      <td>{formatCount(list.visitors)}</td>
                      <td>{list.conversion == null ? "—" : `${list.conversion}%`}</td>
                      <td>
                        {formatCount(list.referred)}
                        {list.referralShare == null ? "" : ` · ${list.referralShare}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="border-t border-product-border-subtle px-4 py-6 text-center text-xs text-product-text-secondary">
              Create a waitlist to see per-list health.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
