// Client-side attribution collection shared by the impression tracker and the
// signup form so both rows carry the same referrer / landing / UTM snapshot.

const trimTo = (value, max) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed ? trimmed : undefined;
};

export function collectAttribution() {
  if (typeof window === "undefined" || typeof document === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    referrer: trimTo(document.referrer, 2048),
    landingPage: trimTo(window.location.href, 2048),
    utmSource: trimTo(params.get("utm_source") || "", 256),
    utmMedium: trimTo(params.get("utm_medium") || "", 256),
    utmCampaign: trimTo(params.get("utm_campaign") || "", 256),
    utmTerm: trimTo(params.get("utm_term") || "", 256),
    utmContent: trimTo(params.get("utm_content") || "", 256),
  };
}
