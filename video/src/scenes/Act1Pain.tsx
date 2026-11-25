import React from "react";
import { AbsoluteFill, interpolate } from "remotion";

import {
  AlertIcon,
  AnimatedNumber,
  BrowserWindow,
  HashIcon,
  MailIcon,
  NotificationCard,
  StatusPill,
  StudioBackdrop,
} from "../components/Primitives";
import { arrivalEasing, easeRange, travelEasing } from "../motion/easing";
import { WL } from "../theme";

/**
 * Scene 01 — Cold Open: Launch Day Silence -> Rewind
 * VO (0..5.06s): "Why did your launch day open to silence? Let's rewind."
 * Zero Waitlyze branding — purely the founder's launch-day pain.
 */
export const Scene01HookLaunch: React.FC<{ localSec: number; fps: number }> = ({
  localSec,
  fps,
}) => {
  const f = localSec * fps;

  // "Let's rewind" starts at 2.69s (f=161)
  const rewindStart = 158;
  const rewindProgress = easeRange(f, rewindStart, rewindStart + 16, 0, 1, travelEasing);

  // Staggered notification arrivals (tightly paced before 2.69s rewind)
  const n1 = easeRange(f, 8, 28, 0, 1, arrivalEasing);
  const n2 = easeRange(f, 38, 58, 0, 1, arrivalEasing);
  const n3 = easeRange(f, 68, 88, 0, 1, arrivalEasing);
  const n4 = easeRange(f, 96, 116, 0, 1, arrivalEasing);

  // Badge summary pill
  const dockFade = easeRange(f, 54, 78, 0, 1, travelEasing);

  const rewindTextIn = easeRange(f, rewindStart + 8, rewindStart + 26, 0, 1, arrivalEasing);

  return (
    <StudioBackdrop tone="warm">
      {/* Subtle macOS top menu bar for authentic desktop context */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 36,
          padding: "0 24px",
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          borderBottom: `1px solid ${WL.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: WL.fontSans,
          fontSize: 13.5,
          fontWeight: 600,
          color: WL.textSecondary,
          opacity: 1 - rewindProgress,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ color: WL.ink, fontWeight: 700 }}>Launch Day</span>
          <span style={{ color: WL.textMuted }}>Mail</span>
          <span style={{ color: WL.textMuted }}>Slack</span>
          <span style={{ color: WL.textMuted }}>Stripe</span>
        </div>
        <div style={{ fontFamily: WL.fontMono, fontSize: 12.5, color: WL.textMuted }}>
          Tue Oct 14 · 9:04 AM
        </div>
      </div>

      {/* Cascading founder dread notifications */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - rewindProgress,
          transform: `scale(${(1 - rewindProgress * 0.04).toFixed(4)})`,
        }}
      >
        {/* Hero notification #1 — centered upper focus */}
        <div
          style={{
            position: "absolute",
            left: 710,
            top: 170,
            opacity: n1,
            transform: `translate3d(0, ${(1 - n1) * -28}px, 0)`,
          }}
        >
          <NotificationCard
            width={500}
            app="Stripe"
            appBadgeBg="#1F2937"
            appGlyph={<AlertIcon size={20} color="#FFFFFF" />}
            title="Launch day revenue · $0.00"
            body="0 upgrades after sending to 412 waitlist contacts."
            time="just now"
          />
        </div>

        {/* Notification #2 — Left */}
        <div
          style={{
            position: "absolute",
            left: 240,
            top: 345,
            opacity: n2,
            transform: `translate3d(${(1 - n2) * -24}px, ${(1 - n2) * 14}px, 0)`,
          }}
        >
          <NotificationCard
            width={460}
            app="Email Delivery"
            appBadgeBg={WL.danger}
            appGlyph={<MailIcon size={19} color="#FFFFFF" />}
            title="34% hard bounce rate"
            body="187 addresses rejected — sender reputation throttled."
            time="1m ago"
            accentBorder="rgba(153, 25, 46, 0.25)"
          />
        </div>

        {/* Notification #3 — Right */}
        <div
          style={{
            position: "absolute",
            left: 1180,
            top: 355,
            opacity: n3,
            transform: `translate3d(${(1 - n3) * 24}px, ${(1 - n3) * 14}px, 0)`,
          }}
        >
          <NotificationCard
            width={470}
            app="Slack · #launch"
            appBadgeBg="#2B2D31"
            appGlyph={<HashIcon size={19} color="#FFFFFF" />}
            title="Elena Diaz"
            body="Wait — half of these waitlist signups are burner bots?"
            time="2m ago"
          />
        </div>

        {/* Notification #4 — Lower center */}
        <div
          style={{
            position: "absolute",
            left: 700,
            top: 530,
            opacity: n4,
            transform: `translate3d(0, ${(1 - n4) * 24}px, 0)`,
          }}
        >
          <NotificationCard
            width={520}
            app="Inbox"
            appBadgeBg="#4F5356"
            appGlyph={<MailIcon size={19} color="#FFFFFF" />}
            title="Re: Your early access invite is ready"
            body="Sorry, what is this? I forgot I even signed up last month."
            time="3m ago"
          />
        </div>

        {/* Bottom quiet summary pill — clears bottom live captions */}
        <div
          style={{
            position: "absolute",
            bottom: 112,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: dockFade,
            transform: `translate3d(0, ${(1 - dockFade) * 16}px, 0)`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 22px",
              borderRadius: WL.radiusPill,
              backgroundColor: WL.white,
              border: `1px solid ${WL.border}`,
              boxShadow: WL.shadowCard,
            }}
          >
            <StatusPill label="34% bounced" variant="danger" />
            <StatusPill label="187 unverified" variant="warning" />
            <StatusPill label="0 referrals" variant="neutral" />
          </div>
        </div>
      </div>

      {/* Crisp dark rewind slate on "Let's rewind." */}
      {rewindProgress > 0.01 && (
        <AbsoluteFill
          style={{
            backgroundColor: WL.stageDark,
            opacity: rewindProgress,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "10px 20px",
              borderRadius: WL.radiusPill,
              border: "1px solid rgba(255,255,255,0.14)",
              backgroundColor: "rgba(255,255,255,0.05)",
              opacity: rewindTextIn,
              transform: `translate3d(${(1 - rewindTextIn) * 18}px, 0, 0)`,
            }}
          >
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <path d="M10.5 2L2 8L10.5 14V2Z" fill={WL.lime} />
              <path d="M20 2L11.5 8L20 14V2Z" fill={WL.lime} />
            </svg>
            <span
              style={{
                fontFamily: WL.fontMono,
                fontSize: 16,
                fontWeight: 600,
                color: "rgba(255,255,255,0.88)",
                letterSpacing: "0.06em",
              }}
            >
              4 WEEKS EARLIER
            </span>
          </div>
        </AbsoluteFill>
      )}
    </StudioBackdrop>
  );
};

/**
 * Scene 02 — The Duct-Tape Stack & Generic Thanks Dead-End
 * VO (5.06..15.02s, dur 9.95s):
 * "Four weeks ago, you shipped a waitlist in an afternoon.
 *  A form widget (@4.03s), a spreadsheet (@5.15s), a Zapier hook (@6.54s),
 *  and a generic thanks screen (@8.00s)."
 */
export const Scene02RootCauseStack: React.FC<{ localSec: number; fps: number }> = ({
  localSec,
  fps,
}) => {
  const f = localSec * fps;

  const winIn = easeRange(f, 0, 26, 0, 1, arrivalEasing);

  // Pipeline chips synchronized to exact spoken timestamps
  const nForm = easeRange(f, 232, 254, 0, 1, arrivalEasing); // 3.86s
  const nSheet = easeRange(f, 300, 322, 0, 1, arrivalEasing); // 5.00s
  const nZap = easeRange(f, 382, 404, 0, 1, arrivalEasing); // 6.36s
  const nThanks = easeRange(f, 470, 496, 0, 1, arrivalEasing); // 7.83s

  const stackNodes = [
    { label: "Form Widget", tag: "No verify", p: nForm },
    { label: "waitlist.csv", tag: "Manual export", p: nSheet },
    { label: "Zapier Hook", tag: "Rate limited", p: nZap },
  ];

  return (
    <StudioBackdrop tone="warm">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
        }}
      >
        {/* Cropped browser window: bare waitlist form -> lifeless generic "thanks" screen */}
        <div
          style={{
            opacity: winIn,
            transform: `translate3d(0, ${(1 - winIn) * 26}px, 0)`,
          }}
        >
          <BrowserWindow url="northwind.app/waitlist" width={920} height={490}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: WL.white,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 80px",
              }}
            >
              {/* Initial bare form state (fades smoothly out when generic thanks arrives) */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 1 - nThanks,
                  transform: `translate3d(0, ${-nThanks * 14}px, 0)`,
                }}
              >
                <div
                  style={{
                    fontFamily: WL.fontMono,
                    fontSize: 12.5,
                    color: WL.textFaint,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 14,
                  }}
                >
                  COMING SOON
                </div>
                <div
                  style={{
                    fontFamily: WL.fontDisplay,
                    fontSize: 40,
                    fontWeight: 700,
                    color: WL.ink,
                    letterSpacing: "-0.035em",
                    marginBottom: 12,
                  }}
                >
                  Join our waitlist
                </div>
                <div
                  style={{
                    fontFamily: WL.fontSans,
                    fontSize: 18,
                    color: WL.textMuted,
                    marginBottom: 32,
                  }}
                >
                  Drop your email and we&apos;ll let you know when we launch.
                </div>

                <div style={{ display: "flex", gap: 12, width: 520 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 52,
                      borderRadius: WL.radiusControl,
                      border: `1px solid ${WL.borderControl}`,
                      backgroundColor: WL.subtleBg,
                      padding: "0 18px",
                      display: "flex",
                      alignItems: "center",
                      fontFamily: WL.fontSans,
                      fontSize: 16.5,
                      color: WL.textMuted,
                    }}
                  >
                    you@company.com
                  </div>
                  <div
                    style={{
                      height: 52,
                      padding: "0 26px",
                      borderRadius: WL.radiusControl,
                      backgroundColor: "#262A2C",
                      color: WL.white,
                      fontFamily: WL.fontSans,
                      fontSize: 16,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    Submit
                  </div>
                </div>
              </div>

              {/* Lifeless generic "Thanks" dead-end screen */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: nThanks,
                  transform: `translate3d(0, ${(1 - nThanks) * 18}px, 0)`,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    backgroundColor: WL.inset,
                    border: `1px solid ${WL.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    color: WL.textMuted,
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  ✓
                </div>
                <div
                  style={{
                    fontFamily: WL.fontDisplay,
                    fontSize: 36,
                    fontWeight: 700,
                    color: WL.ink,
                    letterSpacing: "-0.03em",
                    marginBottom: 10,
                  }}
                >
                  Thanks! We&apos;ll be in touch.
                </div>
                <div
                  style={{
                    fontFamily: WL.fontSans,
                    fontSize: 18,
                    color: WL.textMuted,
                    marginBottom: 30,
                  }}
                >
                  You can close this tab now.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <StatusPill label="No queue spot" variant="neutral" />
                  <StatusPill label="No referral link" variant="neutral" />
                  <StatusPill label="0 shares" variant="warning" />
                </div>
              </div>
            </div>
          </BrowserWindow>
        </div>

        {/* Duct-taped tool strip underneath */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            height: 82,
          }}
        >
          {stackNodes.map((node, i) => (
            <React.Fragment key={node.label}>
              <div
                style={{
                  opacity: node.p,
                  transform: `translate3d(0, ${(1 - node.p) * 18}px, 0)`,
                  padding: "14px 22px",
                  borderRadius: WL.radiusCard,
                  backgroundColor: WL.white,
                  border: `1px solid ${WL.border}`,
                  boxShadow: WL.shadowCard,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: WL.fontDisplay,
                    fontSize: 18,
                    fontWeight: 700,
                    color: WL.ink,
                  }}
                >
                  {node.label}
                </span>
                <StatusPill label={node.tag} variant="warning" dot={false} />
              </div>
              {i < stackNodes.length - 1 && (
                <div
                  style={{
                    width: 42,
                    borderTop: `2px dashed ${WL.borderControl}`,
                    opacity: stackNodes[i + 1].p,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </StudioBackdrop>
  );
};

/**
 * Scene 03 — Bots, Burner Self-Referrals, and the 412 / 187 / 0 Reckoning
 * VO (15.02..30.27s, dur 15.25s):
 * - 0.45s: "Bots found your form before customers did."
 * - 2.83s: "One person gamed your referral spots with burner emails."
 * - 6.45s: "Four hundred twelve signups."
 * - 8.19s: "One hundred eighty-seven fake."
 * - 10.23s: "Zero referrals."
 * - 11.72s: "And no idea which post actually worked."
 */
export const Scene03PainBots: React.FC<{ localSec: number; fps: number }> = ({
  localSec,
  fps,
}) => {
  const f = localSec * fps;

  const sheetIn = easeRange(f, 0, 22, 0, 1, arrivalEasing);
  // Switch cleanly from spreadsheet chaos -> crisp typographic reckoning at 6.15s (f=369)
  const reckonPhase = easeRange(f, 368, 392, 0, 1, travelEasing);

  const botRows = [
    {
      email: "bot_9481@xyz-mail.ru",
      source: "(unknown)",
      pos: "#4",
      status: "Unverified",
      kind: "bot",
      at: 26,
    },
    {
      email: "claim99@disposable.cc",
      source: "(unknown)",
      pos: "#5",
      status: "Bounced",
      kind: "bot",
      at: 50,
    },
    {
      email: "test123@asdf-temp.io",
      source: "(unknown)",
      pos: "#6",
      status: "Unverified",
      kind: "bot",
      at: 74,
    },
    {
      email: "alex+1@temp-mail.io",
      source: "?ref=alex",
      pos: "#1",
      status: "Same IP · Self-referral",
      kind: "burner",
      at: 170,
    },
    {
      email: "alex+2@temp-mail.io",
      source: "?ref=alex",
      pos: "#2",
      status: "Same IP · Self-referral",
      kind: "burner",
      at: 196,
    },
    {
      email: "alex+3@temp-mail.io",
      source: "?ref=alex",
      pos: "#3",
      status: "Same IP · Self-referral",
      kind: "burner",
      at: 222,
    },
  ];

  const burnerCallout = easeRange(f, 238, 262, 0, 1, arrivalEasing);

  // Reckoning card beats synced to exact VO word boundaries
  const stat1 = easeRange(f, 385, 412, 0, 1, arrivalEasing); // 6.42s "412 signups"
  const stat2 = easeRange(f, 490, 518, 0, 1, arrivalEasing); // 8.17s "187 fake"
  const stat3 = easeRange(f, 612, 640, 0, 1, arrivalEasing); // 10.20s "Zero referrals"
  const utmBar = easeRange(f, 702, 730, 0, 1, arrivalEasing); // 11.70s "And no idea..."

  const count412 = Math.round(interpolate(stat1, [0, 1], [120, 412]));
  const count187 = Math.round(interpolate(stat2, [0, 1], [0, 187]));

  return (
    <StudioBackdrop tone="warm">
      {/* Part A: The polluted CSV spreadsheet */}
      {reckonPhase < 0.99 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: sheetIn * (1 - reckonPhase),
            transform: `translate3d(0, ${(1 - sheetIn) * 24 - reckonPhase * 24}px, 0)`,
          }}
        >
          <BrowserWindow title="waitlist_export_final_v3.csv" width={1180} height={630}>
            <div style={{ padding: "24px 32px", backgroundColor: WL.white, height: "100%" }}>
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "84px 1.6fr 0.9fr 1.2fr",
                  padding: "12px 16px",
                  borderBottom: `1px solid ${WL.border}`,
                  fontFamily: WL.fontMono,
                  fontSize: 13,
                  fontWeight: 600,
                  color: WL.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <span>Spot</span>
                <span>Email</span>
                <span>Source</span>
                <span>Status</span>
              </div>

              {/* Rows streaming in */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {botRows.map((row) => {
                  const rowP = easeRange(f, row.at, row.at + 18, 0, 1, arrivalEasing);
                  const isBurner = row.kind === "burner";
                  return (
                    <div
                      key={row.email}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "84px 1.6fr 0.9fr 1.2fr",
                        alignItems: "center",
                        padding: "17px 16px",
                        borderBottom: `1px solid ${WL.border}`,
                        backgroundColor:
                          isBurner && burnerCallout > 0.1
                            ? `rgba(253, 236, 239, ${(burnerCallout * 0.7).toFixed(2)})`
                            : "transparent",
                        opacity: rowP,
                        transform: `translate3d(0, ${(1 - rowP) * 14}px, 0)`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: WL.fontMono,
                          fontSize: 16,
                          fontWeight: 700,
                          color: isBurner ? WL.danger : WL.textMuted,
                        }}
                      >
                        {row.pos}
                      </span>
                      <span
                        style={{
                          fontFamily: WL.fontMono,
                          fontSize: 17,
                          fontWeight: 600,
                          color: WL.ink,
                        }}
                      >
                        {row.email}
                      </span>
                      <span
                        style={{
                          fontFamily: WL.fontMono,
                          fontSize: 15.5,
                          color: WL.textMuted,
                        }}
                      >
                        {row.source}
                      </span>
                      <div>
                        <StatusPill
                          label={row.status}
                          variant={isBurner ? "danger" : "warning"}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clean crimson callout badge on burner cluster */}
              <div
                style={{
                  position: "absolute",
                  right: 36,
                  bottom: 28,
                  opacity: burnerCallout,
                  transform: `translate3d(0, ${(1 - burnerCallout) * 12}px, 0)`,
                  padding: "12px 18px",
                  borderRadius: WL.radiusControl,
                  backgroundColor: WL.dangerBg,
                  border: `1px solid rgba(153, 25, 46, 0.25)`,
                  fontFamily: WL.fontSans,
                  fontSize: 15,
                  fontWeight: 600,
                  color: WL.danger,
                }}
              >
                1 browser claimed #1, #2, and #3 with burner aliases
              </div>
            </div>
          </BrowserWindow>
        </div>
      )}

      {/* Part B: Clean typographic reckoning ("412 signups. 187 fake. 0 referrals.") */}
      {reckonPhase > 0.01 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: reckonPhase,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 36,
          }}
        >
          <div style={{ display: "flex", gap: 28 }}>
            {/* 412 signups */}
            <div
              style={{
                width: 380,
                padding: "42px 38px",
                borderRadius: WL.radiusWindow,
                backgroundColor: WL.white,
                border: `1px solid ${WL.border}`,
                boxShadow: WL.shadowCard,
                opacity: stat1,
                transform: `translate3d(0, ${(1 - stat1) * 24}px, 0)`,
              }}
            >
              <AnimatedNumber
                value={count412}
                style={{
                  fontFamily: WL.fontDisplay,
                  fontSize: 88,
                  fontWeight: 700,
                  color: WL.ink,
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                }}
              />
              <div
                style={{
                  marginTop: 14,
                  fontFamily: WL.fontSans,
                  fontSize: 22,
                  fontWeight: 600,
                  color: WL.textSecondary,
                }}
              >
                raw signups
              </div>
            </div>

            {/* 187 fake */}
            <div
              style={{
                width: 380,
                padding: "42px 38px",
                borderRadius: WL.radiusWindow,
                backgroundColor: WL.dangerBg,
                border: "1px solid rgba(153, 25, 46, 0.22)",
                boxShadow: WL.shadowCard,
                opacity: stat2,
                transform: `translate3d(0, ${(1 - stat2) * 24}px, 0)`,
              }}
            >
              <AnimatedNumber
                value={count187}
                style={{
                  fontFamily: WL.fontDisplay,
                  fontSize: 88,
                  fontWeight: 700,
                  color: WL.danger,
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                }}
              />
              <div
                style={{
                  marginTop: 14,
                  fontFamily: WL.fontSans,
                  fontSize: 22,
                  fontWeight: 600,
                  color: WL.danger,
                }}
              >
                fake or bounced
              </div>
            </div>

            {/* 0 referrals */}
            <div
              style={{
                width: 380,
                padding: "42px 38px",
                borderRadius: WL.radiusWindow,
                backgroundColor: WL.white,
                border: `1px solid ${WL.border}`,
                boxShadow: WL.shadowCard,
                opacity: stat3,
                transform: `translate3d(0, ${(1 - stat3) * 24}px, 0)`,
              }}
            >
              <div
                style={{
                  fontFamily: WL.fontDisplay,
                  fontSize: 88,
                  fontWeight: 700,
                  color: WL.textMuted,
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                }}
              >
                0
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontFamily: WL.fontSans,
                  fontSize: 22,
                  fontWeight: 600,
                  color: WL.textSecondary,
                }}
              >
                verified referrals
              </div>
            </div>
          </div>

          {/* Missing attribution bar */}
          <div
            style={{
              width: 1196,
              padding: "22px 32px",
              borderRadius: WL.radiusCard,
              backgroundColor: WL.white,
              border: `1px solid ${WL.border}`,
              boxShadow: WL.shadowCard,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: utmBar,
              transform: `translate3d(0, ${(1 - utmBar) * 18}px, 0)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span
                style={{
                  fontFamily: WL.fontMono,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: WL.textMuted,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                ACQUISITION SOURCE
              </span>
              <span
                style={{
                  fontFamily: WL.fontSans,
                  fontSize: 19,
                  fontWeight: 600,
                  color: WL.ink,
                }}
              >
                Direct / Unknown — 100%
              </span>
            </div>
            <StatusPill label="No channel attribution" variant="neutral" />
          </div>
        </div>
      )}
    </StudioBackdrop>
  );
};
