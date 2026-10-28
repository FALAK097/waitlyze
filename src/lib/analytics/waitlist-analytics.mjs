import { getCanonicalAttribution } from "@/utils/server/attribution.mjs";

const MAX_DAYS = 90;
const ANALYTICS_GROUPING_SET = Object.freeze({
  channel: 31,
  canonicalChannel: 30,
  campaign: 239,
  referrer: 223,
  canonicalReferrer: 222,
  source: 191,
  country: 247,
  region: 243,
  city: 245,
  deviceType: 254,
  browser: 512,
  operatingSystem: 513,
});
const ANALYTICS_GROUP_FIELDS = Object.freeze({
  channel: new Set(["utmMedium", "utmSource", "referrer", "attributionChannel"]),
  campaign: new Set(["utmCampaign"]),
  referrer: new Set(["referrer", "referrerHost"]),
  source: new Set(["utmSource"]),
  country: new Set(["country"]),
  region: new Set(["region", "country"]),
  city: new Set(["city", "country"]),
  deviceType: new Set(["deviceType"]),
  device: new Set(["device"]),
  browser: new Set(["device"]),
  operatingSystem: new Set(["device"]),
});
const ANALYTICS_GROUP_BY_ID = new Map(
  Object.entries(ANALYTICS_GROUPING_SET).map(([name, id]) => [
    id,
    name === "canonicalChannel" ? "channel" : name === "canonicalReferrer" ? "referrer" : name,
  ]),
);

function selectAnalyticsGroups(aggregateRows) {
  const groupedRows = Object.fromEntries(
    Object.keys(ANALYTICS_GROUP_FIELDS).map((group) => [group, []]),
  );
  for (const row of aggregateRows) {
    const group = ANALYTICS_GROUP_BY_ID.get(row.groupingSet);
    const fields = ANALYTICS_GROUP_FIELDS[group];
    if (!fields) throw new Error("Unexpected analytics grouping set.");
    for (const field of Object.keys(row)) {
      if (
        field !== "groupingSet" &&
        field !== "count" &&
        field !== "displayLabel" &&
        field !== "dimensionTotal" &&
        !fields.has(field)
      )
        delete row[field];
    }
    row._count = { _all: number(row.count) };
    if (row.displayLabel != null) row._label = row.displayLabel;
    if (row.dimensionTotal != null) row._total = number(row.dimensionTotal);
    delete row.groupingSet;
    delete row.count;
    delete row.displayLabel;
    delete row.dimensionTotal;
    groupedRows[group].push(row);
  }
  return groupedRows;
}

function validTimeZone(timeZone) {
  if (typeof timeZone !== "string" || timeZone.length > 64)
    throw new TypeError("Choose a valid time zone.");
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
    return timeZone;
  } catch {
    throw new TypeError("Choose a valid time zone.");
  }
}

function validDays(days) {
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    throw new TypeError(`Choose a date range from 1 to ${MAX_DAYS} days.`);
  }
  return days;
}

const ratio = (numerator, denominator) =>
  denominator === 0 ? null : Math.round((numerator / denominator) * 10000) / 100;

const number = (value) => Number(value ?? 0);
const percentChange = (current, previous) => {
  if (current == null || previous == null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

function prettifyDevice(deviceType) {
  if (!deviceType) return "Unknown";
  return deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
}

function channelOf(attribution) {
  return attribution.attributionChannel ?? getCanonicalAttribution(attribution).attributionChannel;
}

/** Computes range metrics, breakdowns, referral totals, and K-factor for one waitlist. */
export async function getWaitlistAnalytics(
  db,
  { waitListId, days = 30, endDate = null, timeZone = "UTC", now = new Date() },
) {
  if (typeof waitListId !== "string" || !waitListId)
    throw new TypeError("Waitlist ID is required.");
  const rangeDays = validDays(days);
  const zone = validTimeZone(timeZone);
  if (!(now instanceof Date) || Number.isNaN(now.valueOf()))
    throw new TypeError("Choose a valid end time.");
  const endDateParam =
    typeof endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : "";

  const rows = await db.$queryRaw`
    WITH period AS (
      SELECT ${waitListId}::text AS wait_list_id,
             ${zone}::text AS time_zone,
             ${now}::timestamptz AS now_at,
             COALESCE(NULLIF(${endDateParam}, '')::date,
                   date_trunc('day', ${now}::timestamptz AT TIME ZONE ${zone})::date) AS end_date,
             ${rangeDays}::int AS day_count
    ), bounds AS (
      SELECT wait_list_id, time_zone, day_count,
             end_date - (day_count - 1) AS start_date,
             end_date,
             ((end_date - (day_count - 1))::timestamp AT TIME ZONE time_zone AT TIME ZONE 'UTC') AS start_utc,
             ((end_date + 1)::timestamp AT TIME ZONE time_zone AT TIME ZONE 'UTC') AS end_utc,
             ((end_date - (day_count * 2 - 1))::timestamp AT TIME ZONE time_zone AT TIME ZONE 'UTC') AS previous_start_utc
      FROM period
    ), calendar AS (
      SELECT generate_series(start_date, end_date, interval '1 day')::date AS local_date
      FROM bounds
    ), signup_base AS (
      SELECT signup.*
      FROM "sign_ups" AS signup
      CROSS JOIN bounds
      WHERE signup."waitListId" = bounds.wait_list_id
        AND signup."createdAt" >= bounds.previous_start_utc
        AND signup."createdAt" < bounds.end_utc
        AND NOT EXISTS (
          SELECT 1 FROM "referrals" AS held_referral
          WHERE held_referral."signUpId" = signup."id"
            AND held_referral."reviewStatus" IN ('NEEDS_REVIEW', 'EXCLUDED')
        )
    ), visitor_daily AS (
      -- The waitlist/user unique index makes row counts equal distinct visitors.
      SELECT (impression."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE bounds.time_zone)::date AS local_date,
             COUNT(*)::int AS visitors
      FROM "impressions" AS impression
      CROSS JOIN bounds
      WHERE impression."waitListId" = bounds.wait_list_id
        AND impression."uniqueUserId" <> ''
        AND impression."createdAt" >= bounds.start_utc
        AND impression."createdAt" < bounds.end_utc
      GROUP BY 1
    ), signup_daily AS (
      SELECT (signup."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE bounds.time_zone)::date AS local_date,
             COUNT(*)::int AS signups,
             COUNT(*) FILTER (WHERE signup."verifiedAt" IS NOT NULL)::int AS verified_signups
      FROM signup_base AS signup
      CROSS JOIN bounds
      WHERE signup."createdAt" >= bounds.start_utc
        AND signup."createdAt" < bounds.end_utc
      GROUP BY 1
    ), converted_daily AS (
      SELECT (signup."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE bounds.time_zone)::date AS local_date,
             COUNT(DISTINCT impression."uniqueUserId")::int AS converted_visitors
      FROM signup_base AS signup
      INNER JOIN "impressions" AS impression
        ON impression."id" = signup."impressionId"
       AND impression."waitListId" = signup."waitListId"
      CROSS JOIN bounds
      WHERE signup."waitListId" = bounds.wait_list_id
        AND signup."createdAt" >= bounds.start_utc
        AND signup."createdAt" < bounds.end_utc
        AND impression."createdAt" >= bounds.start_utc
        AND impression."createdAt" < bounds.end_utc
        AND impression."createdAt" <= signup."createdAt"
        AND impression."uniqueUserId" <> ''
      GROUP BY 1
    ), referral_period AS (
      SELECT (SELECT COUNT(*)::int
              FROM "referrals" AS referral
              INNER JOIN "sign_ups" AS referred ON referred."id" = referral."signUpId"
              CROSS JOIN bounds
              WHERE referred."waitListId" = bounds.wait_list_id
                AND referral."referredById" IS NOT NULL
                AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
                AND referred."createdAt" >= bounds.start_utc
                AND referred."createdAt" < bounds.end_utc) AS referred,
             (SELECT COUNT(DISTINCT referral."referredById")::int
              FROM "referrals" AS referral
              INNER JOIN "sign_ups" AS referred ON referred."id" = referral."signUpId"
              CROSS JOIN bounds
              WHERE referred."waitListId" = bounds.wait_list_id
                AND referral."referredById" IS NOT NULL
                AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
                AND referred."createdAt" >= bounds.start_utc
                AND referred."createdAt" < bounds.end_utc) AS referrers,
             (SELECT COUNT(*)::int
              FROM "sign_ups" AS held_signup
              CROSS JOIN bounds
              WHERE held_signup."waitListId" = bounds.wait_list_id
                AND held_signup."createdAt" >= bounds.start_utc
                AND held_signup."createdAt" < bounds.end_utc
                AND EXISTS (
                  SELECT 1 FROM "referrals" AS held_referral
                  WHERE held_referral."signUpId" = held_signup."id"
                    AND held_referral."reviewStatus" IN ('NEEDS_REVIEW', 'EXCLUDED')
                )) AS held
    ), points_period AS (
      SELECT COALESCE(SUM(ledger.points) FILTER (WHERE ledger.kind = 'SIGNUP_VERIFIED'), 0)::int AS signup_points,
             COALESCE(SUM(ledger.points) FILTER (WHERE ledger.kind = 'REFERRAL_CREDIT'), 0)::int AS referral_points
      FROM "point_ledger" AS ledger
      CROSS JOIN bounds
      WHERE ledger."waitListId" = bounds.wait_list_id
        AND ledger."createdAt" >= bounds.start_utc
        AND ledger."createdAt" < bounds.end_utc
    ), period_summary AS (
      SELECT
        (SELECT COUNT(*)::int
         FROM "impressions" AS impression CROSS JOIN bounds
         WHERE impression."waitListId" = bounds.wait_list_id
           AND impression."uniqueUserId" <> ''
           AND impression."createdAt" >= bounds.start_utc
           AND impression."createdAt" < bounds.end_utc) AS visitors,
        (SELECT COUNT(*)::int FROM signup_base AS signup CROSS JOIN bounds
         WHERE signup."waitListId" = bounds.wait_list_id
           AND signup."createdAt" >= bounds.start_utc
           AND signup."createdAt" < bounds.end_utc) AS signups,
        (SELECT COUNT(*) FILTER (WHERE signup."verifiedAt" IS NOT NULL)::int
         FROM signup_base AS signup CROSS JOIN bounds
         WHERE signup."waitListId" = bounds.wait_list_id
           AND signup."createdAt" >= bounds.start_utc
           AND signup."createdAt" < bounds.end_utc) AS verified_signups,
        (SELECT COUNT(DISTINCT impression."uniqueUserId")::int
         FROM signup_base AS signup
          INNER JOIN "impressions" AS impression
           ON impression."id" = signup."impressionId"
          AND impression."waitListId" = signup."waitListId"
         CROSS JOIN bounds
         WHERE signup."waitListId" = bounds.wait_list_id
           AND signup."createdAt" >= bounds.start_utc
           AND signup."createdAt" < bounds.end_utc
           AND impression."createdAt" >= bounds.start_utc
           AND impression."createdAt" < bounds.end_utc
           AND impression."createdAt" <= signup."createdAt"
           AND impression."uniqueUserId" <> '') AS converted_visitors
    ), previous_summary AS (
      SELECT
        (SELECT COUNT(*)::int
         FROM "impressions" AS impression CROSS JOIN bounds
         WHERE impression."waitListId" = bounds.wait_list_id
           AND impression."uniqueUserId" <> ''
           AND impression."createdAt" >= bounds.previous_start_utc
           AND impression."createdAt" < bounds.start_utc) AS visitors,
        (SELECT COUNT(*)::int FROM signup_base AS signup CROSS JOIN bounds
         WHERE signup."waitListId" = bounds.wait_list_id
           AND signup."createdAt" >= bounds.previous_start_utc
           AND signup."createdAt" < bounds.start_utc) AS signups,
        (SELECT COUNT(*) FILTER (WHERE signup."verifiedAt" IS NOT NULL)::int
         FROM signup_base AS signup CROSS JOIN bounds
         WHERE signup."waitListId" = bounds.wait_list_id
           AND signup."createdAt" >= bounds.previous_start_utc
           AND signup."createdAt" < bounds.start_utc) AS verified_signups,
        (SELECT COUNT(DISTINCT impression."uniqueUserId")::int
         FROM signup_base AS signup
          INNER JOIN "impressions" AS impression
           ON impression."id" = signup."impressionId"
          AND impression."waitListId" = signup."waitListId"
         CROSS JOIN bounds
         WHERE signup."waitListId" = bounds.wait_list_id
           AND signup."createdAt" >= bounds.previous_start_utc
           AND signup."createdAt" < bounds.start_utc
           AND impression."createdAt" >= bounds.previous_start_utc
           AND impression."createdAt" < bounds.start_utc
           AND impression."createdAt" <= signup."createdAt"
           AND impression."uniqueUserId" <> '') AS converted_visitors
    )
    SELECT to_char(calendar.local_date, 'YYYY-MM-DD') AS date,
           COALESCE(visitor_daily.visitors, 0)::int AS visitors,
           COALESCE(signup_daily.signups, 0)::int AS signups,
           COALESCE(signup_daily.verified_signups, 0)::int AS verified_signups,
           COALESCE(converted_daily.converted_visitors, 0)::int AS converted_visitors,
           period_summary.visitors AS period_visitors,
           period_summary.signups AS period_signups,
           period_summary.verified_signups AS period_verified_signups,
            period_summary.converted_visitors AS period_converted_visitors,
            previous_summary.visitors AS previous_visitors,
            previous_summary.signups AS previous_signups,
            previous_summary.verified_signups AS previous_verified_signups,
             previous_summary.converted_visitors AS previous_converted_visitors,
             referral_period.referred AS period_referred,
             referral_period.referrers AS period_referrers,
             referral_period.held AS period_held,
             points_period.signup_points AS points_signup,
             points_period.referral_points AS points_referral,
             to_char(bounds.start_date, 'YYYY-MM-DD') AS start_date,
             to_char(bounds.end_date, 'YYYY-MM-DD') AS end_date,
             bounds.start_utc AS start_utc,
             bounds.end_utc AS end_utc
      FROM calendar
      CROSS JOIN period_summary
      CROSS JOIN previous_summary
      CROSS JOIN referral_period
      CROSS JOIN points_period
     CROSS JOIN bounds
     LEFT JOIN visitor_daily ON visitor_daily.local_date = calendar.local_date
     LEFT JOIN signup_daily ON signup_daily.local_date = calendar.local_date
     LEFT JOIN converted_daily ON converted_daily.local_date = calendar.local_date
     ORDER BY calendar.local_date
  `;

  const first = rows[0];
  const visitors = number(first?.period_visitors);
  const signups = number(first?.period_signups);
  const verifiedSignups = number(first?.period_verified_signups);
  const convertedVisitors = number(first?.period_converted_visitors);
  const conversionRate = ratio(convertedVisitors, visitors);
  const verificationRate = ratio(verifiedSignups, signups);
  const previousVisitors = number(first?.previous_visitors);
  const previousSignups = number(first?.previous_signups);
  const previousVerifiedSignups = number(first?.previous_verified_signups);
  const previousConvertedVisitors = number(first?.previous_converted_visitors);
  const previousConversionRate = ratio(previousConvertedVisitors, previousVisitors);
  const previousVerificationRate = ratio(previousVerifiedSignups, previousSignups);

  const startUtc = first?.start_utc instanceof Date ? first.start_utc : new Date(first?.start_utc);
  const endUtc = first?.end_utc instanceof Date ? first.end_utc : new Date(first?.end_utc);
  const inRange = { gte: startUtc, lt: endUtc };
  const [
    impressionAggregateRows,
    signupAggregateRows,
    broadcasts,
    topReferrerRows,
    shareCount,
    linkVisitCount,
  ] = await Promise.all([
    db.$queryRaw`
      WITH source AS (
        SELECT impression."utmMedium", impression."utmSource", impression."referrer",
               impression."attributionChannel", impression."referrerHost",
               impression."utmCampaign", impression."country", impression."region",
               impression."city", impression."deviceType",
               CASE
                 WHEN impression."device" ~* 'Instagram' THEN 'Instagram'
                 WHEN impression."device" ~* 'FBAN|FBAV' THEN 'Facebook'
                 WHEN impression."device" ~* 'LinkedInApp' THEN 'LinkedIn'
                 WHEN impression."device" ~* 'SamsungBrowser' THEN 'Samsung Internet'
                 WHEN impression."device" ~* 'Edg(A|iOS)?/' THEN 'Edge'
                 WHEN impression."device" ~* 'OPR/|Opera' THEN 'Opera'
                 WHEN impression."device" ~* 'Firefox/|FxiOS/' THEN 'Firefox'
                 WHEN impression."device" ~* 'CriOS/|Chrome/' THEN 'Chrome'
                 WHEN impression."device" ~* 'Safari/' THEN 'Safari'
                 WHEN COALESCE(impression."device", '') <> '' AND impression."device" <> 'unknown' THEN 'Other'
                 ELSE 'Unknown'
               END AS "browser",
               CASE
                 WHEN impression."device" ~* 'Windows NT' THEN 'Windows'
                 WHEN impression."device" ~* 'iPad' THEN 'iPadOS'
                 WHEN impression."device" ~* 'iPhone|iPod' THEN 'iOS'
                 WHEN impression."device" ~* 'Android' THEN 'Android'
                 WHEN impression."device" ~* 'CrOS' THEN 'ChromeOS'
                 WHEN impression."device" ~* 'Macintosh|Mac OS X' THEN 'macOS'
                 WHEN impression."device" ~* 'Linux' THEN 'Linux'
                 WHEN COALESCE(impression."device", '') <> '' AND impression."device" <> 'unknown' THEN 'Other'
                 ELSE 'Unknown'
               END AS "operatingSystem"
        FROM "impressions" AS impression
        WHERE impression."waitListId" = ${waitListId}::text
          AND impression."createdAt" >= ${startUtc}::timestamptz
          AND impression."createdAt" < ${endUtc}::timestamptz
      ), grouped AS (
        SELECT CASE
                 WHEN GROUPING("browser") = 0 THEN 512
                 WHEN GROUPING("operatingSystem") = 0 THEN 513
                 WHEN GROUPING("utmCampaign") = 0 THEN 239
                 WHEN GROUPING("utmSource") = 0 THEN 191
                 WHEN GROUPING("country") = 0 AND GROUPING("region") = 1 AND GROUPING("city") = 1 THEN 247
                 WHEN GROUPING("region") = 0 AND GROUPING("city") = 1 THEN 243
                 WHEN GROUPING("city") = 0 THEN 245
                 WHEN GROUPING("deviceType") = 0 THEN 254
               END AS "groupingSet",
               NULL::text AS "utmMedium", "utmSource", NULL::text AS "referrer", "utmCampaign", "country",
               "region", "city", "deviceType", NULL::text AS "attributionChannel",
               NULL::text AS "referrerHost",
               CASE
                 WHEN GROUPING("browser") = 0 THEN "browser"
                 WHEN GROUPING("operatingSystem") = 0 THEN "operatingSystem"
               END AS "device",
               COUNT(*) AS "count"
        FROM source
        GROUP BY GROUPING SETS (
          ("utmCampaign"),
          ("utmSource"),
          ("country"),
          ("region", "country"),
          ("city", "country"),
          ("deviceType"),
          ("browser"),
          ("operatingSystem")
        )
        UNION ALL
        SELECT 31, "utmMedium", "utmSource", "referrer", NULL::text, NULL::text,
               NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
               COUNT(*)
        FROM source
        WHERE "attributionChannel" IS NULL
        GROUP BY "utmMedium", "utmSource", "referrer"
        UNION ALL
        SELECT 223, NULL::text, NULL::text, "referrer", NULL::text, NULL::text,
               NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
               COUNT(*)
        FROM source
        WHERE "attributionChannel" IS NULL
        GROUP BY "referrer"
        UNION ALL
        SELECT 30, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
               NULL::text, NULL::text, NULL::text, "attributionChannel", NULL::text,
               NULL::text, COUNT(*)
        FROM source
        WHERE "attributionChannel" IS NOT NULL
        GROUP BY "attributionChannel"
        UNION ALL
        SELECT 222, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
               NULL::text, NULL::text, NULL::text, NULL::text, "referrerHost",
               NULL::text, COUNT(*)
        FROM source
        WHERE "attributionChannel" IS NOT NULL
        GROUP BY "referrerHost"
      ), normalized AS (
        SELECT "groupingSet",
               CASE "groupingSet"
                 WHEN 30 THEN "attributionChannel"
                 WHEN 222 THEN COALESCE(NULLIF("referrerHost", ''), 'Direct')
                 WHEN 239 THEN COALESCE(NULLIF("utmCampaign", ''), 'No campaign')
                 WHEN 191 THEN COALESCE(NULLIF("utmSource", ''), 'No source')
                 WHEN 247 THEN COALESCE(NULLIF("country", ''), 'Unknown')
                 WHEN 243 THEN concat_ws(', ', COALESCE(NULLIF("region", ''), 'Unknown region'), NULLIF("country", ''))
                 WHEN 245 THEN concat_ws(', ', COALESCE(NULLIF("city", ''), 'Unknown city'), NULLIF("country", ''))
                 WHEN 254 THEN CASE WHEN COALESCE("deviceType", '') = '' THEN 'Unknown' ELSE upper(left("deviceType", 1)) || substr("deviceType", 2) END
               END AS "displayLabel",
               SUM("count") AS "count"
        FROM grouped
        WHERE "groupingSet" IN (30, 222, 239, 191, 247, 243, 245, 254)
        GROUP BY "groupingSet", 2
      ), ranked AS (
        SELECT normalized.*,
               SUM("count") OVER (PARTITION BY "groupingSet") AS "dimensionTotal",
               ROW_NUMBER() OVER (PARTITION BY "groupingSet" ORDER BY "count" DESC, "displayLabel" COLLATE "C" ASC) AS "rowNumber"
        FROM normalized
      )
      SELECT grouped.*, NULL::text AS "displayLabel", NULL::int AS "dimensionTotal"
      FROM grouped
      WHERE "groupingSet" NOT IN (30, 222, 239, 191, 247, 243, 245, 254, 512, 513)
        AND ("groupingSet" NOT IN (31, 223) OR "attributionChannel" IS NULL)
      UNION ALL
      SELECT ranked."groupingSet", NULL::text, NULL::text, NULL::text, NULL::text,
             NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
             NULL::text, NULL::text,
             ranked."count", ranked."displayLabel", ranked."dimensionTotal"
      FROM ranked
      WHERE ranked."rowNumber" <= CASE ranked."groupingSet" WHEN 254 THEN 8 WHEN 247 THEN 250 WHEN 30 THEN 8 WHEN 222 THEN 5 ELSE 5 END
        AND ranked."displayLabel" IS NOT NULL
      UNION ALL
      SELECT grouped."groupingSet", NULL::text, NULL::text, NULL::text, NULL::text,
             NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
             grouped."device",
             grouped."count", NULL::text AS "displayLabel",
             SUM(grouped."count") OVER (PARTITION BY grouped."groupingSet") AS "dimensionTotal"
      FROM grouped
      WHERE grouped."groupingSet" IN (512, 513)
    `,
    db.$queryRaw`
      WITH source AS (
        SELECT signup."utmMedium", signup."utmSource", signup."referrer",
               signup."attributionChannel", signup."referrerHost",
               signup."utmCampaign", signup."country", signup."region",
               signup."city", signup."deviceType",
               CASE
                 WHEN signup."device" ~* 'Instagram' THEN 'Instagram'
                 WHEN signup."device" ~* 'FBAN|FBAV' THEN 'Facebook'
                 WHEN signup."device" ~* 'LinkedInApp' THEN 'LinkedIn'
                 WHEN signup."device" ~* 'SamsungBrowser' THEN 'Samsung Internet'
                 WHEN signup."device" ~* 'Edg(A|iOS)?/' THEN 'Edge'
                 WHEN signup."device" ~* 'OPR/|Opera' THEN 'Opera'
                 WHEN signup."device" ~* 'Firefox/|FxiOS/' THEN 'Firefox'
                 WHEN signup."device" ~* 'CriOS/|Chrome/' THEN 'Chrome'
                 WHEN signup."device" ~* 'Safari/' THEN 'Safari'
                 WHEN COALESCE(signup."device", '') <> '' AND signup."device" <> 'unknown' THEN 'Other'
                 ELSE 'Unknown'
               END AS "browser",
               CASE
                 WHEN signup."device" ~* 'Windows NT' THEN 'Windows'
                 WHEN signup."device" ~* 'iPad' THEN 'iPadOS'
                 WHEN signup."device" ~* 'iPhone|iPod' THEN 'iOS'
                 WHEN signup."device" ~* 'Android' THEN 'Android'
                 WHEN signup."device" ~* 'CrOS' THEN 'ChromeOS'
                 WHEN signup."device" ~* 'Macintosh|Mac OS X' THEN 'macOS'
                 WHEN signup."device" ~* 'Linux' THEN 'Linux'
                 WHEN COALESCE(signup."device", '') <> '' AND signup."device" <> 'unknown' THEN 'Other'
                 ELSE 'Unknown'
               END AS "operatingSystem"
        FROM "sign_ups" AS signup
        WHERE signup."waitListId" = ${waitListId}::text
          AND signup."createdAt" >= ${startUtc}::timestamptz
          AND signup."createdAt" < ${endUtc}::timestamptz
          AND NOT EXISTS (
            SELECT 1 FROM "referrals" AS held_referral
            WHERE held_referral."signUpId" = signup."id"
              AND held_referral."reviewStatus" IN ('NEEDS_REVIEW', 'EXCLUDED')
          )
      ), grouped AS (
        SELECT CASE
                 WHEN GROUPING("browser") = 0 THEN 512
                 WHEN GROUPING("operatingSystem") = 0 THEN 513
                 WHEN GROUPING("utmCampaign") = 0 THEN 239
                 WHEN GROUPING("utmSource") = 0 THEN 191
                 WHEN GROUPING("country") = 0 AND GROUPING("city") = 1 THEN 247
                 WHEN GROUPING("city") = 0 THEN 245
                 WHEN GROUPING("deviceType") = 0 THEN 254
               END AS "groupingSet",
               NULL::text AS "utmMedium", "utmSource", NULL::text AS "referrer", "utmCampaign", "country",
               NULL::text AS "region", "city", "deviceType", NULL::text AS "attributionChannel",
               NULL::text AS "referrerHost",
               CASE
                 WHEN GROUPING("browser") = 0 THEN "browser"
                 WHEN GROUPING("operatingSystem") = 0 THEN "operatingSystem"
               END AS "device",
               COUNT(*) AS "count"
        FROM source
        GROUP BY GROUPING SETS (
          ("utmCampaign"),
          ("utmSource"),
          ("country"),
          ("city", "country"),
          ("deviceType"),
          ("browser"),
          ("operatingSystem")
        )
        UNION ALL
        SELECT 31, "utmMedium", "utmSource", "referrer", NULL::text, NULL::text,
               NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
               COUNT(*)
        FROM source
        WHERE "attributionChannel" IS NULL
        GROUP BY "utmMedium", "utmSource", "referrer"
        UNION ALL
        SELECT 223, NULL::text, NULL::text, "referrer", NULL::text, NULL::text,
               NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
               COUNT(*)
        FROM source
        WHERE "attributionChannel" IS NULL
        GROUP BY "referrer"
        UNION ALL
        SELECT 30, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
               NULL::text, NULL::text, NULL::text, "attributionChannel", NULL::text,
               NULL::text, COUNT(*)
        FROM source
        WHERE "attributionChannel" IS NOT NULL
        GROUP BY "attributionChannel"
        UNION ALL
        SELECT 222, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
               NULL::text, NULL::text, NULL::text, NULL::text, "referrerHost",
               NULL::text, COUNT(*)
        FROM source
        WHERE "attributionChannel" IS NOT NULL
        GROUP BY "referrerHost"
      ), normalized AS (
        SELECT "groupingSet",
               CASE "groupingSet"
                 WHEN 30 THEN "attributionChannel"
                 WHEN 222 THEN COALESCE(NULLIF("referrerHost", ''), 'Direct')
                 WHEN 239 THEN COALESCE(NULLIF("utmCampaign", ''), 'No campaign')
                 WHEN 191 THEN COALESCE(NULLIF("utmSource", ''), 'No source')
                 WHEN 247 THEN COALESCE(NULLIF("country", ''), 'Unknown')
                 WHEN 245 THEN concat_ws(', ', COALESCE(NULLIF("city", ''), 'Unknown city'), NULLIF("country", ''))
                 WHEN 254 THEN CASE WHEN COALESCE("deviceType", '') = '' THEN 'Unknown' ELSE upper(left("deviceType", 1)) || substr("deviceType", 2) END
               END AS "displayLabel",
               SUM("count") AS "count"
        FROM grouped
        WHERE "groupingSet" IN (30, 222, 239, 191, 247, 245, 254)
        GROUP BY "groupingSet", 2
      ), ranked AS (
        SELECT normalized.*,
               SUM("count") OVER (PARTITION BY "groupingSet") AS "dimensionTotal",
               ROW_NUMBER() OVER (PARTITION BY "groupingSet" ORDER BY "count" DESC, "displayLabel" COLLATE "C" ASC) AS "rowNumber"
        FROM normalized
      )
      SELECT grouped.*, NULL::text AS "displayLabel", NULL::int AS "dimensionTotal"
      FROM grouped
      WHERE "groupingSet" NOT IN (30, 222, 239, 191, 247, 245, 254, 512, 513)
        AND ("groupingSet" NOT IN (31, 223) OR "attributionChannel" IS NULL)
      UNION ALL
      SELECT ranked."groupingSet", NULL::text, NULL::text, NULL::text, NULL::text,
             NULL::text, NULL::text, NULL::text, NULL::text,
             NULL::text, NULL::text, NULL::text,
             ranked."count", ranked."displayLabel", ranked."dimensionTotal"
      FROM ranked
      WHERE ranked."rowNumber" <= CASE ranked."groupingSet" WHEN 254 THEN 8 WHEN 30 THEN 8 WHEN 222 THEN 5 ELSE 5 END
        AND ranked."displayLabel" IS NOT NULL
      UNION ALL
      SELECT grouped."groupingSet", NULL::text, NULL::text, NULL::text, NULL::text,
             NULL::text, NULL::text, NULL::text, NULL::text, NULL::text,
             NULL::text, grouped."device",
             grouped."count", NULL::text AS "displayLabel",
             SUM(grouped."count") OVER (PARTITION BY grouped."groupingSet") AS "dimensionTotal"
      FROM grouped
      WHERE grouped."groupingSet" IN (512, 513)
    `,
    db.marketingBroadcast.findMany({
      where: { waitListId, status: "SENT", sentAt: inRange },
      select: { id: true, name: true, sentAt: true },
      orderBy: { sentAt: "desc" },
      take: 5,
    }),
    db.$queryRaw`
      SELECT referral."referredById" AS id,
             referrer."email" AS email,
             COUNT(*)::int AS signups
      FROM "referrals" AS referral
      INNER JOIN "sign_ups" AS referred ON referred."id" = referral."signUpId"
      INNER JOIN "sign_ups" AS referrer ON referrer."id" = referral."referredById"
      WHERE referred."waitListId" = ${waitListId}::text
        AND referrer."waitListId" = ${waitListId}::text
        AND referral."referredById" IS NOT NULL
        AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
        AND referred."createdAt" >= ${startUtc}::timestamptz
        AND referred."createdAt" < ${endUtc}::timestamptz
      GROUP BY referral."referredById", referrer."email"
      ORDER BY COUNT(*) DESC, referrer."email" ASC
      LIMIT 5
    `,
    db.shareEvent.count({ where: { waitListId, createdAt: inRange } }),
    db.impression.count({
      where: {
        waitListId,
        createdAt: inRange,
        OR: [{ landingPage: { contains: "?r=" } }, { landingPage: { contains: "&r=" } }],
      },
    }),
  ]);

  const emailStats = broadcasts.length
    ? await db.broadcastRecipient.groupBy({
        by: ["broadcastId", "status"],
        _count: { _all: true },
        where: { broadcastId: { in: broadcasts.map((broadcast) => broadcast.id) } },
      })
    : [];

  const {
    channel: channelGroups,
    campaign: campaignGroups,
    referrer: referrerGroups,
    source: sourceGroups,
    country: countryGroups,
    region: regionGroups,
    city: cityGroups,
    deviceType: deviceGroups,
    browser: browserGroups,
    operatingSystem: operatingSystemGroups,
  } = selectAnalyticsGroups(impressionAggregateRows);
  const {
    channel: signupChannelGroups,
    campaign: signupCampaignGroups,
    referrer: signupReferrerGroups,
    source: signupSourceGroups,
    country: signupCountryGroups,
    city: signupCityGroups,
    deviceType: signupDeviceGroups,
    browser: signupBrowserGroups,
    operatingSystem: signupOperatingSystemGroups,
  } = selectAnalyticsGroups(signupAggregateRows);

  const rankCounts = (groups, label) => {
    const merged = new Map();
    for (const group of groups) {
      const key = group._label ?? label(group);
      merged.set(key, (merged.get(key) ?? 0) + group._count._all);
    }
    return merged;
  };
  const rank = (visitorGroups, signupDimensionGroups, label, limit = 5) => {
    const visitorCounts = rankCounts(visitorGroups, label);
    const signupCounts = rankCounts(signupDimensionGroups, label);
    const labels = new Set([...visitorCounts.keys(), ...signupCounts.keys()]);
    const dimensionTotal = (groups) =>
      (groups.find((group) => group._total != null)?._total ?? 0) +
      groups
        .filter((group) => group._total == null)
        .reduce((sum, group) => sum + group._count._all, 0);
    const visitorTotal = dimensionTotal(visitorGroups);
    const signupTotal = dimensionTotal(signupDimensionGroups);
    const sqlBounded = visitorGroups.some((group) => group._label != null);
    const compareLabels = (left, right) => {
      const leftCodePoints = Array.from(left, (character) => character.codePointAt(0));
      const rightCodePoints = Array.from(right, (character) => character.codePointAt(0));
      const length = Math.min(leftCodePoints.length, rightCodePoints.length);
      for (let index = 0; index < length; index += 1) {
        if (leftCodePoints[index] !== rightCodePoints[index])
          return leftCodePoints[index] - rightCodePoints[index];
      }
      return leftCodePoints.length - rightCodePoints.length;
    };
    const rankedRows = Array.from(labels, (rowLabel) => {
      const visitorCount = visitorCounts.get(rowLabel) ?? 0;
      const signupCount = signupCounts.get(rowLabel) ?? 0;
      return {
        label: rowLabel,
        visitors: visitorCount,
        signups: signupCount,
        visitorsShare:
          visitorTotal === 0 ? 0 : Math.round((visitorCount / visitorTotal) * 1000) / 10,
        signupsShare: signupTotal === 0 ? 0 : Math.round((signupCount / signupTotal) * 1000) / 10,
      };
    });
    const byVisitors = [...rankedRows]
      // SQL uses label ASC for deterministic ties; preserve that tie-only clarification here.
      .sort(
        (a, b) =>
          b.visitors - a.visitors ||
          (sqlBounded ? compareLabels(a.label, b.label) : b.signups - a.signups),
      )
      .slice(0, limit);
    const bySignups =
      signupTotal === 0
        ? byVisitors
        : [...rankedRows]
            .sort(
              (a, b) =>
                b.signups - a.signups ||
                (sqlBounded ? compareLabels(a.label, b.label) : b.visitors - a.visitors),
            )
            .slice(0, limit);
    return Array.from(
      new Map([...byVisitors, ...bySignups].map((row) => [row.label, row])).values(),
    );
  };
  const hostOf = (attribution) =>
    attribution.referrerHost ?? getCanonicalAttribution(attribution).referrerHost ?? "Direct";

  const toIsoDate = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.valueOf()) ? null : date.toISOString().slice(0, 10);
  };

  const referred = number(first?.period_referred);
  const referrers = number(first?.period_referrers);
  const referrals = {
    referred,
    organic: Math.max(signups - referred, 0),
    share: ratio(referred, signups),
    referrers,
    perReferrer: referrers === 0 ? 0 : Math.round((referred / referrers) * 10) / 10,
    held: number(first?.period_held),
    top: topReferrerRows.map((row) => ({
      id: String(row.id),
      label: row.email || "Unknown",
      signups: number(row.signups),
      share: ratio(number(row.signups), referred),
    })),
  };

  const shares = number(shareCount);
  const linkVisits = number(linkVisitCount);
  const invitesPerSignup = signups === 0 ? null : shares / signups;
  const shareConversion = linkVisits === 0 ? null : ratio(referred, linkVisits);
  const kFactor =
    invitesPerSignup == null
      ? null
      : invitesPerSignup === 0
        ? 0
        : shareConversion == null
          ? null
          : Math.round(invitesPerSignup * (shareConversion / 100) * 1000) / 1000;

  return {
    range: {
      days: rangeDays,
      timeZone: zone,
      startDate: toIsoDate(first?.start_date),
      endDate: toIsoDate(first?.end_date),
    },
    summary: {
      visitors,
      signups,
      verifiedSignups,
      pendingVerification: signups - verifiedSignups,
      convertedVisitors,
      conversionRate,
      verificationRate,
      change: {
        visitors: percentChange(visitors, previousVisitors),
        signups: percentChange(signups, previousSignups),
        conversionRate: percentChange(conversionRate, previousConversionRate),
        verificationRate: percentChange(verificationRate, previousVerificationRate),
      },
      pointsTotal: number(first?.points_signup) + number(first?.points_referral),
      pointsSignup: number(first?.points_signup),
      pointsReferral: number(first?.points_referral),
    },
    referrals,
    kFactor: { value: kFactor, invitesPerSignup, shareConversion, shares, linkVisits },
    sources: {
      channels: rank(channelGroups, signupChannelGroups, channelOf, 8),
      campaigns: rank(
        campaignGroups,
        signupCampaignGroups,
        (group) => group.utmCampaign || "No campaign",
      ),
      referrers: rank(referrerGroups, signupReferrerGroups, hostOf),
      sources: rank(sourceGroups, signupSourceGroups, (group) => group.utmSource || "No source"),
    },
    geo: {
      countries: rank(countryGroups, signupCountryGroups, (group) => group.country || "Unknown"),
      mapCountries: rank(
        countryGroups,
        signupCountryGroups,
        (group) => group.country || "Unknown",
        250,
      ),
      regions: rank(regionGroups, [], (group) =>
        [group.region || "Unknown region", group.country].filter(Boolean).join(", "),
      ),
      cities: rank(cityGroups, signupCityGroups, (group) =>
        [group.city || "Unknown city", group.country].filter(Boolean).join(", "),
      ),
    },
    technology: {
      browsers: rank(browserGroups, signupBrowserGroups, (group) => group.device, 8),
      operatingSystems: rank(
        operatingSystemGroups,
        signupOperatingSystemGroups,
        (group) => group.device,
        8,
      ),
      devices: rank(
        deviceGroups,
        signupDeviceGroups,
        (group) => prettifyDevice(group.deviceType),
        8,
      ),
    },
    emails: broadcasts.map((broadcast) => {
      const counts = { delivered: 0, failed: 0, total: 0 };
      for (const stat of emailStats) {
        if (stat.broadcastId !== broadcast.id) continue;
        counts.total += stat._count._all;
        if (stat.status === "DELIVERED") counts.delivered = stat._count._all;
        else if (["FAILED", "SKIPPED", "CANCELED"].includes(stat.status))
          counts.failed += stat._count._all;
      }
      return {
        id: broadcast.id,
        name: broadcast.name,
        sentAt: broadcast.sentAt?.toISOString() ?? null,
        delivered: counts.delivered,
        failed: counts.failed,
        total: counts.total,
        deliveredRate: ratio(counts.delivered, counts.total),
      };
    }),
    series: rows.map((row) => ({
      date: row.date,
      visitors: number(row.visitors),
      signups: number(row.signups),
      verifiedSignups: number(row.verified_signups),
      convertedVisitors: number(row.converted_visitors),
    })),
    caveats: [
      "Visitor identifiers represent browser storage, not people. Clearing storage or changing devices can count one person more than once.",
      "Conversion includes only signups linked to a stored impression; direct or legacy signups without that link remain in total signups but not converted visitors.",
      "Verification totals reflect current status. Later verification decisions can update historical cohorts.",
      "Ranges that end today may include only partial-day activity.",
      "Legacy records may predate the current deduplication and verification rules; use older periods as directional comparisons.",
      "Acquisition and geography breakdowns describe visitors with stored impression metadata; unknown values remain visible rather than being inferred.",
      "Signups held for fraud review or excluded by a reviewer are omitted from signup, verification, conversion, and breakdown totals until a reviewer approves them.",
      "Referral counts include only referred signups whose referral credit is clear or approved.",
    ],
  };
}
