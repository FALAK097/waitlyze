"use client";

import { useQuery } from "@tanstack/react-query";

import { socialFollowEntries } from "@/lib/referral-cockpit.mjs";
import { cn } from "@/lib/utils";
import { ReactQueryProvider } from "@/providers/query";

import { ShareChannelIcon, channelLabel } from "./share-buttons";

/** Social-follow tasks displayed on the referral cockpit. */
export function SocialFollowTasks({ follows, waitListId, code, className }) {
  if (!follows?.length) return null;
  function claimFollow(network) {
    if (!waitListId || !code) return;
    fetch("/api/v1/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitListId, code, network }),
    }).catch(() => {});
  }
  return (
    <div
      className={cn(
        "grid w-full max-w-md justify-items-center gap-3 border-t border-wl-text/15 pt-6",
        className,
      )}
    >
      <p className="m-0 text-sm font-bold">Follow along</p>
      <div className="flex w-full flex-wrap items-center justify-center gap-2.5">
        {follows.map((follow) => (
          <a
            key={follow.network}
            href={follow.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => claimFollow(follow.network)}
            className="inline-flex min-h-10 items-center gap-2 rounded-wl border border-wl-text/15 bg-transparent px-4 py-2 text-caption font-bold text-wl-text transition-colors hover:bg-wl-text/5"
          >
            <ShareChannelIcon channel={follow.network} className="size-5" />
            <span className="truncate">Follow on {channelLabel(follow.network)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardSummary({ position, total, referralsToNext, className }) {
  return (
    <p className={cn("m-0 text-sm leading-relaxed", className)}>
      <strong>
        #{position} of {total.toLocaleString("en-US")}
      </strong>
      {referralsToNext > 0 ? (
        <span className="text-wl-muted">
          {" "}
          — {referralsToNext} more referral{referralsToNext === 1 ? "" : "s"} to #{position - 1}
        </span>
      ) : (
        <span className="text-wl-muted"> — you lead the pack</span>
      )}
    </p>
  );
}

/** Privacy-masked neighborhood rows. Emails arrive masked from the API. */
export function LeaderboardRows({ neighbors }) {
  return (
    <ol className="m-0 grid w-full list-none gap-1 p-0">
      {neighbors.map((entry) => (
        <li
          key={entry.position}
          className={cn(
            "flex items-center gap-2.5 px-3.5 py-2.5 text-caption",
            entry.you
              ? "rounded-wl bg-wl-button font-bold text-wl-button-text"
              : "border-b border-wl-text/10 last:border-b-0",
          )}
          aria-current={entry.you ? "true" : undefined}
        >
          <span className="w-8 shrink-0 font-bold tabular-nums">#{entry.position}</span>
          <span className="min-w-0 flex-1 truncate">{entry.you ? "you" : entry.maskedEmail}</span>
          <span className={cn("shrink-0 tabular-nums", !entry.you && "text-wl-muted")}>
            {entry.referrals} referral{entry.referrals === 1 ? "" : "s"}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function LeaderboardCard({ waitListId, code, className }) {
  const { data: board } = useQuery({
    queryKey: ["public-leaderboard", waitListId, code],
    enabled: Boolean(waitListId && code),
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `/api/v1/leaderboard?waitListId=${encodeURIComponent(waitListId)}&code=${encodeURIComponent(code)}`,
        { signal },
      );
      return response.ok ? response.json() : null;
    },
  });
  if (!board) return null;
  return (
    <div className={cn("grid w-full max-w-md gap-2.5", className)}>
      <p className="m-0 text-sm font-bold">Leaderboard</p>
      <LeaderboardSummary
        position={board.position}
        total={board.total}
        referralsToNext={board.referralsToNext}
      />
      {Array.isArray(board.neighbors) && board.neighbors.length > 0 ? (
        <LeaderboardRows neighbors={board.neighbors} />
      ) : null}
    </div>
  );
}

/** Live cockpit extras below the share buttons: leaderboard + follow tasks. */
export function ReferralCockpitExtras({ waitListId, code, statusPage, className }) {
  const follows = socialFollowEntries(statusPage);
  const showBoard = statusPage?.showLeaderboard !== false;
  if (!showBoard && follows.length === 0) return null;
  return (
    <div
      className={cn(
        "mt-3 grid w-full max-w-md justify-items-center gap-6 border-t border-wl-text/15 pt-6",
        className,
      )}
    >
      {showBoard ? (
        <ReactQueryProvider>
          <LeaderboardCard waitListId={waitListId} code={code} />
        </ReactQueryProvider>
      ) : null}
      <SocialFollowTasks follows={follows} waitListId={waitListId} code={code} />
    </div>
  );
}
