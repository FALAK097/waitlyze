export const AUDIENCE_PAGE_SIZE = 25;

export const IMPORT_TEMPLATE_CSV = "email\nvisitor@example.com\n";

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

export const EXPORT_COLUMNS = [
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
  { key: "joined", label: "Joined at" },
  { key: "country", label: "Country" },
  { key: "city", label: "City" },
  { key: "device", label: "Device" },
  { key: "referrals", label: "Referrals" },
  { key: "position", label: "Position" },
];

const EXPORT_DEFAULTS = ["email", "status", "joined"];

// Parses the `columns` export parameter into a validated key list.
export function parseExportColumns(value) {
  if (value == null || value === "") return EXPORT_DEFAULTS;
  const keys = String(value).split(",").map((key) => key.trim()).filter(Boolean);
  const valid = [...new Set(keys)].filter((key) => EXPORT_COLUMNS.some((column) => column.key === key));
  return valid.length ? valid.slice(0, EXPORT_COLUMNS.length) : null;
}

export function exportHeaderRow(columns) {
  return columns.map((key) => EXPORT_COLUMNS.find((column) => column.key === key).label).map(csvCell).join(",");
}

export function buildExportRow(subscriber, columns, extra = {}) {
  const values = {
    email: subscriber.email,
    status: subscriber.verifiedAt ? "Verified" : "Needs confirmation",
    joined: subscriber.createdAt,
    country: subscriber.country,
    city: subscriber.city,
    device: subscriber.device,
    referrals: extra.referralCount ?? 0,
    position: extra.position ?? "",
  };
  return columns.map((key) => csvCell(values[key])).join(",");
}
