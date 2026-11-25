import React from "react";
import { interpolate } from "remotion";

import {
  FeatureSplitStage,
  LockIcon,
  NotificationCard,
  RealCaptureFrame,
  StatusPill,
  StudioBackdrop,
  WaitlyzeMark,
  WaitlyzeWordmark,
} from "../components/Primitives";
import { arrivalEasing, easeRange, travelEasing } from "../motion/easing";
import { WL } from "../theme";

/**
 * Scene 07 — Real Waitlyze Visual Builder -> Custom Domain & Publish Ready
 * Uses REAL 3200x1920 Waitlyze captures:
 *  - 02_builder_blocks.png (Blocks + Live Canvas + Properties)
 *  - 03_builder_design.png (Templates + Brand Kit Design Tokens)
 *  - 18_settings_domain.png (Custom Domain Ready: waitlist.weekend.club)
 *  - 06_builder_publish_share.png (Publish checklist, Hosted page, Website embed, API)
 * VO (57.15..68.62s, dur 11.47s):
 * - 0.45s: "No glue code, no stitched-together stack."
 * - 3.32s: "Pick a template, match your brand,"
 * - 5.52s: "and publish to your custom domain"
 * - 7.56s: "or drop one embed snippet into your site in minutes."
 */
export const Scene07LaunchInMinutes: React.FC<{ localSec: number; fps: number }> = ({
  localSec,
  fps,
}) => {
  const f = localSec * fps;

  const winIn = easeRange(f, 0, 24, 0, 1, arrivalEasing);

  // Beat A (0..3.1s): 02_builder_blocks.png -> Beat B (3.1..5.5s): 03_builder_design.png
  const designPhase = easeRange(f, 186, 212, 0, 1, travelEasing);

  // Beat C (5.5..8.2s): 18_settings_domain.png + clean domain hero callout pill
  const domainPhase = easeRange(f, 330, 356, 0, 1, travelEasing);
  const domainPill = easeRange(f, 350, 380, 0, 1, arrivalEasing);

  // Beat D (8.0..11.47s): 06_builder_publish_share.png (Website embed & Hosted page options)
  const publishPhase = easeRange(f, 476, 504, 0, 1, travelEasing);

  const builderScale = interpolate(f, [0, 330], [1.0, 1.035], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <StudioBackdrop tone="clean">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: winIn,
          transform: `translate3d(0, ${(1 - winIn) * 26}px, 0)`,
        }}
      >
        <div
          style={{
            width: 1380,
            height: 828,
            borderRadius: WL.radiusWindow,
            border: `1px solid ${WL.border}`,
            backgroundColor: WL.white,
            boxShadow: WL.shadowHero,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Real Capture 1: Visual Builder — Blocks */}
          {designPhase < 0.99 && (
            <div style={{ position: "absolute", inset: 0, opacity: 1 - designPhase }}>
              <RealCaptureFrame
                src="02_builder_blocks.png"
                width={1380}
                height={828}
                scale={builderScale}
                originX="50%"
                originY="22%"
                shadow="none"
                style={{ border: "none", borderRadius: 0 }}
              />
            </div>
          )}

          {/* Real Capture 2: Visual Builder — Templates & Brand Kit */}
          {designPhase > 0.01 && domainPhase < 0.99 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: designPhase * (1 - domainPhase),
              }}
            >
              <RealCaptureFrame
                src="03_builder_design.png"
                width={1380}
                height={828}
                scale={builderScale}
                originX="50%"
                originY="22%"
                shadow="none"
                style={{ border: "none", borderRadius: 0 }}
              />
            </div>
          )}

          {/* Real Capture 3: Custom Domain Ready */}
          {domainPhase > 0.01 && publishPhase < 0.99 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: domainPhase * (1 - publishPhase),
              }}
            >
              <RealCaptureFrame
                src="18_settings_domain.png"
                width={1380}
                height={828}
                scale={1.06}
                originX="36%"
                originY="22%"
                shadow="none"
                style={{ border: "none", borderRadius: 0 }}
              />
            </div>
          )}

          {/* Real Capture 4: Publish & Share (Hosted page, Website embed, API, Custom domain) */}
          {publishPhase > 0.01 && (
            <div style={{ position: "absolute", inset: 0, opacity: publishPhase }}>
              <RealCaptureFrame
                src="06_builder_publish_share.png"
                width={1380}
                height={828}
                scale={1.08}
                originX="34%"
                originY="22%"
                shadow="none"
                style={{ border: "none", borderRadius: 0 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Crisp Ferndesk-style Custom Domain Floating Pill during domain beat */}
      {domainPill > 0.01 && (
        <div
          style={{
            position: "absolute",
            right: 170,
            bottom: 110,
            opacity: domainPill,
            transform: `translate3d(0, ${(1 - domainPill) * 20}px, 0)`,
            padding: "18px 28px",
            borderRadius: 18,
            backgroundColor: WL.white,
            border: `1px solid ${WL.border}`,
            boxShadow: WL.shadowFloat,
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            zIndex: 30,
          }}
        >
          <LockIcon size={22} color={WL.forest} />
          <span
            style={{
              fontFamily: WL.fontDisplay,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: WL.ink,
            }}
          >
            waitlist.weekend.club
          </span>
          <StatusPill label="HTTPS Live" variant="verified" />
        </div>
      )}
    </StudioBackdrop>
  );
};

/**
 * Scene 08 — Real Waitlyze Attribution & Full-Funnel Analytics (Ferndesk Split Stage)
 * Uses REAL 3200x1920 Waitlyze captures:
 *  - 12_analytics_overview.png (KPI benchmarks + Activity bar chart)
 *  - 13_analytics_map_channels.png (Conversion funnel + Acquisition channels + Technology)
 * VO (68.62..76.29s, dur 7.68s)
 */
export const Scene08Analytics: React.FC<{ localSec: number; fps: number }> = ({
  localSec,
  fps,
}) => {
  const f = localSec * fps;

  // Smooth crossfade from Overview KPIs + Chart -> Funnel + Channels at 3.7s (f=222)
  const funnelPhase = easeRange(f, 222, 252, 0, 1, travelEasing);
  const zoom1 = interpolate(f, [0, 230], [1.0, 1.045], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoom2 = interpolate(f, [222, 460], [1.0, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <FeatureSplitStage
      localFrame={f}
      eyebrow="ATTRIBUTION & ANALYTICS"
      title="Know every channel that converts."
      subtitle="Verified conversion benchmarks, funnel drop-off, acquisition channels, and viral K-factor."
    >
      <div
        style={{
          width: 1040,
          height: 680,
          borderRadius: WL.radiusWindow,
          border: `1px solid ${WL.border}`,
          backgroundColor: WL.white,
          boxShadow: WL.shadowHero,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {funnelPhase < 0.99 && (
          <div style={{ position: "absolute", inset: 0, opacity: 1 - funnelPhase }}>
            <RealCaptureFrame
              src="12_analytics_overview.png"
              width={1040}
              height={680}
              scale={zoom1}
              originX="50%"
              originY="0%"
              shadow="none"
              style={{ border: "none", borderRadius: 0 }}
            />
          </div>
        )}
        {funnelPhase > 0.01 && (
          <div style={{ position: "absolute", inset: 0, opacity: funnelPhase }}>
            <RealCaptureFrame
              src="13_analytics_map_channels.png"
              width={1040}
              height={680}
              scale={zoom2}
              originX="50%"
              originY="20%"
              shadow="none"
              style={{ border: "none", borderRadius: 0 }}
            />
          </div>
        )}
      </div>
    </FeatureSplitStage>
  );
};

/**
 * Scene 09 — Real Waitlyze Email Automations & Cohort Broadcasts (Ferndesk Split Stage)
 * Uses REAL 3200x1920 Waitlyze captures:
 *  - 15_emails_automations.png (Welcome after confirmation, Referral reminder, Milestone)
 *  - 16_emails_broadcasts.png (Cohort broadcast composer & completed waves)
 * VO (76.29..83.39s, dur 7.10s)
 */
export const Scene09Broadcasts: React.FC<{ localSec: number; fps: number }> = ({
  localSec,
  fps,
}) => {
  const f = localSec * fps;

  // Crossfade from Automations -> Broadcasts right on "or invite your top supporters" (3.33s -> f=200)
  const broadcastPhase = easeRange(f, 198, 226, 0, 1, travelEasing);
  const zoom1 = interpolate(f, [0, 210], [1.0, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoom2 = interpolate(f, [198, 426], [1.0, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <FeatureSplitStage
      localFrame={f}
      eyebrow="EMAILS & COHORTS"
      title="Invite your best people in waves."
      subtitle="Automate welcome and milestone emails, or roll out verified cohorts from your own domain."
    >
      <div
        style={{
          width: 1040,
          height: 680,
          borderRadius: WL.radiusWindow,
          border: `1px solid ${WL.border}`,
          backgroundColor: WL.white,
          boxShadow: WL.shadowHero,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {broadcastPhase < 0.99 && (
          <div style={{ position: "absolute", inset: 0, opacity: 1 - broadcastPhase }}>
            <RealCaptureFrame
              src="15_emails_automations.png"
              width={1040}
              height={680}
              scale={zoom1}
              originX="48%"
              originY="0%"
              shadow="none"
              style={{ border: "none", borderRadius: 0 }}
            />
          </div>
        )}
        {broadcastPhase > 0.01 && (
          <div style={{ position: "absolute", inset: 0, opacity: broadcastPhase }}>
            <RealCaptureFrame
              src="16_emails_broadcasts.png"
              width={1040}
              height={680}
              scale={zoom2}
              originX="48%"
              originY="0%"
              shadow="none"
              style={{ border: "none", borderRadius: 0 }}
            />
          </div>
        )}
      </div>
    </FeatureSplitStage>
  );
};

/**
 * Scene 10 — Real Waitlyze Webhooks, Slack & Discord Alerts, and API Keys (Ferndesk Split Stage)
 * Uses REAL 3200x1920 Waitlyze captures:
 *  - 19_settings_webhooks.png (Signed webhooks endpoints)
 *  - 20_settings_notifications.png (Slack & Discord alerts)
 *  - 21_workspace_api_keys.png (Scoped server-side API keys)
 * VO (83.39..90.47s, dur 7.08s):
 * - 1.59s: "signed webhooks"
 * - 2.36s: "Slack and Discord alerts"
 * - 4.17s: "server-side Signup API"
 */
export const Scene10Developers: React.FC<{ localSec: number; fps: number }> = ({
  localSec,
  fps,
}) => {
  const f = localSec * fps;

  const slackPhase = easeRange(f, 138, 162, 0, 1, travelEasing); // 2.30s
  const apiPhase = easeRange(f, 246, 272, 0, 1, travelEasing); // 4.10s

  return (
    <FeatureSplitStage
      localFrame={f}
      eyebrow="WEBHOOKS & API"
      title="Wired straight into your stack."
      subtitle="Signed webhooks, real-time Slack & Discord alerts, and scoped server-side API keys."
    >
      <div
        style={{
          width: 1040,
          height: 680,
          borderRadius: WL.radiusWindow,
          border: `1px solid ${WL.border}`,
          backgroundColor: WL.white,
          boxShadow: WL.shadowHero,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {slackPhase < 0.99 && (
          <div style={{ position: "absolute", inset: 0, opacity: 1 - slackPhase }}>
            <RealCaptureFrame
              src="19_settings_webhooks.png"
              width={1040}
              height={680}
              scale={1.03}
              originX="48%"
              originY="0%"
              shadow="none"
              style={{ border: "none", borderRadius: 0 }}
            />
          </div>
        )}

        {slackPhase > 0.01 && apiPhase < 0.99 && (
          <div style={{ position: "absolute", inset: 0, opacity: slackPhase * (1 - apiPhase) }}>
            <RealCaptureFrame
              src="20_settings_notifications.png"
              width={1040}
              height={680}
              scale={1.03}
              originX="48%"
              originY="0%"
              shadow="none"
              style={{ border: "none", borderRadius: 0 }}
            />
          </div>
        )}

        {apiPhase > 0.01 && (
          <div style={{ position: "absolute", inset: 0, opacity: apiPhase }}>
            <RealCaptureFrame
              src="21_workspace_api_keys.png"
              width={1040}
              height={680}
              scale={1.03}
              originX="48%"
              originY="0%"
              shadow="none"
              style={{ border: "none", borderRadius: 0 }}
            />
          </div>
        )}
      </div>
    </FeatureSplitStage>
  );
};

/**
 * Scene 11 — Launch Day Callback Payoff with REAL Waitlyze Overview Dashboard
 * Uses REAL 3200x1920 capture: 01_waitlists_dashboard.png
 * VO (90.47..97.95s, dur 7.48s):
 * "Verified people. Compounding referrals. A launch list that actually shows up on day one."
 */
export const Scene11CallbackPayoff: React.FC<{ localSec: number; fps: number }> = ({
  localSec,
  fps,
}) => {
  const f = localSec * fps;

  const winIn = easeRange(f, 0, 26, 0, 1, arrivalEasing);
  const notifIn = easeRange(f, 200, 232, 0, 1, arrivalEasing); // 3.33s "A launch list..."
  const gentleZoom = interpolate(f, [0, 449], [1.0, 1.035], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <StudioBackdrop tone="clean">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: winIn,
          transform: `translate3d(0, ${(1 - winIn) * 24}px, 0)`,
        }}
      >
        <RealCaptureFrame
          src="01_waitlists_dashboard.png"
          width={1380}
          height={828}
          scale={gentleZoom}
          originX="48%"
          originY="0%"
        />
      </div>

      {/* Callback Notification — exact top-right echo of Scene 01, now winning */}
      <div
        style={{
          position: "absolute",
          top: 66,
          right: 112,
          opacity: notifIn,
          transform: `translate3d(0, ${(1 - notifIn) * -28}px, 0)`,
          zIndex: 40,
        }}
      >
        <NotificationCard
          width={500}
          app="Waitlyze · Launch Day"
          appBadgeBg={WL.ink}
          appGlyph={<WaitlyzeMark scale={0.62} dark />}
          title="Cohort 01 live — 89% opened in 12 min"
          body="1,774 verified supporters ready for launch day."
          time="just now"
          accentBorder="rgba(25, 102, 64, 0.3)"
        />
      </div>
    </StudioBackdrop>
  );
};

/**
 * Scene 12 — Clean Brand Outro
 * VO (97.95..103.99s, dur 6.04s): "Waitlyze. Your launch starts before launch day."
 */
export const Scene12Outro: React.FC<{ localSec: number; fps: number }> = ({
  localSec,
  fps,
}) => {
  const f = localSec * fps;

  const b1 = easeRange(f, 8, 28, 0, 1, arrivalEasing);
  const b2 = easeRange(f, 12, 32, 0, 1, arrivalEasing);
  const b3 = easeRange(f, 16, 36, 0, 1, arrivalEasing);
  const wordIn = easeRange(f, 22, 48, 0, 1, travelEasing);
  const dotIn = easeRange(f, 38, 58, 0, 1, arrivalEasing);
  const taglineIn = easeRange(f, 86, 118, 0, 1, travelEasing);
  const ctaIn = easeRange(f, 126, 158, 0, 1, arrivalEasing);

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
          gap: 26,
        }}
      >
        <WaitlyzeWordmark
          size={112}
          barProgress={[b1, b2, b3]}
          wordOpacity={wordIn}
          dotScale={dotIn}
        />

        <div
          style={{
            fontFamily: WL.fontSans,
            fontSize: 30,
            fontWeight: 500,
            color: WL.textSecondary,
            letterSpacing: "-0.015em",
            opacity: taglineIn,
            transform: `translate3d(0, ${(1 - taglineIn) * 12}px, 0)`,
          }}
        >
          Your launch starts before launch day.
        </div>

        <div
          style={{
            marginTop: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 22,
            opacity: ctaIn,
            transform: `translate3d(0, ${(1 - ctaIn) * 14}px, 0)`,
          }}
        >
          <div
            style={{
              height: 54,
              padding: "0 30px",
              borderRadius: WL.radiusPill,
              backgroundColor: WL.lime,
              color: WL.ink,
              fontFamily: WL.fontDisplay,
              fontSize: 19,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              boxShadow: WL.shadowCard,
            }}
          >
            Start for free
          </div>
          <span
            style={{
              fontFamily: WL.fontMono,
              fontSize: 21,
              fontWeight: 700,
              color: WL.ink,
              letterSpacing: "0.02em",
            }}
          >
            waitlyze.com
          </span>
        </div>
      </div>
    </StudioBackdrop>
  );
};
