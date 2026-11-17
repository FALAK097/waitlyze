import { Easing, interpolate } from "remotion";

/**
 * Stageshow travel curve: cubic-bezier(0.45, 0, 0.1, 1)
 */
export const travelEasing = Easing.bezier(0.45, 0, 0.1, 1);

/**
 * Stageshow arrival curve: cubic-bezier(0.25, 0.8, 0.25, 1)
 */
export const arrivalEasing = Easing.bezier(0.25, 0.8, 0.25, 1);

/**
 * Clamp and ease a value between startFrame and endFrame
 */
export function easeRange(
  frame: number,
  startFrame: number,
  endFrame: number,
  from = 0,
  to = 1,
  easing: (t: number) => number = travelEasing,
): number {
  if (endFrame <= startFrame) return frame >= endFrame ? to : from;
  return interpolate(frame, [startFrame, endFrame], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}

/**
 * Multi-keyframe smooth interpolation using travelEasing between consecutive segments
 */
export function easeKeyframes<T extends number>(
  frame: number,
  frames: number[],
  values: T[],
  easing: (t: number) => number = travelEasing,
): number {
  if (frame <= frames[0]) return values[0];
  if (frame >= frames[frames.length - 1]) return values[values.length - 1];
  for (let i = 0; i < frames.length - 1; i++) {
    const f0 = frames[i];
    const f1 = frames[i + 1];
    if (frame >= f0 && frame <= f1) {
      return easeRange(frame, f0, f1, values[i], values[i + 1], easing);
    }
  }
  return values[values.length - 1];
}

/**
 * Interpolate hex colors smoothly in RGB space
 */
export function lerpColor(hexA: string, hexB: string, t: number): string {
  const c = Math.max(0, Math.min(1, t));
  const parse = (h: string) => {
    const clean = h.replace("#", "");
    return [
      Number.parseInt(clean.slice(0, 2), 16),
      Number.parseInt(clean.slice(2, 4), 16),
      Number.parseInt(clean.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(hexA);
  const [r2, g2, b2] = parse(hexB);
  const r = Math.round(r1 + (r2 - r1) * c);
  const g = Math.round(g1 + (g2 - g1) * c);
  const b = Math.round(b1 + (b2 - b1) * c);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Typewriter + backspace helper:
 * Transitions from `initialText` -> backspaces down to `commonPrefix` -> types `finalText`
 */
export function typeAndReplace(
  frame: number,
  opts: {
    initialText: string;
    commonPrefix?: string;
    finalText: string;
    backspaceStart: number;
    backspaceEnd: number;
    typeStart: number;
    typeEnd: number;
  },
): { text: string; isTyping: boolean; phase: "initial" | "backspacing" | "typing" | "done" } {
  const prefix = opts.commonPrefix ?? "";
  if (frame < opts.backspaceStart) {
    return { text: opts.initialText, isTyping: false, phase: "initial" };
  }
  if (frame < opts.backspaceEnd) {
    const suffixLen = opts.initialText.length - prefix.length;
    const progress =
      (frame - opts.backspaceStart) / Math.max(1, opts.backspaceEnd - opts.backspaceStart);
    const keep = Math.max(0, Math.round(suffixLen * (1 - progress)));
    return {
      text: opts.initialText.slice(0, prefix.length + keep),
      isTyping: true,
      phase: "backspacing",
    };
  }
  if (frame < opts.typeStart) {
    return { text: prefix, isTyping: true, phase: "backspacing" };
  }
  if (frame < opts.typeEnd) {
    const targetSuffix = opts.finalText.slice(prefix.length);
    const progress = (frame - opts.typeStart) / Math.max(1, opts.typeEnd - opts.typeStart);
    const chars = Math.min(targetSuffix.length, Math.floor(targetSuffix.length * progress));
    return {
      text: prefix + targetSuffix.slice(0, chars),
      isTyping: true,
      phase: "typing",
    };
  }
  return { text: opts.finalText, isTyping: false, phase: "done" };
}
