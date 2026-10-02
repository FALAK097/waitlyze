export const WAITLIST_SEARCH_LIMIT = 120;

export function normalizeWaitlistSearch(value) {
  return typeof value === "string" ? value.trim().slice(0, WAITLIST_SEARCH_LIMIT) : "";
}

export function waitlistSearchWhere(query) {
  return query ? { name: { contains: query, mode: "insensitive" } } : {};
}
