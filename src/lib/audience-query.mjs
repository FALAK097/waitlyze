export const AUDIENCE_PAGE_SIZE = 25;

export function parseAudienceFilters(searchParams) {
  const query = (searchParams.get("q") ?? "").trim();
  const status = searchParams.get("status") ?? "all";
  if (query.length > 120) return { error: "Search must be 120 characters or fewer." };
  if (!["all", "verified", "pending"].includes(status)) return { error: "Invalid subscriber status." };
  return { query, status };
}

export function audienceWhere(waitListId, scope, filters) {
  return {
    waitListId,
    waitList: scope,
    ...(filters.status === "verified" ? { verifiedAt: { not: null } } : {}),
    ...(filters.status === "pending" ? { verifiedAt: null } : {}),
    ...(filters.query ? { email: { contains: filters.query, mode: "insensitive" } } : {}),
  };
}

export function csvCell(value) {
  let text = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  // Prefix formula-like values even when attackers hide the trigger after whitespace/control chars.
  if (/^[\s\u0000-\u001f\u007f-\u009f]*[=+@-]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function subscriberCsvRow(subscriber) {
  return [subscriber.email, subscriber.verifiedAt ? "Verified" : "Needs confirmation", subscriber.createdAt]
    .map(csvCell).join(",");
}
