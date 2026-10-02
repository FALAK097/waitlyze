export const WAITLIST_SEARCH_LIMIT = 120;
export const WAITLIST_STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "PAUSED", label: "Paused" },
];
export const WAITLIST_DEFAULT_SORT = "name-asc";
export const WAITLIST_SORTS = [
  "name-asc",
  "name-desc",
  "subscribers-asc",
  "subscribers-desc",
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

export function normalizeWaitlistSort(value) {
  return typeof value === "string" && WAITLIST_SORTS.includes(value) ? value : WAITLIST_DEFAULT_SORT;
}

export function waitlistSortOrderBy(sort) {
  switch (normalizeWaitlistSort(sort)) {
    case "name-desc":
      return [{ name: "desc" }, { id: "asc" }];
    case "subscribers-asc":
      return [{ signUps: { _count: "asc" } }, { name: "asc" }, { id: "asc" }];
    case "subscribers-desc":
      return [{ signUps: { _count: "desc" } }, { name: "asc" }, { id: "asc" }];
    default:
      return [{ name: "asc" }, { id: "asc" }];
  }
}
