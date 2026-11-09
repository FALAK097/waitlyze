const PUBLIC_URL_BASE =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  `https://assets.${process.env.APP_ROOT_DOMAIN || "waitlyze.com"}`;

/**
 * Drop the edge-cached copy of a public asset after its object is deleted so
 * a previously cached response cannot keep serving the removed bytes. Best
 * effort: the Cache API is only available inside the Worker runtime, and the
 * asset handler's own max-age bounds staleness in other colos.
 */
export async function purgePublicAsset(key) {
  if (!key || typeof key !== "string") return;
  if (typeof caches === "undefined" || !caches?.default) return;
  try {
    const url = new URL(`/${encodeURIComponent(key)}`, PUBLIC_URL_BASE);
    url.search = "";
    await caches.default.delete(new Request(url));
  } catch (error) {
    console.error("Public asset cache purge failed:", error?.name || error?.message || "unknown");
  }
}
