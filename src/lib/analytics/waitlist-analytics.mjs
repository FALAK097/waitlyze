const MAX_DAYS = 90;

function validTimeZone(timeZone) {
  if (typeof timeZone !== "string" || timeZone.length > 64) throw new TypeError("Choose a valid time zone.");
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

const ratio = (numerator, denominator) => denominator === 0
  ? null
  : Math.round((numerator / denominator) * 10000) / 100;

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

function browserOf(userAgent) {
  const agent = String(userAgent || "");
  if (/Instagram/i.test(agent)) return "Instagram";
  if (/FBAN|FBAV/i.test(agent)) return "Facebook";
  if (/LinkedInApp/i.test(agent)) return "LinkedIn";
  if (/SamsungBrowser/i.test(agent)) return "Samsung Internet";
  if (/Edg(?:A|iOS)?\//i.test(agent)) return "Edge";
  if (/OPR\/|Opera/i.test(agent)) return "Opera";
  if (/Firefox\/|FxiOS\//i.test(agent)) return "Firefox";
  if (/CriOS\/|Chrome\//i.test(agent)) return "Chrome";
  if (/Safari\//i.test(agent)) return "Safari";
  return agent && agent !== "unknown" ? "Other" : "Unknown";
}

function operatingSystemOf(userAgent) {
  const agent = String(userAgent || "");
  if (/Windows NT/i.test(agent)) return "Windows";
  if (/iPad/i.test(agent)) return "iPadOS";
  if (/iPhone|iPod/i.test(agent)) return "iOS";
  if (/Android/i.test(agent)) return "Android";
  if (/CrOS/i.test(agent)) return "ChromeOS";
  if (/Macintosh|Mac OS X/i.test(agent)) return "macOS";
  if (/Linux/i.test(agent)) return "Linux";
  return agent && agent !== "unknown" ? "Other" : "Unknown";
}

function hostMatches(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

const SOCIAL_HOSTS = ["twitter.com", "x.com", "t.co", "reddit.com", "linkedin.com", "facebook.com", "instagram.com", "tiktok.com", "youtube.com"];
const SEARCH_HOST_PATTERN = /(^|\.)(google|bing|yahoo|duckduckgo|baidu|yandex|brave)(\.[a-z]{2,3})?\.[a-z]{2,}$/;
const SOCIAL_SOURCES = new Set(["twitter", "x", "x.com", "t.co", "reddit", "linkedin", "facebook", "instagram", "tiktok", "youtube"]);

function channelOf({ utmMedium, utmSource, referrer }) {
  const medium = String(utmMedium || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const source = String(utmSource || "").trim().toLowerCase();
  let host = "";
  try { host = referrer ? new URL(referrer).hostname.replace(/^www\./, "").toLowerCase() : ""; }
  catch { host = ""; }

  if (["cpc", "ppc", "paid_search", "paidsearch", "sem"].includes(medium)) return "Paid search";
  if (["paid_social", "paidsocial", "social_paid"].includes(medium)) return "Paid social";
  if (["email", "newsletter"].includes(medium)) return "Email";
  if (["affiliate", "partner"].includes(medium)) return "Affiliate";
  if (["display", "banner", "cpm", "programmatic"].includes(medium)) return "Display";
  if (["social", "social_network", "social_media", "organic_social"].includes(medium)) return "Organic social";
  if (["organic", "organic_search", "seo"].includes(medium)) return "Organic search";
  if (SOCIAL_SOURCES.has(source) || SOCIAL_HOSTS.some((domain) => hostMatches(host, domain))) return "Organic social";
  if (SEARCH_HOST_PATTERN.test(host)) return "Organic search";
  if (host) return "Referral";
  if (medium || source) return "Other";
  return "Direct";
}

export async function getWaitlistAnalytics(db, { waitListId, days = 30, endDate = null, timeZone = "UTC", now = new Date() }) {
  if (typeof waitListId !== "string" || !waitListId) throw new TypeError("Waitlist ID is required.");
  const rangeDays = validDays(days);
  const zone = validTimeZone(timeZone);
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())) throw new TypeError("Choose a valid end time.");
  const endDateParam = typeof endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : "";

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
      WHERE signup."waitListId" = ${waitListId}::text
        AND NOT EXISTS (
          SELECT 1 FROM "referrals" AS held_referral
          WHERE held_referral."signUpId" = signup."id"
            AND held_referral."reviewStatus" IN ('NEEDS_REVIEW', 'EXCLUDED')
        )
    ), visitor_daily AS (
      SELECT (impression."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE bounds.time_zone)::date AS local_date,
             COUNT(DISTINCT impression."uniqueUserId")::int AS visitors
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
        (SELECT COUNT(DISTINCT impression."uniqueUserId")::int
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
        (SELECT COUNT(DISTINCT impression."uniqueUserId")::int
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
  const countedSignupWhere = {
    waitListId,
    createdAt: inRange,
    referredBy: { none: { reviewStatus: { in: ["NEEDS_REVIEW", "EXCLUDED"] } } },
  };

  const [
    channelGroups,
    campaignGroups,
    referrerGroups,
    sourceGroups,
    countryGroups,
    regionGroups,
    cityGroups,
    deviceGroups,
    userAgentGroups,
    signupChannelGroups,
    signupCampaignGroups,
    signupReferrerGroups,
    signupSourceGroups,
    signupCountryGroups,
    signupCityGroups,
    signupDeviceGroups,
    signupUserAgentGroups,
    broadcasts,
    topReferrerRows,
    shareCount,
    linkVisitCount,
  ] = await Promise.all([
    db.impression.groupBy({ by: ["utmMedium", "utmSource", "referrer"], _count: { _all: true }, where: { waitListId, createdAt: inRange } }),
    db.impression.groupBy({ by: ["utmCampaign"], _count: { _all: true }, where: { waitListId, createdAt: inRange } }),
    db.impression.groupBy({ by: ["referrer"], _count: { _all: true }, where: { waitListId, createdAt: inRange } }),
    db.impression.groupBy({ by: ["utmSource"], _count: { _all: true }, where: { waitListId, createdAt: inRange } }),
    db.impression.groupBy({ by: ["country"], _count: { _all: true }, where: { waitListId, createdAt: inRange } }),
    db.impression.groupBy({ by: ["region", "country"], _count: { _all: true }, where: { waitListId, createdAt: inRange } }),
    db.impression.groupBy({ by: ["city", "country"], _count: { _all: true }, where: { waitListId, createdAt: inRange } }),
    db.impression.groupBy({ by: ["deviceType"], _count: { _all: true }, where: { waitListId, createdAt: inRange } }),
    db.impression.groupBy({ by: ["device"], _count: { _all: true }, where: { waitListId, createdAt: inRange } }),
    db.signUp.groupBy({ by: ["utmMedium", "utmSource", "referrer"], _count: { _all: true }, where: countedSignupWhere }),
    db.signUp.groupBy({ by: ["utmCampaign"], _count: { _all: true }, where: countedSignupWhere }),
    db.signUp.groupBy({ by: ["referrer"], _count: { _all: true }, where: countedSignupWhere }),
    db.signUp.groupBy({ by: ["utmSource"], _count: { _all: true }, where: countedSignupWhere }),
    db.signUp.groupBy({ by: ["country"], _count: { _all: true }, where: countedSignupWhere }),
    db.signUp.groupBy({ by: ["city", "country"], _count: { _all: true }, where: countedSignupWhere }),
    db.signUp.groupBy({ by: ["deviceType"], _count: { _all: true }, where: countedSignupWhere }),
    db.signUp.groupBy({ by: ["device"], _count: { _all: true }, where: countedSignupWhere }),
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
    db.impression.count({ where: { waitListId, landingPage: { contains: "r=" }, createdAt: inRange } }),
  ]);

  const emailStats = broadcasts.length
    ? await db.broadcastRecipient.groupBy({
        by: ["broadcastId", "status"],
        _count: { _all: true },
        where: { broadcastId: { in: broadcasts.map((broadcast) => broadcast.id) } },
      })
    : [];

  const rankCounts = (groups, label) => {
    const merged = new Map();
    for (const group of groups) {
      const key = label(group);
      merged.set(key, (merged.get(key) ?? 0) + group._count._all);
    }
    return merged;
  };
  const rank = (visitorGroups, signupGroups, label, limit = 5) => {
    const visitorCounts = rankCounts(visitorGroups, label);
    const signupCounts = rankCounts(signupGroups, label);
    const labels = new Set([...visitorCounts.keys(), ...signupCounts.keys()]);
    const visitorTotal = Array.from(visitorCounts.values()).reduce((sum, value) => sum + value, 0);
    const signupTotal = Array.from(signupCounts.values()).reduce((sum, value) => sum + value, 0);
    const rows = Array.from(labels, (rowLabel) => {
      const visitors = visitorCounts.get(rowLabel) ?? 0;
      const signups = signupCounts.get(rowLabel) ?? 0;
      return {
        label: rowLabel,
        visitors,
        signups,
        visitorsShare: visitorTotal === 0 ? 0 : Math.round((visitors / visitorTotal) * 1000) / 10,
        signupsShare: signupTotal === 0 ? 0 : Math.round((signups / signupTotal) * 1000) / 10,
      };
    });
    const byVisitors = [...rows].sort((a, b) => b.visitors - a.visitors || b.signups - a.signups).slice(0, limit);
    const bySignups = [...rows].sort((a, b) => b.signups - a.signups || b.visitors - a.visitors).slice(0, limit);
    return Array.from(new Map([...byVisitors, ...bySignups].map((row) => [row.label, row])).values());
  };
  const hostOf = (referrer) => {
    if (!referrer) return "Direct";
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, "");
      return host || "Direct";
    } catch {
      return "Direct";
    }
  };

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
  const invitesPerSignup = signups === 0 ? null : Math.round((shares / signups) * 100) / 100;
  const shareConversion = linkVisits === 0 ? null : ratio(referred, linkVisits);
  const kFactor = invitesPerSignup == null
    ? null
    : invitesPerSignup === 0
      ? 0
      : shareConversion == null
        ? null
        : Math.round(invitesPerSignup * (shareConversion / 100) * 1000) / 1000;

  return {
    range: { days: rangeDays, timeZone: zone, startDate: toIsoDate(first?.start_date), endDate: toIsoDate(first?.end_date) },
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
      campaigns: rank(campaignGroups, signupCampaignGroups, (group) => group.utmCampaign || "No campaign"),
      referrers: rank(referrerGroups, signupReferrerGroups, (group) => hostOf(group.referrer)),
      sources: rank(sourceGroups, signupSourceGroups, (group) => group.utmSource || "No source"),
    },
    geo: {
      countries: rank(countryGroups, signupCountryGroups, (group) => group.country || "Unknown"),
      mapCountries: rank(countryGroups, signupCountryGroups, (group) => group.country || "Unknown", 250),
      regions: rank(regionGroups, [], (group) => [group.region || "Unknown region", group.country].filter(Boolean).join(", ")),
      cities: rank(cityGroups, signupCityGroups, (group) => [group.city || "Unknown city", group.country].filter(Boolean).join(", ")),
    },
    technology: {
      browsers: rank(userAgentGroups, signupUserAgentGroups, (group) => browserOf(group.device), 8),
      operatingSystems: rank(userAgentGroups, signupUserAgentGroups, (group) => operatingSystemOf(group.device), 8),
      devices: rank(deviceGroups, signupDeviceGroups, (group) => prettifyDevice(group.deviceType), 8),
    },
    emails: broadcasts.map((broadcast) => {
      const counts = { delivered: 0, failed: 0, total: 0 };
      for (const stat of emailStats) {
        if (stat.broadcastId !== broadcast.id) continue;
        counts.total += stat._count._all;
        if (stat.status === "DELIVERED") counts.delivered = stat._count._all;
        else if (["FAILED", "SKIPPED", "CANCELED"].includes(stat.status)) counts.failed += stat._count._all;
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
