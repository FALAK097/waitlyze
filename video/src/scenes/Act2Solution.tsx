import React from "react";
import { interpolate } from "remotion";

import {
  AnimatedNumber,
  AvatarDisc,
  RealCaptureFrame,
  ShieldIcon,
  StageCursor,
  StatusPill,
  StudioBackdrop,
  WaitlyzeWordmark,
} from "../components/Primitives";
import { arrivalEasing, easeKeyframes, easeRange, travelEasing } from "../motion/easing";
import { WL } from "../theme";

/**
 * Scene 04 — Meet Waitlyze (Clean, confident Ferndesk-style brand reveal)
 * VO (30.27..33.94s, dur 3.67s): "Meet Waitlyze."
 */
export const Scene04MeetWaitlyze: React.FC<{ localSec: number; fps: number }> = ({
  localSec,
  fps,
}) => {
  const f = localSec * fps;

  const b1 = easeRange(f, 12, 34, 0, 1, arrivalEasing);
  const b2 = easeRange(f, 16, 38, 0, 1, arrivalEasing);
  const b3 = easeRange(f, 20, 42, 0, 1, arrivalEasing);

  const wordIn = easeRange(f, 28, 56, 0, 1, travelEasing);
  const dotIn = easeRange(f, 46, 68, 0, 1, arrivalEasing);
  const subIn = easeRange(f, 70, 100, 0, 1, travelEasing);

  return (
    <StudioBackdrop tone="clean">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <WaitlyzeWordmark
          size={104}
          barProgress={[b1, b2, b3]}
          wordOpacity={wordIn}
          dotScale={dotIn}
        />
        <div
          style={{
            fontFamily: WL.fontSans,
            fontSize: 24,
            fontWeight: 500,
            color: WL.textSecondary,
            letterSpacing: "-0.01em",
            opacity: subIn,
            transform: `translate3d(0, ${(1 - subIn) * 10}px, 0)`,
          }}
        >
          Waitlist software for everything before launch day.
        </div>
      </div>
    </StudioBackdrop>
  );
};

/**
 * Scene 05 — Real Waitlyze Hosted Page -> Verified Confirmation & Referral Loop
 * Uses REAL 3200x1920 Waitlyze captures:
 *  - 08_public_page_hero.png (hosted signup page)
 *  - 05_builder_after_signup.png (post-signup position, points & referral screen)
 *  - 09_public_page_rewards.png (milestone perks & referral tiers)
 * VO (33.94..46.16s, dur 12.22s):
 * - 0.53s: "When someone joins your waitlist,"
 * - 2.64s: "Waitlyze verifies their email,"
 * - 4.32s: "locks in their live queue spot,"
 * - 6.97s: "and hands them a personal referral link"
 * - 8.86s: "so every real signup brings the next three."
 */
export const Scene05ReferralLoop: React.FC<{ localSec: number; fps: number }> = ({
  localSec,
  fps,
}) => {
  const f = localSec * fps;

  const winIn = easeRange(f, 0, 24, 0, 1, arrivalEasing);

  // Beat 1 (0..3.6s): Real hosted page 08_public_page_hero.png — cursor clicks "Claim early access"
  // In 08_public_page_hero.png (3200x1920): "Claim early access" button is at ~85% X, ~23.5% Y
  const claimPress = easeKeyframes(f, [118, 124, 132], [0, 1, 0], travelEasing);
  const verifiedPill = easeRange(f, 148, 174, 0, 1, arrivalEasing); // 2.46s "verifies their email"

  // Beat 2 (3.7..8.8s): Smooth crossfade to real 05_builder_after_signup.png (zoomed cleanly onto confirmation card)
  const afterSignupPhase = easeRange(f, 224, 254, 0, 1, travelEasing);

  // Beat 3 (8.5..12.2s): Three verified friends join via Elena's referral link -> real rewards tiers
  const ref1 = easeRange(f, 510, 536, 0, 1, arrivalEasing);
  const ref2 = easeRange(f, 546, 572, 0, 1, arrivalEasing);
  const ref3 = easeRange(f, 582, 608, 0, 1, arrivalEasing);

  // Window glides slightly left when satellites enter so satellites straddle the right edge cleanly
  const winShift = easeRange(f, 490, 524, 0, 1, travelEasing);
  const winLeft = 280 - winShift * 140; // 280 centered (1360w) -> 140 left when satellites appear

  // Gentle editorial zoom on real captures
  const heroScale = interpolate(f, [0, 224], [1.0, 1.045], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Zoom nicely into the right-side confirmation preview of 05_builder_after_signup.png
  const confirmScale = interpolate(f, [224, 520], [1.18, 1.24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor aiming onto the REAL "Claim early access" button on 08_public_page_hero.png
  // Frame is left: 280, top: 130, width: 1360, height: 816 -> button at 85.5% of 1360 + 280 = 1442, 23.5% of 816 + 130 = 322
  const cursorX = easeKeyframes(
    f,
    [16, 72, 118, 195],
    [1080, 1260, 1472, 1472],
    travelEasing,
  );
  const cursorY = easeKeyframes(
    f,
    [16, 72, 118, 195],
    [410, 345, 324, 324],
    travelEasing,
  );
  const cursorOpacity =
    easeRange(f, 16, 30, 0, 1) * (1 - easeRange(f, 195, 222, 0, 1));

  const friends = [
    { name: "Lena Park", sub: "Verified via Elena's link", initials: "LP", color: "#196640", p: ref1 },
    { name: "Devon Brooks", sub: "Verified via Elena's link", initials: "DB", color: "#0F4C5C", p: ref2 },
    { name: "Sora Tanaka", sub: "Verified via Elena's link", initials: "ST", color: "#334155", p: ref3 },
  ];

  return (
    <StudioBackdrop tone="clean">
      <div
        style={{
          position: "absolute",
          left: winLeft,
          top: 130,
          opacity: winIn,
          transform: `translate3d(0, ${(1 - winIn) * 26}px, 0)`,
        }}
      >
        <div
          style={{
            width: 1360,
            height: 816,
            borderRadius: WL.radiusWindow,
            border: `1px solid ${WL.border}`,
            backgroundColor: WL.white,
            boxShadow: WL.shadowHero,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Real Capture A: Hosted Public Waitlist Page */}
          {afterSignupPhase < 0.99 && (
            <div style={{ position: "absolute", inset: 0, opacity: 1 - afterSignupPhase }}>
              <RealCaptureFrame
                src="08_public_page_hero.png"
                width={1360}
                height={816}
                scale={heroScale}
                originX="70%"
                originY="22%"
                shadow="none"
                style={{ border: "none", borderRadius: 0 }}
              />
            </div>
          )}

          {/* Real Capture B: Post-Signup Confirmation & Live Queue Position */}
          {afterSignupPhase > 0.01 && (
            <div style={{ position: "absolute", inset: 0, opacity: afterSignupPhase }}>
              <RealCaptureFrame
                src="05_builder_after_signup.png"
                width={1360}
                height={816}
                scale={confirmScale}
                originX="64%"
                originY="56%"
                shadow="none"
                style={{ border: "none", borderRadius: 0 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Double Opt-in Verified Satellite Pill (appears right on "verifies their email") */}
      {verifiedPill > 0.01 && afterSignupPhase < 0.85 && (
        <div
          style={{
            position: "absolute",
            right: 170,
            top: 96,
            opacity: verifiedPill * (1 - afterSignupPhase),
            transform: `translate3d(0, ${(1 - verifiedPill) * -16}px, 0)`,
            padding: "14px 22px",
            borderRadius: 14,
            backgroundColor: WL.white,
            border: `1px solid rgba(25, 102, 64, 0.25)`,
            boxShadow: WL.shadowSatellite,
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 35,
          }}
        >
          <StatusPill label="Double opt-in verified" variant="verified" />
          <span style={{ fontFamily: WL.fontMono, fontSize: 14, color: WL.ink, fontWeight: 600 }}>
            elena@linear.app
          </span>
        </div>
      )}

      {/* Referral Loop Satellites straddling the right edge as friends join */}
      <div
        style={{
          position: "absolute",
          right: 110,
          top: 300,
          width: 440,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          zIndex: 30,
        }}
      >
        {friends.map((fr) => (
          <div
            key={fr.name}
            style={{
              opacity: fr.p,
              transform: `translate3d(${(1 - fr.p) * 32}px, 0, 0)`,
              padding: "16px 20px",
              borderRadius: 16,
              backgroundColor: WL.white,
              border: `1px solid ${WL.border}`,
              boxShadow: WL.shadowSatellite,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <AvatarDisc initials={fr.initials} color={fr.color} size={40} />
              <div>
                <div
                  style={{
                    fontFamily: WL.fontDisplay,
                    fontSize: 16.5,
                    fontWeight: 700,
                    color: WL.ink,
                  }}
                >
                  {fr.name}
                </div>
                <div style={{ fontFamily: WL.fontSans, fontSize: 13.5, color: WL.textMuted }}>
                  {fr.sub}
                </div>
              </div>
            </div>
            <StatusPill label="+5 spots" variant="verified" dot={false} />
          </div>
        ))}
      </div>

      <StageCursor x={cursorX} y={cursorY} pressing={claimPress} opacity={cursorOpacity} />
    </StudioBackdrop>
  );
};

/**
 * Scene 06 — Real Waitlyze Subscribers CRM + Browser-Fingerprint Fraud Review Drawer
 * Uses REAL 3200x1920 Waitlyze captures:
 *  - 10_subscribers_crm.png (real subscriber CRM with verified & needs-confirm rows)
 *  - 11_subscribers_fraud_review.png (real Referral Review drawer with same-browser flag)
 * VO (46.16..57.15s, dur 10.99s):
 * - 0.45s: "Bots stop at Cloudflare Turnstile."
 * - 3.05s: "Duplicate browser fingerprints get held for review before any referral credit is granted."
 * - 8.43s: "Only real people move up."
 */
export const Scene06FraudReview: React.FC<{ localSec: number; fps: number }> = ({
  localSec,
  fps,
}) => {
  const f = localSec * fps;

  const winIn = easeRange(f, 0, 24, 0, 1, arrivalEasing);
  const turnstileBar = easeRange(f, 20, 44, 0, 1, arrivalEasing);
  const botsBlocked = Math.round(
    interpolate(f, [24, 128], [142, 187], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  // Switch from real 10_subscribers_crm.png -> real 11_subscribers_fraud_review.png at 3.0s (f=180)
  const reviewPhase = easeRange(f, 180, 210, 0, 1, travelEasing);

  // Gentle focus push-in toward the right-hand Referral Review drawer (keep top heading whole)
  const reviewZoom = interpolate(f, [210, 450], [1.0, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor moves cleanly to the right side of the REAL "Exclude" button on 11_subscribers_fraud_review.png
  const excludePress = easeKeyframes(f, [422, 428, 436], [0, 1, 0], travelEasing);
  const excludedBadge = easeRange(f, 434, 462, 0, 1, arrivalEasing);

  const cursorX = easeKeyframes(
    f,
    [230, 355, 422, 510],
    [1190, 1310, 1422, 1468],
    travelEasing,
  );
  const cursorY = easeKeyframes(
    f,
    [230, 355, 422, 510],
    [510, 590, 650, 705],
    travelEasing,
  );
  const cursorOpacity =
    easeRange(f, 232, 248, 0, 1) * (1 - easeRange(f, 495, 520, 0, 1));

  return (
    <StudioBackdrop tone="clean">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          opacity: winIn,
          transform: `translate3d(0, ${(1 - winIn) * 24}px, 0)`,
        }}
      >
        {/* Top Turnstile Protection Bar */}
        <div
          style={{
            width: 1340,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 24px",
            borderRadius: WL.radiusCard,
            backgroundColor: WL.white,
            border: `1px solid ${WL.border}`,
            boxShadow: WL.shadowCard,
            opacity: turnstileBar,
            transform: `translate3d(0, ${(1 - turnstileBar) * 10}px, 0)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                backgroundColor: WL.forestSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldIcon size={19} color={WL.forest} />
            </div>
            <span
              style={{
                fontFamily: WL.fontDisplay,
                fontSize: 17.5,
                fontWeight: 700,
                color: WL.ink,
              }}
            >
              Cloudflare Turnstile &amp; Browser-Fingerprint Guard
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                fontFamily: WL.fontMono,
                fontSize: 14.5,
                fontWeight: 700,
                color: WL.forest,
              }}
            >
              <AnimatedNumber value={botsBlocked} suffix=" bots blocked" />
            </span>
            <StatusPill
              label={excludedBadge > 0.4 ? "Self-referral excluded" : "Protected"}
              variant="verified"
            />
          </div>
        </div>

        {/* Real Waitlyze Subscribers CRM -> Real Referral Review Drawer */}
        <div
          style={{
            width: 1340,
            height: 760,
            borderRadius: WL.radiusWindow,
            border: `1px solid ${WL.border}`,
            backgroundColor: WL.white,
            boxShadow: WL.shadowHero,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {reviewPhase < 0.99 && (
            <div style={{ position: "absolute", inset: 0, opacity: 1 - reviewPhase }}>
              <RealCaptureFrame
                src="10_subscribers_crm.png"
                width={1340}
                height={760}
                scale={1.03}
                originX="50%"
                originY="14%"
                shadow="none"
                style={{ border: "none", borderRadius: 0 }}
              />
            </div>
          )}

          {reviewPhase > 0.01 && (
            <div style={{ position: "absolute", inset: 0, opacity: reviewPhase }}>
              <RealCaptureFrame
                src="11_subscribers_fraud_review.png"
                width={1340}
                height={760}
                scale={reviewZoom}
                originX="92%"
                originY="0%"
                shadow="none"
                style={{ border: "none", borderRadius: 0 }}
              />
            </div>
          )}

          {/* Crisp confirmation pill after Exclude is clicked */}
          {excludedBadge > 0.01 && (
            <div
              style={{
                position: "absolute",
                left: 36,
                bottom: 32,
                opacity: excludedBadge,
                transform: `translate3d(0, ${(1 - excludedBadge) * 14}px, 0)`,
                padding: "14px 20px",
                borderRadius: 12,
                backgroundColor: WL.white,
                border: "1px solid rgba(25, 102, 64, 0.24)",
                boxShadow: WL.shadowSatellite,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <StatusPill label="Credit blocked" variant="danger" />
              <span
                style={{
                  fontFamily: WL.fontSans,
                  fontSize: 15,
                  fontWeight: 600,
                  color: WL.ink,
                }}
              >
                Flagged referral excluded — verified queue unchanged
              </span>
            </div>
          )}
        </div>
      </div>

      <StageCursor x={cursorX} y={cursorY} pressing={excludePress} opacity={cursorOpacity} />
    </StudioBackdrop>
  );
};
