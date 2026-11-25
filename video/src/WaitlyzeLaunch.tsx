import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

import { easeRange, travelEasing } from "./motion/easing";
import {
  Scene01HookLaunch,
  Scene02RootCauseStack,
  Scene03PainBots,
} from "./scenes/Act1Pain";
import {
  Scene04MeetWaitlyze,
  Scene05ReferralLoop,
  Scene06FraudReview,
} from "./scenes/Act2Solution";
import {
  Scene07LaunchInMinutes,
  Scene08Analytics,
  Scene09Broadcasts,
  Scene10Developers,
  Scene11CallbackPayoff,
  Scene12Outro,
} from "./scenes/Act3MontageAndPayoff";
import { WL } from "./theme";
import voManifest from "./vo-manifest.json";

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = Math.round(voManifest.totalDuration * FPS);

const SCENE_COMPONENTS: Record<
  string,
  React.FC<{ localSec: number; fps: number }>
> = {
  "01_hook_launch": Scene01HookLaunch,
  "02_root_cause_stack": Scene02RootCauseStack,
  "03_pain_bots": Scene03PainBots,
  "04_meet_waitlyze": Scene04MeetWaitlyze,
  "05_referral_loop": Scene05ReferralLoop,
  "06_fraud_review": Scene06FraudReview,
  "07_launch_in_minutes": Scene07LaunchInMinutes,
  "08_analytics": Scene08Analytics,
  "09_broadcasts": Scene09Broadcasts,
  "10_developers": Scene10Developers,
  "11_callback_payoff": Scene11CallbackPayoff,
  "12_outro": Scene12Outro,
};

interface AlignedToken {
  tok: string;
  start: number;
  end: number;
}

/**
 * Splits aligned narration tokens cleanly at sentence/clause boundaries first,
 * then caps each single-line phrase at maxWords (8) so lines never wrap awkwardly
 * or orphan punctuation across beats.
 */
function buildPhraseChunks(tokens: AlignedToken[], maxWords = 8): AlignedToken[][] {
  const sentences: AlignedToken[][] = [];
  let buf: AlignedToken[] = [];

  for (const item of tokens) {
    buf.push(item);
    if (/[.?!—]$/.test(item.tok)) {
      sentences.push(buf);
      buf = [];
    }
  }
  if (buf.length > 0) sentences.push(buf);

  const chunks: AlignedToken[][] = [];
  for (const sent of sentences) {
    if (sent.length <= maxWords) {
      chunks.push(sent);
      continue;
    }
    // Balance long sentences evenly across minimal lines (e.g. 12 words -> 6 + 6 instead of 8 + 4)
    const lineCount = Math.ceil(sent.length / maxWords);
    const perLine = Math.ceil(sent.length / lineCount);
    for (let i = 0; i < sent.length; i += perLine) {
      chunks.push(sent.slice(i, i + perLine));
    }
  }
  return chunks;
}

/**
 * Word-synchronized live captions synced 1:1 to vo-manifest.json WordBoundary timings.
 * Automatically adapts contrast for light studio scenes and the dark rewind beat.
 */
const LiveCaptionsOverlay: React.FC<{
  currentSec: number;
  activeSeg: (typeof voManifest.segments)[number];
  isDarkStage: boolean;
}> = ({ currentSec, activeSeg, isDarkStage }) => {
  const rawTokens = activeSeg.text.split(/\s+/);
  let ptr = 0;
  const alignedTokens: AlignedToken[] = rawTokens.map((tok) => {
    const isPurePunct = /^[^\w]+$/.test(tok);
    const w = isPurePunct
      ? activeSeg.words[Math.max(0, ptr - 1)]
      : activeSeg.words[Math.min(ptr++, activeSeg.words.length - 1)];
    return {
      tok,
      start: w ? w.start : activeSeg.voStart,
      end: w ? w.end : activeSeg.voEnd,
    };
  });

  const chunks = buildPhraseChunks(alignedTokens, 8);

  // Pick the phrase active at currentSec (advancing cleanly right as the next phrase starts)
  const activeChunk =
    chunks.find((_, idx) => {
      const nextChunk = chunks[idx + 1];
      if (!nextChunk) return true;
      return currentSec < nextChunk[0].start - 0.04;
    }) || chunks[chunks.length - 1];

  // Smooth fade-in right before first word, fade-out cleanly after last word finishes
  const fadeIn = easeRange(currentSec, activeSeg.voStart - 0.14, activeSeg.voStart + 0.04, 0, 1, travelEasing);
  const fadeOut = easeRange(currentSec, activeSeg.voEnd + 0.28, activeSeg.voEnd + 0.56, 1, 0, travelEasing);
  const opacity = Math.min(fadeIn, fadeOut);

  if (opacity <= 0.01) return null;

  const featherBg = isDarkStage
    ? "linear-gradient(180deg, rgba(13,21,18,0) 0%, rgba(13,21,18,0.78) 54%, rgba(13,21,18,0.95) 100%)"
    : "linear-gradient(180deg, rgba(245,246,243,0) 0%, rgba(245,246,243,0.82) 54%, rgba(245,246,243,0.96) 100%)";

  const strokeColor = isDarkStage ? "rgba(13, 21, 18, 0.96)" : "rgba(245, 246, 243, 0.98)";
  const shadowColor = isDarkStage ? "rgba(13, 21, 18, 0.9)" : "rgba(255, 255, 255, 0.96)";

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity, zIndex: 90 }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 92,
          background: featherBg,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 96,
          right: 96,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "nowrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "0 10px",
            textAlign: "center",
          }}
        >
          {activeChunk.map((item, idx) => {
            const isSpoken = currentSec >= item.start - 0.03;
            const isCurrent =
              currentSec >= item.start - 0.04 && currentSec <= item.end + 0.14;

            const color = isDarkStage
              ? isCurrent
                ? WL.lime
                : isSpoken
                  ? "#FFFFFF"
                  : "rgba(255, 255, 255, 0.45)"
              : isCurrent
                ? WL.forest
                : isSpoken
                  ? WL.ink
                  : WL.textMuted;

            return (
              <span
                key={`${item.tok}-${idx}`}
                style={{
                  fontFamily: WL.fontDisplay,
                  fontSize: 27,
                  fontWeight: isCurrent ? 800 : 700,
                  letterSpacing: "-0.025em",
                  color,
                  WebkitTextStroke: `5.5px ${strokeColor}`,
                  paintOrder: "stroke fill",
                  textShadow: `0 2px 10px ${shadowColor}`,
                  whiteSpace: "nowrap",
                }}
              >
                {item.tok}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Waitlyze Launch Film — Problem -> Solution -> Payoff
 * Built with authentic Waitlyze tokens, real 3200x1920 product captures,
 * Stageshow motion craft, and word-synchronized live captions.
 */
export const WaitlyzeLaunch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  const segments = voManifest.segments;
  const segIndex = segments.findIndex(
    (s) => currentSec >= s.sceneStart && currentSec < s.sceneEnd,
  );
  const resolvedIndex = segIndex === -1 ? segments.length - 1 : segIndex;
  const activeSeg = segments[resolvedIndex];

  const localSec = Math.max(0, currentSec - activeSeg.sceneStart);
  const remainingSec = Math.max(0, activeSeg.sceneEnd - currentSec);

  const ActiveScene = SCENE_COMPONENTS[activeSeg.id] ?? Scene12Outro;

  const isHardCutBefore =
    activeSeg.id === "04_meet_waitlyze" || activeSeg.id === "02_root_cause_stack";
  const fadeIn =
    resolvedIndex === 0 || isHardCutBefore
      ? 1
      : easeRange(localSec * fps, 0, 14, 0, 1, travelEasing);

  const nextSeg = segments[resolvedIndex + 1];
  const isHardCutAfter =
    nextSeg &&
    (nextSeg.id === "04_meet_waitlyze" || nextSeg.id === "02_root_cause_stack");
  const fadeOut =
    !nextSeg || isHardCutAfter
      ? 1
      : easeRange(remainingSec * fps, 0, 14, 0, 1, travelEasing);

  const sceneOpacity = Math.min(fadeIn, fadeOut);
  const isDarkStage = activeSeg.id === "01_hook_launch" && localSec * fps >= 162;

  return (
    <AbsoluteFill style={{ backgroundColor: WL.stageClean, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        <ActiveScene localSec={localSec} fps={fps} />
      </AbsoluteFill>
      <LiveCaptionsOverlay
        currentSec={currentSec}
        activeSeg={activeSeg}
        isDarkStage={isDarkStage}
      />
    </AbsoluteFill>
  );
};
