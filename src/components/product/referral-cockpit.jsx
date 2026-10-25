"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { ShareChannelIcon, channelLabel } from "./share-buttons";

/** Keep founder-entered follow links to safe https destinations. */
export function safeFollowUrl(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\s*(javascript|data|vbscript|file|blob):/i.test(trimmed)) return null;
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (/^http:\/\//i.test(trimmed)) return trimmed.replace(/^http:\/\//i, "https://");
  if (/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}([/?#].*)?$/.test(trimmed)) return `https://${trimmed}`;
  return null;
}

export function socialFollowEntries(statusPage) {
  const follows = Array.isArray(statusPage?.socialFollows) ? statusPage.socialFollows : [];
  return follows
    .filter((entry) => entry && (entry.network === "x" || entry.network === "instagram"))
    .map((entry) => ({ network: entry.network, url: safeFollowUrl(entry.url) }))
    .filter((entry) => entry.url);
}

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
  const [board, setBoard] = useState(null);
  useEffect(() => {
    if (!waitListId || !code) return;
    let live = true;
    fetch(
      `/api/v1/leaderboard?waitListId=${encodeURIComponent(waitListId)}&code=${encodeURIComponent(code)}`,
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (live && data && typeof data.position === "number") setBoard(data);
        return null;
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [waitListId, code]);
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
      {showBoard ? <LeaderboardCard waitListId={waitListId} code={code} /> : null}
      <SocialFollowTasks follows={follows} />
    </div>
  );
}
