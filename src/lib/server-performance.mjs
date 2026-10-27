import "server-only";
import { randomUUID } from "node:crypto";

const SLOW_PHASE_THRESHOLD_MS = 100;

export function createServerPerformanceContext(route) {
  return { requestId: randomUUID(), route };
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
    throw error;
  } finally {
    const durationMs = Math.round(performance.now() - startedAt);
    if (durationMs >= SLOW_PHASE_THRESHOLD_MS) {
      console.info(
        JSON.stringify({
          event: "waitlyze.server_phase",
          requestId: context.requestId,
          route: context.route,
          phase,
          durationMs,
          outcome,
        }),
      );
    }
  }
}
