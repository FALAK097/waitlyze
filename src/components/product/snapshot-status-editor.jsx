import { Add01Icon, ArrowUpRight01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { SHARE_CHANNELS, ShareChannelIcon } from "./share-buttons";
import {
  Field,
  HttpsInputField,
  PointsField,
  RedirectUrlField,
  SelectField,
  Toggle,
} from "./snapshot-editor-fields";

export function SnapshotStatusEditor({
  status,
  form,
  updateForm,
  rewards,
  showReferrals = true,
  waitListId,
  onStatusChange,
  onRewardsChange,
}) {
  // Drafts saved before rewards existed have no key yet: fall back to the
  // zero-config defaults (same values the API resolves server-side).
  const perks = {
    pointsSignup: 50,
    pointsReferral: 30,
    pointsFollow: 5,
    customEvents: [],
    positionOffset: 0,
    hideCounts: false,
    showPoints: true,
    showProgress: true,
    ...rewards,
  };
  const referralNote = showReferrals ? null : (
    <p className="m-0 text-caption leading-relaxed text-product-text-secondary">
      Referral sharing is off for this waitlist, so the referral link and share buttons stay hidden.{" "}
      <Link
        className="underline underline-offset-4"
        href={`/waitlists/${waitListId}/settings?section=referral`}
      >
        Turn referrals on
      </Link>
    </p>
  );
  // Snapshots saved before the cockpit fields existed parse without them;
  // fall back to the schema defaults so the builder never crashes.
  const channels = Array.isArray(status.shareChannels) ? status.shareChannels : [];
  const follows = Array.isArray(status.socialFollows) ? status.socialFollows : [];
  const followUrl = (network) => follows.find((entry) => entry?.network === network)?.url ?? "";
  const setFollowUrl = (network, url) => {
    const next = follows.filter((entry) => entry?.network !== network);
    if (url.trim()) next.push({ network, url: url.trim() });
    onStatusChange({ socialFollows: next });
  };
  return (
    <div className="grid gap-4 p-4">
      <SelectField
        label="After a successful signup"
        value={status.postSignupBehavior}
        options={[
          { id: "confirmation", label: "Show confirmation" },
          { id: "no-change", label: "No redirect or state change" },
        ]}
        onChange={(postSignupBehavior) => onStatusChange({ postSignupBehavior })}
      />
      {status.postSignupBehavior !== "no-change" && (
        <RedirectUrlField
          key={form.successRedirectUrl ?? ""}
          value={form.successRedirectUrl ?? ""}
          onChange={(successRedirectUrl) => {
            let host = "";
            if (/^https:\/\//i.test(successRedirectUrl)) {
              try {
                host = new URL(successRedirectUrl).hostname.toLowerCase();
              } catch {
                host = "";
              }
            }
            updateForm({
              successRedirectUrl,
              successRedirectAllowlist: host ? [host] : [],
            });
          }}
        />
      )}
      <div className="grid gap-4 border-t border-product-border-subtle pt-4">
        <span className="block text-micro font-bold tracking-widest text-product-text-secondary uppercase">
          Confirmation screen
        </span>
        <Field
          label="Confirmed heading"
          value={status.heading}
          onChange={(heading) => onStatusChange({ heading })}
        />
        <Field
          label="Confirmed message"
          value={status.body}
          multiline
          onChange={(body) => onStatusChange({ body })}
        />
        <Field
          label="Pending heading"
          value={status.pendingHeading}
          onChange={(pendingHeading) => onStatusChange({ pendingHeading })}
        />
        <Field
          label="Pending message"
          value={status.pendingBody}
          multiline
          onChange={(pendingBody) => onStatusChange({ pendingBody })}
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Icon style"
            value={status.iconStyle || "filled"}
            options={[
              { id: "filled", label: "Filled" },
              { id: "soft", label: "Soft" },
            ]}
            onChange={(iconStyle) => onStatusChange({ iconStyle })}
          />
          <SelectField
            label="Layout"
            value={status.layout || "centered"}
            options={[
              { id: "centered", label: "Centered" },
              { id: "card", label: "Card" },
            ]}
            onChange={(layout) => onStatusChange({ layout })}
          />
        </div>
        <Toggle
          label="Show position"
          checked={status.showPosition}
          onChange={(showPosition) => onStatusChange({ showPosition })}
        />
      </div>
      <div className="grid gap-3.5 border-t border-product-border-subtle pt-4">
        <span className="block text-micro font-bold tracking-widest text-product-text-secondary uppercase">
          Referrals & sharing
        </span>
        {referralNote}
        <Toggle
          label="Show referral link"
          checked={status.showReferralLink}
          disabled={!showReferrals}
          onChange={(showReferralLink) => onStatusChange({ showReferralLink })}
        />
        <Toggle
          label="Show referral count"
          checked={status.showReferralCount}
          disabled={!showReferrals}
          onChange={(showReferralCount) => onStatusChange({ showReferralCount })}
        />
        <Toggle
          label="Show leaderboard"
          checked={status.showLeaderboard !== false}
          disabled={!showReferrals}
          onChange={(showLeaderboard) => onStatusChange({ showLeaderboard })}
        />
        <Field
          label="Share message"
          value={status.shareMessage}
          multiline
          disabled={!showReferrals}
          onChange={(shareMessage) => onStatusChange({ shareMessage })}
        />
        <div className="grid gap-2.5 pt-1">
          <span className="block text-micro font-bold tracking-widest text-product-text-secondary uppercase">
            Share buttons
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {SHARE_CHANNELS.map(({ id: channel, label }) => (
              <Toggle
                key={channel}
                label={
                  <span className="inline-flex items-center gap-2">
                    <ShareChannelIcon channel={channel} className="size-4" />
                    {label}
                  </span>
                }
                checked={channels.includes(channel)}
                disabled={!showReferrals}
                onChange={(enabled) =>
                  onStatusChange({
                    shareChannels: enabled
                      ? [...channels, channel]
                      : channels.filter((item) => item !== channel),
                  })
                }
              />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-3.5 border-t border-product-border-subtle pt-4">
        <span className="block text-micro font-bold tracking-widest text-product-text-secondary uppercase">
          Social follows
        </span>
        <HttpsInputField
          label="X profile URL"
          value={followUrl("x")}
          disabled={!showReferrals}
          placeholder="x.com/yourhandle"
          onChange={(url) => setFollowUrl("x", url)}
        />
        <HttpsInputField
          label="Instagram profile URL"
          value={followUrl("instagram")}
          disabled={!showReferrals}
          placeholder="instagram.com/yourhandle"
          onChange={(url) => setFollowUrl("instagram", url)}
        />
      </div>
      <RewardsSection perks={perks} onRewardsChange={onRewardsChange} />
    </div>
  );
}

function RewardsSection({ perks, onRewardsChange }) {
  const setPerks = (patch) => onRewardsChange({ ...perks, ...patch });
  return (
    <div className="grid gap-4 border-t border-product-border-subtle pt-4">
      <span className="block text-micro font-bold tracking-widest text-product-text-secondary uppercase">
        Points & rewards
      </span>
      <div className="grid grid-cols-2 gap-3">
        <PointsField
          key={perks.pointsSignup}
          label="Per signup"
          value={perks.pointsSignup}
          unit="pts"
          onCommit={(pointsSignup) => setPerks({ pointsSignup })}
        />
        <PointsField
          key={perks.pointsReferral}
          label="Per referral"
          value={perks.pointsReferral}
          unit="pts"
          onCommit={(pointsReferral) => setPerks({ pointsReferral })}
        />
        <PointsField
          key={perks.pointsFollow}
          label="Per follow"
          value={perks.pointsFollow}
          unit="pts"
          onCommit={(pointsFollow) => setPerks({ pointsFollow })}
        />
        <PointsField
          key={perks.positionOffset}
          label="Position boost"
          value={perks.positionOffset}
          max={1000000}
          onCommit={(positionOffset) => setPerks({ positionOffset })}
        />
      </div>
      <Toggle
        label="Show points balance"
        checked={perks.showPoints}
        onChange={(showPoints) => setPerks({ showPoints })}
      />
      <Toggle
        label="Show reward progress"
        checked={perks.showProgress}
        onChange={(showProgress) => setPerks({ showProgress })}
      />
      <Toggle
        label="Stealth Mode"
        hint="Hides positions, points, and headcounts on the public page. Best for private or B2B launches."
        checked={perks.hideCounts}
        onChange={(hideCounts) => setPerks({ hideCounts })}
      />
      <div className="grid gap-3.5 border-t border-product-border-subtle pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="block text-micro font-bold tracking-widest text-product-text-secondary uppercase">
            Custom events
          </span>
          {(perks.customEvents ?? []).length < 12 && (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                // Distinct keys: normalizeRewardsConfig keeps one entry per key,
                // so adding twice without renaming must not collide.
                const keys = new Set((perks.customEvents ?? []).map((entry) => entry.key));
                let key = "survey";
                for (let n = 2; keys.has(key); n += 1) key = `survey-${n}`;
                setPerks({
                  customEvents: [
                    ...(perks.customEvents ?? []),
                    {
                      key,
                      label: "Survey completed",
                      points: 20,
                      id: crypto.randomUUID(),
                    },
                  ],
                });
              }}
            >
              <HugeiconsIcon icon={Add01Icon} size={14} aria-hidden="true" />
              Add event
            </Button>
          )}
        </div>
        <p className="m-0 max-w-prose text-caption leading-relaxed text-product-text-secondary">
          Award points for off-site actions via the{" "}
          <Link
            className="inline-flex items-center gap-0.5 font-medium text-product-text-primary underline underline-offset-2"
            href="/docs/api/award-points"
            target="_blank"
            rel="noopener noreferrer"
          >
            Points API
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} aria-hidden="true" />
          </Link>
          .
        </p>
        {(perks.customEvents ?? []).map((entry, index) => (
          <div
            className="grid gap-3 [&+&]:border-t [&+&]:border-product-border-subtle [&+&]:pt-4"
            key={entry.id ?? `${entry.key}:${entry.label}:${entry.points}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-micro font-semibold text-product-text-secondary">
                Event {index + 1}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                aria-label={`Remove ${entry.label || `event ${index + 1}`}`}
                onClick={() =>
                  setPerks({
                    customEvents: perks.customEvents.filter((_, itemIndex) => itemIndex !== index),
                  })
                }
              >
                <HugeiconsIcon icon={Delete02Icon} size={15} aria-hidden="true" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Event key"
                value={entry.key}
                maxLength={40}
                onChange={(key) =>
                  setPerks({
                    customEvents: perks.customEvents.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, key } : item,
                    ),
                  })
                }
              />
              <PointsField
                key={entry.points}
                label="Points"
                value={entry.points}
                unit="pts"
                onCommit={(points) =>
                  setPerks({
                    customEvents: perks.customEvents.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, points } : item,
                    ),
                  })
                }
              />
            </div>
            <Field
              label="Label"
              value={entry.label}
              maxLength={80}
              onChange={(label) =>
                setPerks({
                  customEvents: perks.customEvents.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, label } : item,
                  ),
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
