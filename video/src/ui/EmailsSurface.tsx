import React from "react";
import { useCurrentFrame } from "remotion";

import { DigitRoll, animatedNumber } from "../motion/DigitRoll";
import { arrivalEasing, easeRange, travelEasing } from "../motion/easing";

/**
 * Chapter 07 EMAILS (frames 2430..2834):
 * - Cohort broadcast composer + Automated welcome & milestone sequences
 * - Segment selector switches to `Top 10% Referrers · 123 verified`
 * - Pressing `Send broadcast` morphs in-slot to `Delivered · 123/123` with live delivery progress bar
 */
export const EmailsSurface: React.FC = () => {
  const frame = useCurrentFrame();

  const segmentSelected = easeRange(frame, 2480, 2530, 0, 1, travelEasing);
  const sendClicked = frame >= 2635;
  const deliveryProgress = easeRange(frame, 2640, 2755, 0, 1, arrivalEasing);
  const deliveredCount = animatedNumber(frame, 2640, 2755, 0, 123);

  const sendPress =
    frame >= 2625 && frame <= 2645 ? 1 - 0.05 * Math.sin(((frame - 2625) / 20) * Math.PI) : 1;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "420px 1fr",
        gap: 22,
        height: "100%",
      }}
    >
      {/* Left: Automated Sequences + Delivery Health */}
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
              Automated sequences
            </div>
            <div style={{ fontSize: 12, color: "#687076", marginTop: 2 }}>
              Resend + DKIM verified · waitlyze.com
            </div>
          </div>
          <span
            style={{
              fontFamily: "'Paper Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 999,
              backgroundColor: "#EAF8F0",
              color: "#196642",
            }}
          >
            99.4% DELIVERED
          </span>
        </div>

        {[
          {
            title: "Instant verification & welcome",
            trigger: "On signup · Double opt-in",
            stat: "1,230 sent · 84% open",
            active: true,
          },
          {
            title: "3-referral milestone unlocked",
            trigger: "When referrals ≥ 3 (150 pts)",
            stat: "184 sent · 91% open",
            active: true,
          },
          {
            title: "5-referral Founding Pass",
            trigger: "When referrals ≥ 5 (250 pts)",
            stat: "62 sent · 94% open",
            active: true,
          },
        ].map((seq, idx) => (
          <div
            key={idx}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #E4E7EA",
              backgroundColor: "#F9FAFB",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#00160A" }}>{seq.title}</span>
              <span
                style={{
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 10.5,
                  padding: "2px 7px",
                  borderRadius: 999,
                  backgroundColor: "#BAFE2A",
                  color: "#00160A",
                  fontWeight: 700,
                }}
              >
                LIVE
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11.5,
                color: "#687076",
              }}
            >
              <span>{seq.trigger}</span>
              <span
                style={{
                  fontFamily: "'Paper Mono', monospace",
                  color: "#196642",
                  fontWeight: 600,
                }}
              >
                {seq.stat}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Right: Cohort Broadcast Composer */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E7EA",
          borderRadius: 12,
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
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
              <div style={{ fontSize: 16, fontWeight: 700, color: "#00160A" }}>
                Cohort broadcast · Wave 01
              </div>
              <div style={{ fontSize: 12.5, color: "#687076", marginTop: 2 }}>
                Roll out invites to your highest-intent referrers first
              </div>
            </div>

            {/* Segment Selector Pill */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  backgroundColor: segmentSelected > 0.5 ? "#F6FEE7" : "#F2F4F5",
                  border: segmentSelected > 0.5 ? "1.5px solid #9EE01A" : "1px solid #E4E7EA",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#00160A",
                  fontFamily: "'Paper Mono', monospace",
                }}
              >
                {segmentSelected > 0.5
                  ? "SEGMENT: TOP 10% REFERRERS (123)"
                  : "SEGMENT: ALL VERIFIED (1,230)"}
              </span>
            </div>
          </div>

          {/* Subject & Preview Card */}
          <div
            style={{
              marginTop: 16,
              padding: "18px 20px",
              borderRadius: 10,
              border: "1px solid #E4E7EA",
              backgroundColor: "#F8FAFB",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingBottom: 10,
                borderBottom: "1px solid #EAECEF",
              }}
            >
              <span
                style={{
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 11.5,
                  color: "#687076",
                  width: 68,
                }}
              >
                SUBJECT
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#00160A" }}>
                Your Weekend Priority Pass is ready — claim your cabin drop
              </span>
            </div>

            <div
              style={{
                fontSize: 13.5,
                color: "#2C3237",
                lineHeight: 1.55,
              }}
            >
              Hi{" "}
              <span
                style={{
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 12,
                  padding: "1px 6px",
                  borderRadius: 4,
                  backgroundColor: "#EAECEF",
                }}
              >
                {"{{first_name}}"}
              </span>
              , you jumped to{" "}
              <span
                style={{
                  fontFamily: "'Paper Mono', monospace",
                  fontSize: 12,
                  padding: "1px 6px",
                  borderRadius: 4,
                  backgroundColor: "#F6FEE7",
                  border: "1px solid #CFF678",
                  fontWeight: 700,
                }}
              >
                {"#{{queue_position}}"}
              </span>{" "}
              on the Weekend waitlist. Your 48-hour priority booking window for Drop 01 is now
              unlocked.
            </div>
          </div>
        </div>

        {/* Footer Action + Live Delivery Bar */}
        <div
          style={{
            paddingTop: 16,
            borderTop: "1px solid #EEF0F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1, marginRight: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                fontWeight: 600,
                color: "#2C3237",
                marginBottom: 6,
              }}
            >
              <span>
                {sendClicked
                  ? "Dispatched via Cloudflare Outbox"
                  : "Ready to dispatch to 123 verified referrers"}
              </span>
              <span style={{ fontFamily: "'Paper Mono', monospace" }}>
                <DigitRoll value={deliveredCount} fontSize={12} fontWeight={700} />
                /123 delivered
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                backgroundColor: "#EAECEF",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(deliveryProgress * 100).toFixed(1)}%`,
                  height: "100%",
                  backgroundColor: "#196642",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>

          <div
            style={{
              padding: "11px 22px",
              borderRadius: 9,
              backgroundColor: sendClicked ? "#00160A" : "#BAFE2A",
              color: sendClicked ? "#BAFE2A" : "#00160A",
              fontSize: 13.5,
              fontWeight: 800,
              border: sendClicked ? "1px solid #00160A" : "1px solid #9EE01A",
              transform: `scale(${sendPress.toFixed(3)})`,
              minWidth: 186,
              textAlign: "center",
            }}
          >
            {sendClicked ? "✓ Broadcast sent" : "Send broadcast →"}
          </div>
        </div>
      </div>
    </div>
  );
};
