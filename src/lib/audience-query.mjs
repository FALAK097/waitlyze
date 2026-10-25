export const AUDIENCE_PAGE_SIZE = 25;

export const IMPORT_TEMPLATE_CSV =
  "email,country,points,referral_code,referred_by,verified,joined_at\nvisitor@example.com,US,0,,,false,\n";

export const AUDIENCE_SORTS = [
  "joined_desc",
  "joined_asc",
  "email_asc",
  "email_desc",
  "points_desc",
  "points_asc",
  "status_desc",
  "status_asc",
  "position_asc",
  "position_desc",
];

export function parseAudienceFilters(searchParams) {
  const query = (searchParams.get("q") ?? "").trim();
  const status = searchParams.get("status") ?? "all";
  const sort = searchParams.get("sort") ?? "joined_desc";
  const delivery = searchParams.get("delivery") ?? "all";
  const country = (searchParams.get("country") ?? "").trim();
  const city = (searchParams.get("city") ?? "").trim();
  const source = (searchParams.get("source") ?? "").trim();
  const landing = (searchParams.get("landing") ?? "").trim();
  const utm = (searchParams.get("utm") ?? "").trim();
  const device = (searchParams.get("device") ?? "").trim();
  if (query.length > 120) return { error: "Search must be 120 characters or fewer." };
  if (!["all", "verified", "pending"].includes(status))
    return { error: "Invalid subscriber status." };
  if (!AUDIENCE_SORTS.includes(sort)) return { error: "Invalid sort order." };
  if (!["all", "failed"].includes(delivery)) return { error: "Invalid email filter." };
  for (const [key, value] of [
    ["country", country],
    ["city", city],
    ["source", source],
    ["landing", landing],
    ["utm", utm],
    ["device", device],
  ]) {
    if (value.length > 80) return { error: `Invalid ${key} filter.` };
  }
  return { query, status, sort, delivery, country, city, source, landing, utm, device };
}

export function audienceWhere(waitListId, scope, filters) {
  const contains = (value) => ({ contains: value, mode: "insensitive" });
  const and = [];
  if (filters.device)
    and.push({
      OR: [{ deviceType: contains(filters.device) }, { device: contains(filters.device) }],
    });
  if (filters.utm)
    and.push({
      OR: [
        { utmMedium: contains(filters.utm) },
        { utmCampaign: contains(filters.utm) },
        { utmTerm: contains(filters.utm) },
        { utmContent: contains(filters.utm) },
        { referrer: contains(filters.utm) },
      ],
    });
  return {
    waitListId,
    waitList: scope,
    ...(filters.status === "verified" ? { verifiedAt: { not: null } } : {}),
    ...(filters.status === "pending" ? { verifiedAt: null } : {}),
    ...(filters.query ? { email: contains(filters.query) } : {}),
    ...(filters.country ? { country: contains(filters.country) } : {}),
    ...(filters.city ? { city: contains(filters.city) } : {}),
    ...(filters.source ? { utmSource: contains(filters.source) } : {}),
    ...(filters.landing ? { landingPage: contains(filters.landing) } : {}),
    ...(and.length ? { AND: and } : {}),
  };
}

export function isJoinedSort(sort) {
  return sort === "joined_asc" || sort === "joined_desc";
}

export function isPositionSort(sort) {
  return sort === "position_asc" || sort === "position_desc";
}

// Prisma orderBy for every list sort except joined (cursor-paginated) and
// position (ranked in memory from the full positions map).
export function audienceOrderBy(sort) {
  switch (sort) {
    case "email_asc":
      return [{ email: "asc" }, { id: "asc" }];
    case "email_desc":
      return [{ email: "desc" }, { id: "asc" }];
    case "points_desc":
      return [{ points: "desc" }, { id: "asc" }];
    case "points_asc":
      return [{ points: "asc" }, { id: "asc" }];
    case "status_desc":
      return [{ verifiedAt: { sort: "desc", nulls: "last" } }, { id: "asc" }];
    case "status_asc":
      return [{ verifiedAt: { sort: "asc", nulls: "first" } }, { id: "asc" }];
    default:
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

// Comparator for rows already carrying a position (leaders first on asc).
// In-memory ordering for sorts the database cannot express (position rank)
// and for the failed-delivery view. Null/undefined positions sort last.
export function sortAudienceRows(rows, sort, positions = new Map()) {
  const withPosition = rows.map((row) => ({
    ...row,
    position: positions.get(row.id) ?? row.position ?? null,
  }));
  const byId = (a, b) => (a.id < b.id ? -1 : 1);
  switch (sort) {
    case "email_asc":
      return withPosition.sort((a, b) =>
        a.email < b.email ? -1 : a.email > b.email ? 1 : byId(a, b),
      );
    case "email_desc":
      return withPosition.sort((a, b) =>
        a.email > b.email ? -1 : a.email < b.email ? 1 : byId(a, b),
      );
    case "points_desc":
      return withPosition.sort((a, b) => b.points - a.points || byId(a, b));
    case "points_asc":
      return withPosition.sort((a, b) => a.points - b.points || byId(a, b));
    case "status_desc":
      return withPosition.sort(
        (a, b) => Number(Boolean(b.verifiedAt)) - Number(Boolean(a.verifiedAt)) || byId(a, b),
      );
    case "status_asc":
      return withPosition.sort(
        (a, b) => Number(Boolean(a.verifiedAt)) - Number(Boolean(b.verifiedAt)) || byId(a, b),
      );
    case "position_asc":
    case "position_desc": {
      const sign = sort === "position_desc" ? -1 : 1;
      return withPosition.sort((a, b) => {
        const pa = a.position == null ? Number.MAX_SAFE_INTEGER : a.position;
        const pb = b.position == null ? Number.MAX_SAFE_INTEGER : b.position;
        if (pa !== pb) return (pa - pb) * sign;
        if (a.createdAt < b.createdAt) return -1;
        if (a.createdAt > b.createdAt) return 1;
        return byId(a, b);
      });
    }
    default:
      return rows;
  }
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
  { key: "timezone", label: "Timezone" },
  { key: "device", label: "Device" },
  { key: "device_type", label: "Device type" },
  { key: "source", label: "UTM source" },
  { key: "utm_medium", label: "UTM medium" },
  { key: "utm_campaign", label: "UTM campaign" },
  { key: "utm_term", label: "UTM term" },
  { key: "utm_content", label: "UTM content" },
  { key: "landing_page", label: "Landing page" },
  { key: "referrer", label: "Referring site" },
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
    timezone: subscriber.timezone,
    device: subscriber.device,
    device_type: subscriber.deviceType,
    source: subscriber.utmSource,
    utm_medium: subscriber.utmMedium,
    utm_campaign: subscriber.utmCampaign,
    utm_term: subscriber.utmTerm,
    utm_content: subscriber.utmContent,
    landing_page: subscriber.landingPage,
    referrer: subscriber.referrer,
    points: subscriber.points ?? 0,
    referrals: extra.referralCount ?? 0,
    referral_code: subscriber.referralCode ?? "",
    referred_by: subscriber.referredBy?.[0]?.referredBy?.email ?? "",
    position: extra.position ?? "",
  };
  return columns.map((key) => csvCell(values[key])).join(",");
}
