"use client";

import { useQuery } from "@tanstack/react-query";

import { socialFollowEntries } from "@/lib/referral-cockpit.mjs";
import { cn } from "@/lib/utils";
import { ReactQueryProvider } from "@/providers/query";

import { ShareChannelIcon, channelLabel } from "./share-buttons";

/**
 * Social-follow tasks. UI ships now; points for follows land with the
 * rewards engine, so this component never touches points logic.
 */
export function SocialFollowTasks({ follows, className }) {
  if (!follows?.length) return null;
  return (
    <div className={cn("grid w-full max-w-md gap-2.5", className)}>
      <p className="m-0 text-sm font-bold">Follow along</p>
      <div className="grid gap-2">
        {follows.map((follow) => (
          <a
            key={follow.network}
            href={follow.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-2.5 rounded-wl bg-wl-surface px-3 py-2 text-left text-caption font-bold text-wl-text transition-opacity hover:opacity-85"
          >
            <ShareChannelIcon channel={follow.network} className="size-5" />
            <span className="min-w-0 flex-1 truncate">
              Follow on {channelLabel(follow.network)}
            </span>
          </a>
        ))}
      </div>
      <p className="m-0 text-caption leading-relaxed text-wl-muted">
        Follows earn points once rewards launch.
      </p>
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
            "flex items-center gap-2.5 rounded-wl px-3 py-2 text-caption",
            entry.you ? "bg-wl-button font-bold text-wl-button-text" : "bg-wl-surface",
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
    <div className={cn("grid w-full max-w-md justify-items-center gap-6", className)}>
      {showBoard ? (
        <ReactQueryProvider>
          <LeaderboardCard waitListId={waitListId} code={code} />
        </ReactQueryProvider>
      ) : null}
      <SocialFollowTasks follows={follows} />
    </div>
  );
}
