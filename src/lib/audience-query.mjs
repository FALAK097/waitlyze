export const AUDIENCE_PAGE_SIZE = 25;

export const IMPORT_TEMPLATE_CSV =
  "email,country,points,referral_code,referred_by,verified,joined_at\nvisitor@example.com,US,0,,,false,\n";

export function parseAudienceFilters(searchParams) {
  const query = (searchParams.get("q") ?? "").trim();
  const status = searchParams.get("status") ?? "all";
  const sort = searchParams.get("sort") ?? "joined_desc";
  const delivery = searchParams.get("delivery") ?? "all";
  if (query.length > 120) return { error: "Search must be 120 characters or fewer." };
  if (!["all", "verified", "pending"].includes(status))
    return { error: "Invalid subscriber status." };
  if (!["joined_desc", "joined_asc"].includes(sort)) return { error: "Invalid sort order." };
  if (!["all", "failed"].includes(delivery)) return { error: "Invalid email filter." };
  return { query, status, sort, delivery };
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
  // oxlint-disable-next-line no-control-regex -- control chars are the attack surface being neutralized.
  if (/^[\s\u0000-\u001f\u007f-\u009f]*[=+@-]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function subscriberCsvRow(subscriber) {
  return [
    subscriber.email,
    subscriber.verifiedAt ? "Verified" : "Needs confirmation",
    subscriber.createdAt,
  ]
    .map(csvCell)
    .join(",");
}

export const EXPORT_COLUMNS = [
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
  { key: "joined", label: "Joined at" },
  { key: "country", label: "Country" },
  { key: "city", label: "City" },
  { key: "device", label: "Device" },
  { key: "points", label: "Points" },
  { key: "referrals", label: "Referrals" },
  { key: "referral_code", label: "Referral code" },
  { key: "referred_by", label: "Referred by" },
  { key: "position", label: "Position" },
];

const EXPORT_DEFAULTS = ["email", "status", "joined"];

// Parses the `columns` export parameter into a validated key list.
export function parseExportColumns(value) {
  if (value == null || value === "") return EXPORT_DEFAULTS;
  const keys = String(value)
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
  const valid = [...new Set(keys)].filter((key) =>
    EXPORT_COLUMNS.some((column) => column.key === key),
  );
  return valid.length ? valid.slice(0, EXPORT_COLUMNS.length) : null;
}

export function exportHeaderRow(columns) {
  return columns
    .map((key) => EXPORT_COLUMNS.find((column) => column.key === key).label)
    .map(csvCell)
    .join(",");
}

export function buildExportRow(subscriber, columns, extra = {}) {
  const values = {
    email: subscriber.email,
    status: subscriber.verifiedAt ? "Verified" : "Needs confirmation",
    joined: subscriber.createdAt,
    country: subscriber.country,
    city: subscriber.city,
    device: subscriber.device,
    points: subscriber.points ?? 0,
    referrals: extra.referralCount ?? 0,
    referral_code: subscriber.referralCode ?? "",
    referred_by: subscriber.referredBy?.email ?? "",
    position: extra.position ?? "",
  };
  return columns.map((key) => csvCell(values[key])).join(",");
}
