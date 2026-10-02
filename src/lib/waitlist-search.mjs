export const WAITLIST_SEARCH_LIMIT = 120;
export const WAITLIST_STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "PAUSED", label: "Paused" },
];

export function normalizeWaitlistSearch(value) {
  return typeof value === "string" ? value.trim().slice(0, WAITLIST_SEARCH_LIMIT) : "";
}

export function waitlistSearchWhere(query) {
  return query ? { name: { contains: query, mode: "insensitive" } } : {};
}

export function normalizeWaitlistStatus(value) {
  return typeof value === "string" && WAITLIST_STATUS_FILTERS.some((filter) => filter.value === value) ? value : "";
}

export function waitlistStatusWhere(status) {
  return status ? { status } : {};
}
