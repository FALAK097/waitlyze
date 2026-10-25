// Funnel pipeline stages per waitlist. Keys are fixed (Waitlist → Invited →
// Joined → Converted); founders may rename labels per waitlist. Stored on
// WaitList.pipelineStages as [{key,label}] or null for defaults. Feeds the
// Phase-8 launch flow; this phase only models stages, movement, and counts.

export const PIPELINE_STAGE_KEYS = Object.freeze(["WAITLIST", "INVITED", "JOINED", "CONVERTED"]);

export const DEFAULT_PIPELINE_STAGES = Object.freeze([
  { key: "WAITLIST", label: "Waitlist" },
  { key: "INVITED", label: "Invited" },
  { key: "JOINED", label: "Joined" },
  { key: "CONVERTED", label: "Converted" },
]);

export const DEFAULT_PIPELINE_STAGE = "WAITLIST";
const LABEL_LIMIT = 40;

export function normalizeStageKey(value) {
  const key = String(value || "")
    .trim()
    .toUpperCase();
  return PIPELINE_STAGE_KEYS.includes(key) ? key : DEFAULT_PIPELINE_STAGE;
}

function cleanLabel(value, fallback) {
  const label = String(value ?? "")
    .trim()
    .slice(0, LABEL_LIMIT);
  return label || fallback;
}

/** Resolve effective stages for a waitlist (custom labels over default keys). */
export function resolvePipelineStages(stored) {
  if (!Array.isArray(stored)) return DEFAULT_PIPELINE_STAGES.map((stage) => ({ ...stage }));
  const byKey = new Map();
  for (const entry of stored) {
    if (!entry || typeof entry !== "object") continue;
    const key = String(entry.key || "")
      .trim()
      .toUpperCase();
    if (!PIPELINE_STAGE_KEYS.includes(key) || byKey.has(key)) continue;
    byKey.set(key, { key, label: cleanLabel(entry.label, defaultLabel(key)) });
  }
  return DEFAULT_PIPELINE_STAGES.map(
    (stage) => byKey.get(stage.key) || { key: stage.key, label: stage.label },
  );
}

function defaultLabel(key) {
  return DEFAULT_PIPELINE_STAGES.find((stage) => stage.key === key)?.label || key;
}

/**
 * Validate a founder-submitted stage rename payload. Keys must be exactly the
 * default set (rename-only, no add/remove/reorder); labels are trimmed text.
 * Returns { stages } or { error }.
 */
export function parsePipelineStages(input) {
  if (!Array.isArray(input)) return { error: "Stages must be a list." };
  const seen = new Set();
  const stages = [];
  for (const entry of input) {
    const key = String(entry?.key || "")
      .trim()
      .toUpperCase();
    if (!PIPELINE_STAGE_KEYS.includes(key)) return { error: "Unknown pipeline stage." };
    if (seen.has(key)) return { error: "Each pipeline stage may appear only once." };
    seen.add(key);
    const label = String(entry?.label ?? "").trim();
    if (!label) return { error: "Each stage needs a name." };
    if (label.length > LABEL_LIMIT)
      return { error: `Stage names must be ${LABEL_LIMIT} characters or fewer.` };
    stages.push({ key, label });
  }
  if (stages.length !== PIPELINE_STAGE_KEYS.length)
    return { error: "All four pipeline stages are required." };
  const ordered = PIPELINE_STAGE_KEYS.map((key) => stages.find((stage) => stage.key === key));
  return { stages: ordered };
}
