// Client-side attribution collection shared by the impression tracker and the
// signup form so both rows carry the same referrer / landing / UTM snapshot.
//
// First-touch wins: the first snapshot per waitlist is kept in sessionStorage
// so the join still carries the original UTM params / landing page even if the
// URL changed between the page view and the signup (referral `?r=` links,
// in-page navigation). Storage failures fall back to the live snapshot.

const KEY_PREFIX = "waitlyze:attr:";
const FIELDS = [
  "referrer",
  "landingPage",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmTerm",
  "utmContent",
];

const trimTo = (value, max) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed ? trimmed : undefined;
};

function readStored(waitListId) {
  try {
    if (typeof sessionStorage === "undefined" || !waitListId) return null;
    const raw = sessionStorage.getItem(`${KEY_PREFIX}${waitListId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const snapshot = {};
    for (const field of FIELDS) {
      if (typeof parsed[field] === "string" && parsed[field]) snapshot[field] = parsed[field];
    }
    return Object.keys(snapshot).length > 0 ? snapshot : null;
  } catch {
    return null;
  }
}

function storeSnapshot(waitListId, snapshot) {
  try {
    if (typeof sessionStorage === "undefined" || !waitListId) return;
    if (Object.keys(snapshot).length === 0) return;
    sessionStorage.setItem(`${KEY_PREFIX}${waitListId}`, JSON.stringify(snapshot));
  } catch {
    // Attribution is best-effort; private mode must never break the funnel.
  }
}

export function collectAttribution(waitListId) {
  if (typeof window === "undefined" || typeof document === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const live = {
    referrer: trimTo(document.referrer, 2048),
    landingPage: trimTo(window.location.href, 2048),
    utmSource: trimTo(params.get("utm_source") || "", 256),
    utmMedium: trimTo(params.get("utm_medium") || "", 256),
    utmCampaign: trimTo(params.get("utm_campaign") || "", 256),
    utmTerm: trimTo(params.get("utm_term") || "", 256),
    utmContent: trimTo(params.get("utm_content") || "", 256),
  };
  const stored = readStored(waitListId);
  if (stored) return stored;
  const snapshot = {};
  for (const field of FIELDS) {
    if (live[field] !== undefined) snapshot[field] = live[field];
  }
  storeSnapshot(waitListId, snapshot);
  return live;
}
