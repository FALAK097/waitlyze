// Server-side attribution sanitizer for public signup/impression payloads.
// Mirrors the client collector: caps lengths, drops non-strings.

const clean = (value, max) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed ? trimmed : undefined;
};

export function pickAttribution(body) {
  const source = body && typeof body === "object" ? body : {};
  return {
    referrer: clean(source.referrer, 2048),
    landingPage: clean(source.landingPage, 2048),
    utmSource: clean(source.utmSource, 256),
    utmMedium: clean(source.utmMedium, 256),
    utmCampaign: clean(source.utmCampaign, 256),
    utmTerm: clean(source.utmTerm, 256),
    utmContent: clean(source.utmContent, 256),
  };
}
