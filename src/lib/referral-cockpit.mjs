/** Keep founder-entered follow links to safe https destinations. */
export function safeFollowUrl(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\s*(javascript|data|vbscript|file|blob):/i.test(trimmed)) return null;
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (/^http:\/\//i.test(trimmed)) return trimmed.replace(/^http:\/\//i, "https://");
  if (/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}([/?#].*)?$/.test(trimmed)) return `https://${trimmed}`;
  return null;
}

export function socialFollowEntries(statusPage) {
  const follows = Array.isArray(statusPage?.socialFollows) ? statusPage.socialFollows : [];
  return follows
    .filter((entry) => entry && (entry.network === "x" || entry.network === "instagram"))
    .map((entry) => ({ network: entry.network, url: safeFollowUrl(entry.url) }))
    .filter((entry) => entry.url);
}
