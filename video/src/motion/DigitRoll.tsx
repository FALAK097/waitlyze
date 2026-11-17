import React from "react";

import { arrivalEasing, easeRange } from "./easing";

interface DigitRollProps {
  value: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  fontFamily?: string;
}

/**
 * Per-digit vertical rolling counter following stageshow's Count rule:
 * unchanged digits stay still; changed digits roll smoothly in their own slot.
 */
export const DigitRoll: React.FC<DigitRollProps> = ({
  value,
  fontSize = 24,
  color = "#00160A",
  fontWeight = 700,
  prefix = "",
  suffix = "",
  decimals = 0,
  fontFamily = "'Paper Mono', ui-monospace, monospace",
}) => {
  const safeVal = Math.max(0, value);
  const scale = 10 ** decimals;
  const scaled = safeVal * scale;
  const whole = Math.floor(scaled);
  const formatted =
    decimals > 0 ? (whole / scale).toFixed(decimals) : whole.toLocaleString("en-US");

  // The displayed digit and rolling progress share the same lower decimal base.
  const frac = scaled - whole;

  const chars = formatted.split("");
  const lineHeight = Math.round(fontSize * 1.18);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontFamily,
        fontSize,
        fontWeight,
        color,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.03em",
        lineHeight: `${lineHeight}px`,
      }}
    >
      {prefix && <span>{prefix}</span>}
      {chars.map((ch, idx) => {
        const isDigit = ch >= "0" && ch <= "9";
        if (!isDigit) {
          return (
            <span key={`sep-${idx}`} style={{ display: "inline-block" }}>
              {ch}
            </span>
          );
        }
        const digit = Number.parseInt(ch, 10);
        const isLastDigit = idx === chars.length - 1;
        const offset = isLastDigit ? digit + frac * 0.85 : digit;

        return (
          <span
            key={`col-${chars.length - idx}`}
            style={{
              display: "inline-block",
              height: lineHeight,
              overflow: "hidden",
              position: "relative",
              width: "0.62em",
              textAlign: "center",
            }}
          >
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                transform: `translate3d(0, ${-offset * lineHeight}px, 0)`,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
                <span
                  key={i}
                  style={{
                    height: lineHeight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
      {suffix && <span>{suffix}</span>}
    </span>
  );
};

export function animatedNumber(
  frame: number,
  startFrame: number,
  endFrame: number,
  from: number,
  to: number,
): number {
  return easeRange(frame, startFrame, endFrame, from, to, arrivalEasing);
}
