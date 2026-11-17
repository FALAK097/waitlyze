import React from "react";
import { useCurrentFrame } from "remotion";

import { DigitRoll, animatedNumber } from "../motion/DigitRoll";
import { arrivalEasing, easeRange, travelEasing } from "../motion/easing";

interface SubscriberRow {
  id: string;
  email: string;
  name: string;
  source: string;
  referrals: number;
  points: number;
  rankBefore: number;
  rankAfter: number;
  verified: boolean;
  timeAgo: string;
  avatarColor: string;
}

const SUBSCRIBERS: SubscriberRow[] = [
  {
    id: "elena",
    email: "elena@linear.app",
    name: "Elena Rostova",
    source: "X / Twitter",
    referrals: 5,
    points: 250,
    rankBefore: 412,
    rankAfter: 1,
    verified: true,
    timeAgo: "Just now",
    avatarColor: "#10B981",
  },
  {
    id: "marcus",
    email: "marcus@raycast.com",
    name: "Marcus Vance",
    source: "Product Hunt",
    referrals: 4,
    points: 200,
    rankBefore: 2,
    rankAfter: 2,
    verified: true,
    timeAgo: "2m ago",
    avatarColor: "#0EA5E9",
  },
  {
    id: "priya",
    email: "priya@vercel.com",
    name: "Priya Nair",
    source: "Referral · @elena",
    referrals: 3,
    points: 150,
    rankBefore: 3,
    rankAfter: 3,
    verified: true,
    timeAgo: "4m ago",
    avatarColor: "#8B5CF6",
  },
  {
    id: "jonas",
    email: "jonas@supabase.io",
    name: "Jonas Lindqvist",
    source: "Direct",
    referrals: 2,
    points: 100,
    rankBefore: 4,
    rankAfter: 4,
    verified: true,
    timeAgo: "9m ago",
    avatarColor: "#F59E0B",
  },
  {
    id: "claire",
    email: "claire@stripe.com",
    name: "Claire Moreau",
    source: "X / Twitter",
    referrals: 1,
    points: 50,
    rankBefore: 5,
    rankAfter: 5,
    verified: true,
    timeAgo: "14m ago",
    avatarColor: "#EC4899",
  },
];

/**
 * Chapters 05 & 06 (frames 1569..2430):
 * - 05 SIGNUPS (frames 1569..1934): Verified subscriber CRM rows stagger in, Turnstile shields lock, total counter rolls 0 -> 1,230.
 * - 06 REFERRALS (frames 1934..2430): Referral Cockpit & Leaderboard FLIP reorder.
 *   Elena (`elena@linear.app`) starts at row index 3 (#412), gains +150 referral points,
 *   her rank rolls #412 -> #14 -> #1, and her row physically lifts and glides to the top while rows 0..2 shift down!
 */
export const SignupsReferralSurface: React.FC = () => {
  const frame = useCurrentFrame();

  const totalSignups = animatedNumber(frame, 1600, 1860, 148, 1230);
  const referredCount = animatedNumber(frame, 1950, 2260, 310, 542);
  const kFactor = animatedNumber(frame, 1980, 2320, 1.12, 1.84);

  // FLIP reorder animation for Elena (frames 2090..2230)
  // Before frame 2090: order is [marcus, priya, jonas, elena, claire]
  // After frame 2230: order is [elena, marcus, priya, jonas, claire]
  const flipProgress = easeRange(frame, 2090, 2195, 0, 1, travelEasing);
  const elenaLift = frame >= 2090 && frame <= 2195 ? Math.sin(((frame - 2090) / 105) * Math.PI) : 0;

  const elenaReferrals = Math.round(easeRange(frame, 2020, 2140, 1, 5, arrivalEasing));
  const elenaPoints = Math.round(easeRange(frame, 2020, 2140, 50, 250, arrivalEasing));
  const elena = SUBSCRIBERS.find((sub) => sub.id === "elena")!;
  const elenaRank = Math.round(
    frame < 2190
      ? easeRange(frame, 2040, 2190, elena.rankBefore, 14, arrivalEasing)
      : easeRange(frame, 2190, 2230, 14, elena.rankAfter, arrivalEasing),
  );

  const rowHeight = 64;

  // Base visual slots before FLIP: marcus(0), priya(1), jonas(2), elena(3), claire(4)
  const initialOrder = ["marcus", "priya", "jonas", "elena", "claire"];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 470px",
        gap: 22,
        height: "100%",
      }}
    >
      {/* Left: Verified Subscriber CRM & Live Queue */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E7EA",
          borderRadius: 12,
          padding: "18px 22px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 14,
            borderBottom: "1px solid #EEF0F2",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#00160A",
                }}
              >
                Verified subscribers
              </span>
              <span
                style={{
                  padding: "3px 9px",
                  borderRadius: 999,
                  backgroundColor: "#EAF8F0",
                  color: "#196642",
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                <DigitRoll value={totalSignups} fontSize={12} color="#196642" fontWeight={700} />
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "#687076", marginTop: 2 }}>
              Cloudflare Turnstile & velocity protection active · 0 bots admitted
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                padding: "6px 11px",
                borderRadius: 8,
                border: "1px solid #E4E7EA",
                fontSize: 12,
                fontWeight: 600,
                color: "#2C3237",
              }}
            >
              Filter: Verified ✓
            </span>
            <span
              style={{
                padding: "6px 11px",
                borderRadius: 8,
                backgroundColor: "#F6F8F9",
                border: "1px solid #E4E7EA",
                fontSize: 12,
                fontWeight: 600,
                color: "#2C3237",
              }}
            >
              Export CSV
            </span>
          </div>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.1fr 1.2fr 0.9fr 0.8fr",
            padding: "10px 12px",
            fontSize: 11,
            fontFamily: "'Paper Mono', monospace",
            fontWeight: 600,
            color: "#687076",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            borderBottom: "1px solid #F1F3F5",
          }}
        >
          <span>Subscriber</span>
          <span>Source</span>
          <span>Referrals</span>
          <span style={{ textAlign: "right" }}>Queue Position</span>
        </div>

        {/* FLIP Animated Rows Container */}
        <div
          style={{
            position: "relative",
            flex: 1,
            marginTop: 6,
          }}
        >
          {initialOrder.map((id, initialIdx) => {
            const sub = SUBSCRIBERS.find((s) => s.id === id)!;
            const staggerEnter = easeRange(
              frame,
              1585 + initialIdx * 16,
              1635 + initialIdx * 16,
              0,
              1,
              arrivalEasing,
            );

            // Compute FLIP target slot
            let targetIdx = initialIdx;
            if (id === "elena") {
              targetIdx = 3 - 3 * flipProgress; // moves from slot 3 -> slot 0
            } else if (initialIdx < 3) {
              targetIdx = initialIdx + flipProgress; // slots 0,1,2 shift down by 1
            }

            const y = targetIdx * rowHeight + (1 - staggerEnter) * 18;
            const isElena = id === "elena";
            const isHighlighted = isElena && frame >= 2010;

            return (
              <div
                key={sub.id}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: rowHeight - 6,
                  transform: `translate3d(0, ${y.toFixed(2)}px, 0) scale(${(1 + elenaLift * (isElena ? 0.025 : 0)).toFixed(4)})`,
                  zIndex: isElena ? 10 : 1,
                  opacity: staggerEnter,
                  display: "grid",
                  gridTemplateColumns: "2.1fr 1.2fr 0.9fr 0.8fr",
                  alignItems: "center",
                  padding: "0 12px",
                  borderRadius: 10,
                  backgroundColor: isHighlighted ? "#F6FEE7" : "#FFFFFF",
                  border: isHighlighted ? "1.5px solid #9EE01A" : "1px solid #F1F3F5",
                  boxShadow:
                    isElena && elenaLift > 0.05
                      ? `0 14px 28px rgba(0, 22, 10, ${(0.14 * elenaLift).toFixed(3)})`
                      : "none",
                }}
              >
                {/* Subscriber Avatar + Email */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      backgroundColor: sub.avatarColor,
                      color: "#FFFFFF",
                      fontSize: 12.5,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {sub.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: "#00160A",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>{sub.email}</span>
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: "1px 6px",
                          borderRadius: 4,
                          backgroundColor: "#EAF8F0",
                          color: "#196642",
                          fontFamily: "'Paper Mono', monospace",
                          fontWeight: 600,
                        }}
                      >
                        ✓
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#687076" }}>
                      {sub.name} · {sub.timeAgo}
                    </div>
                  </div>
                </div>

                {/* Source */}
                <div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 9px",
                      borderRadius: 6,
                      backgroundColor: "#F6F8F9",
                      border: "1px solid #E4E7EA",
                      color: "#2C3237",
                    }}
                  >
                    {sub.source}
                  </span>
                </div>

                {/* Referrals & Points */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontFamily: "'Paper Mono', monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#00160A",
                    }}
                  >
                    {isElena ? elenaReferrals : sub.referrals} refs
                  </span>
                  <span
                    style={{
                      fontFamily: "'Paper Mono', monospace",
                      fontSize: 11,
                      padding: "2px 6px",
                      borderRadius: 999,
                      backgroundColor: isHighlighted ? "#BAFE2A" : "#F2F4F5",
                      color: "#00160A",
                      fontWeight: 700,
                    }}
                  >
                    +{isElena ? elenaPoints : sub.points}pt
                  </span>
                </div>

                {/* Queue Position */}
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontFamily: "'Paper Mono', monospace",
                      fontSize: 13.5,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 8,
                      backgroundColor: isHighlighted ? "#00160A" : "#F6F8F9",
                      color: isHighlighted ? "#BAFE2A" : "#00160A",
                    }}
                  >
                    #{isElena ? elenaRank : frame >= 2230 ? sub.rankAfter : sub.rankBefore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Referral Campaign Cockpit */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E7EA",
          borderRadius: 12,
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 12,
            borderBottom: "1px solid #EEF0F2",
          }}
        >
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: "#00160A" }}>
              Referral cockpit
            </div>
            <div style={{ fontSize: 12, color: "#687076", marginTop: 2 }}>
              Point ledger, rewards & automated queue jumps
            </div>
          </div>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              backgroundColor: "#BAFE2A",
              color: "#00160A",
              fontFamily: "'Paper Mono', monospace",
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            ACTIVE LOOP
          </span>
        </div>

        {/* Viral KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              backgroundColor: "#F8FAFB",
              border: "1px solid #EAECEF",
            }}
          >
            <div style={{ fontSize: 11.5, color: "#687076", fontWeight: 600 }}>
              Referred signups
            </div>
            <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 8 }}>
              <DigitRoll value={referredCount} fontSize={24} fontWeight={800} />
              <span
                style={{
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 11.5,
                  color: "#196642",
                  fontWeight: 700,
                }}
              >
                44.1%
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              backgroundColor: "#F8FAFB",
              border: "1px solid #EAECEF",
            }}
          >
            <div style={{ fontSize: 11.5, color: "#687076", fontWeight: 600 }}>Viral K-factor</div>
            <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 6 }}>
              <DigitRoll value={kFactor} decimals={2} suffix="x" fontSize={24} fontWeight={800} />
              <span
                style={{
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 11,
                  color: "#196642",
                  fontWeight: 700,
                }}
              >
                +0.42
              </span>
            </div>
          </div>
        </div>

        {/* Reward Milestones */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#2C3237",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Milestone tiers</span>
            <span
              style={{
                fontFamily: "'Paper Mono', monospace",
                fontSize: 11,
                color: "#687076",
              }}
            >
              50 PTS / VERIFIED REFERRAL
            </span>
          </div>

          {[
            {
              refs: "3 referrals",
              pts: "150 pts",
              reward: "Friday Priority Access + +400 spot jump",
              unlocked: "184 unlocked",
              active: frame >= 2000,
            },
            {
              refs: "5 referrals",
              pts: "250 pts",
              reward: "Founding Member Pass (50% lifetime)",
              unlocked: "62 unlocked",
              active: frame >= 2130,
            },
            {
              refs: "10 referrals",
              pts: "500 pts",
              reward: "Weekend Cabin Drop #01 Complimentary Stay",
              unlocked: "14 unlocked",
              active: false,
            },
          ].map((tier, idx) => (
            <div
              key={idx}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                backgroundColor: tier.active ? "#F6FEE7" : "#FFFFFF",
                border: tier.active ? "1.5px solid #9EE01A" : "1px solid #E4E7EA",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: "'Paper Mono', monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 6,
                      backgroundColor: tier.active ? "#BAFE2A" : "#F2F4F5",
                      color: "#00160A",
                    }}
                  >
                    {tier.refs} · {tier.pts}
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "#00160A",
                    }}
                  >
                    {tier.reward}
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 11,
                  color: "#196642",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {tier.unlocked}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
