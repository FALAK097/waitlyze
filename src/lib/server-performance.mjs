import "server-only";
import { randomUUID } from "node:crypto";

const SLOW_PHASE_THRESHOLD_MS = 100;

export function createServerPerformanceContext(route) {
  return {
    requestId: randomUUID(),
    route,
    startedAt: performance.now(),
    outcome: "success",
  };
}

export function logServerPhase(context, phase, durationMs, outcome = context.outcome) {
  const roundedDurationMs = Math.round(durationMs);
  if (roundedDurationMs < SLOW_PHASE_THRESHOLD_MS) return;

  console.info(
    JSON.stringify({
      event: "waitlyze.server_phase",
      requestId: context.requestId,
      route: context.route,
      phase,
      durationMs: roundedDurationMs,
      outcome,
    }),
  );
}

export function logElapsedServerPhase(context, phase, startedAt) {
  logServerPhase(context, phase, performance.now() - startedAt);
}

export async function withServerPhase(context, phase, operation, resolveOutcome) {
  const startedAt = performance.now();
  let outcome = "success";

  try {
    const result = await operation();
    outcome = resolveOutcome?.() || outcome;
    return result;
  } catch (error) {
    outcome = "error";
    context.outcome = outcome;
    throw error;
  } finally {
    logServerPhase(context, phase, performance.now() - startedAt, outcome);
  }
}
