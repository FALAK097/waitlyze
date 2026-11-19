import { toSqliteIso } from "../db/sqlite-helpers.mjs";

const MAX_DAYS = 90;

function parseSqliteDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.valueOf()) ? null : value;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = raw.includes("T") ? raw : `${raw.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function getTimeZoneFormatter(timeZone, withTime = false) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime
      ? { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }
      : {}),
  });
}

function formatLocalDate(date, timeZone) {
  const parts = getTimeZoneFormatter(timeZone, false).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function localMidnightToUtc(dateStr, timeZone) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const formatter = getTimeZoneFormatter(timeZone, true);
  let utc = Date.UTC(year, month - 1, day, 0, 0, 0);
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = formatter.formatToParts(new Date(utc));
    const map = Object.fromEntries(parts.map((part) => [part.type, Number(part.value)]));
    const localAsUtc = Date.UTC(
      map.year,
      map.month - 1,
      map.day,
      map.hour === 24 ? 0 : map.hour,
      map.minute,
      map.second,
    );
    const targetAsUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
    utc += targetAsUtc - localAsUtc;
  }
  return new Date(utc);
}

function addDaysToIsoDate(dateStr, deltaDays) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + deltaDays)).toISOString().slice(0, 10);
}

function toGroupRows(rows) {
  return rows.map((row) => ({
    ...row,
    _count: { _all: number(row.count) },
  }));
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

const SOCIAL_HOSTS = [
  "twitter.com",
  "x.com",
  "t.co",
  "reddit.com",
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "youtube.com",
];
const SEARCH_HOST_PATTERN =
  /(^|\.)(google|bing|yahoo|duckduckgo|baidu|yandex|brave)(\.[a-z]{2,3})?\.[a-z]{2,}$/;
const SOCIAL_SOURCES = new Set([
  "twitter",
  "x",
  "x.com",
  "t.co",
  "reddit",
  "linkedin",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
]);

function channelOf({ utmMedium, utmSource, referrer }) {
  const medium = String(utmMedium || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const source = String(utmSource || "")
    .trim()
    .toLowerCase();
  let host = "";
  try {
    host = referrer ? new URL(referrer).hostname.replace(/^www\./, "").toLowerCase() : "";
  } catch {
    host = "";
  }

  if (["cpc", "ppc", "paid_search", "paidsearch", "sem"].includes(medium)) return "Paid search";
  if (["paid_social", "paidsocial", "social_paid"].includes(medium)) return "Paid social";
  if (["email", "newsletter"].includes(medium)) return "Email";
  if (["affiliate", "partner"].includes(medium)) return "Affiliate";
  if (["display", "banner", "cpm", "programmatic"].includes(medium)) return "Display";
  if (["social", "social_network", "social_media", "organic_social"].includes(medium))
    return "Organic social";
  if (["organic", "organic_search", "seo"].includes(medium)) return "Organic search";
  if (SOCIAL_SOURCES.has(source) || SOCIAL_HOSTS.some((domain) => hostMatches(host, domain)))
    return "Organic social";
  if (SEARCH_HOST_PATTERN.test(host)) return "Organic search";
  if (host) return "Referral";
  if (medium || source) return "Other";
  return "Direct";
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
  const resolvedEndDate =
    typeof endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(endDate)
      ? endDate
      : formatLocalDate(now, zone);

  const startDateStr = addDaysToIsoDate(resolvedEndDate, -(rangeDays - 1));
  const nextAfterEndStr = addDaysToIsoDate(resolvedEndDate, 1);
  const previousStartDateStr = addDaysToIsoDate(resolvedEndDate, -(rangeDays * 2 - 1));

  const startUtc = localMidnightToUtc(startDateStr, zone);
  const endUtc = localMidnightToUtc(nextAfterEndStr, zone);
  const previousStartUtc = localMidnightToUtc(previousStartDateStr, zone);

  const prevStartIso = toSqliteIso(previousStartUtc);
  const startIso = toSqliteIso(startUtc);
  const endIso = toSqliteIso(endUtc);
  const inRange = { gte: startUtc, lt: endUtc };

  const calendarDates = [];
  for (let i = 0; i < rangeDays; i += 1) {
    calendarDates.push(addDaysToIsoDate(startDateStr, i));
  }

  const [
    impressionWindowRows,
    signupWindowRows,
    referralPeriodRows,
    pointsPeriodRows,
    impressionSourceRows,
    impressionGeoRows,
    impressionTechRows,
    signupSourceRows,
    signupGeoRows,
    signupTechRows,
    broadcasts,
    topReferrerRows,
    shareCount,
    linkVisitCount,
  ] = await Promise.all([
    db.$queryRaw`
      SELECT "id", "uniqueUserId", "createdAt"
      FROM "impressions"
      WHERE "waitListId" = ${waitListId}
        AND "uniqueUserId" <> ''
        AND julianday("createdAt") >= julianday(${prevStartIso})
        AND julianday("createdAt") < julianday(${endIso})
    `,
    db.$queryRaw`
      SELECT signup."id", signup."createdAt", signup."verifiedAt", signup."impressionId",
             CASE WHEN EXISTS (
               SELECT 1 FROM "referrals" AS held_referral
               WHERE held_referral."signUpId" = signup."id"
                 AND held_referral."reviewStatus" IN ('NEEDS_REVIEW', 'EXCLUDED')
             ) THEN 1 ELSE 0 END AS is_held
      FROM "sign_ups" AS signup
      WHERE signup."waitListId" = ${waitListId}
        AND julianday(signup."createdAt") >= julianday(${prevStartIso})
        AND julianday(signup."createdAt") < julianday(${endIso})
    `,
    db.$queryRaw`
      SELECT
        (SELECT COUNT(*)
         FROM "referrals" AS referral
         INNER JOIN "sign_ups" AS referred ON referred."id" = referral."signUpId"
         WHERE referred."waitListId" = ${waitListId}
           AND referral."referredById" IS NOT NULL
           AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
           AND julianday(referred."createdAt") >= julianday(${startIso})
           AND julianday(referred."createdAt") < julianday(${endIso})) AS referred,
        (SELECT COUNT(DISTINCT referral."referredById")
         FROM "referrals" AS referral
         INNER JOIN "sign_ups" AS referred ON referred."id" = referral."signUpId"
         WHERE referred."waitListId" = ${waitListId}
           AND referral."referredById" IS NOT NULL
           AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
           AND julianday(referred."createdAt") >= julianday(${startIso})
           AND julianday(referred."createdAt") < julianday(${endIso})) AS referrers
    `,
    db.$queryRaw`
      SELECT
        COALESCE(SUM(CASE WHEN ledger."kind" = 'SIGNUP_VERIFIED' THEN ledger."points" ELSE 0 END), 0) AS signup_points,
        COALESCE(SUM(CASE WHEN ledger."kind" = 'REFERRAL_CREDIT' THEN ledger."points" ELSE 0 END), 0) AS referral_points
      FROM "point_ledger" AS ledger
      WHERE ledger."waitListId" = ${waitListId}
        AND julianday(ledger."createdAt") >= julianday(${startIso})
        AND julianday(ledger."createdAt") < julianday(${endIso})
    `,
    db.$queryRaw`
      SELECT "utmMedium", "utmSource", "utmCampaign", "referrer", COUNT(*) AS "count"
      FROM "impressions"
      WHERE "waitListId" = ${waitListId}
        AND julianday("createdAt") >= julianday(${startIso})
        AND julianday("createdAt") < julianday(${endIso})
      GROUP BY "utmMedium", "utmSource", "utmCampaign", "referrer"
    `,
    db.$queryRaw`
      SELECT "country", "region", "city", COUNT(*) AS "count"
      FROM "impressions"
      WHERE "waitListId" = ${waitListId}
        AND julianday("createdAt") >= julianday(${startIso})
        AND julianday("createdAt") < julianday(${endIso})
      GROUP BY "country", "region", "city"
    `,
    db.$queryRaw`
      SELECT "deviceType", "device", COUNT(*) AS "count"
      FROM "impressions"
      WHERE "waitListId" = ${waitListId}
        AND julianday("createdAt") >= julianday(${startIso})
        AND julianday("createdAt") < julianday(${endIso})
      GROUP BY "deviceType", "device"
    `,
    db.$queryRaw`
      SELECT "utmMedium", "utmSource", "utmCampaign", "referrer", COUNT(*) AS "count"
      FROM "sign_ups" AS signup
      WHERE signup."waitListId" = ${waitListId}
        AND julianday(signup."createdAt") >= julianday(${startIso})
        AND julianday(signup."createdAt") < julianday(${endIso})
        AND NOT EXISTS (
          SELECT 1 FROM "referrals" AS held_referral
          WHERE held_referral."signUpId" = signup."id"
            AND held_referral."reviewStatus" IN ('NEEDS_REVIEW', 'EXCLUDED')
        )
      GROUP BY "utmMedium", "utmSource", "utmCampaign", "referrer"
    `,
    db.$queryRaw`
      SELECT "country", "city", COUNT(*) AS "count"
      FROM "sign_ups" AS signup
      WHERE signup."waitListId" = ${waitListId}
        AND julianday(signup."createdAt") >= julianday(${startIso})
        AND julianday(signup."createdAt") < julianday(${endIso})
        AND NOT EXISTS (
          SELECT 1 FROM "referrals" AS held_referral
          WHERE held_referral."signUpId" = signup."id"
            AND held_referral."reviewStatus" IN ('NEEDS_REVIEW', 'EXCLUDED')
        )
      GROUP BY "country", "city"
    `,
    db.$queryRaw`
      SELECT "deviceType", "device", COUNT(*) AS "count"
      FROM "sign_ups" AS signup
      WHERE signup."waitListId" = ${waitListId}
        AND julianday(signup."createdAt") >= julianday(${startIso})
        AND julianday(signup."createdAt") < julianday(${endIso})
        AND NOT EXISTS (
          SELECT 1 FROM "referrals" AS held_referral
          WHERE held_referral."signUpId" = signup."id"
            AND held_referral."reviewStatus" IN ('NEEDS_REVIEW', 'EXCLUDED')
        )
      GROUP BY "deviceType", "device"
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
             COUNT(*) AS signups
      FROM "referrals" AS referral
      INNER JOIN "sign_ups" AS referred ON referred."id" = referral."signUpId"
      INNER JOIN "sign_ups" AS referrer ON referrer."id" = referral."referredById"
      WHERE referred."waitListId" = ${waitListId}
        AND referrer."waitListId" = ${waitListId}
        AND referral."referredById" IS NOT NULL
        AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
        AND julianday(referred."createdAt") >= julianday(${startIso})
        AND julianday(referred."createdAt") < julianday(${endIso})
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

  const startMs = startUtc.getTime();
  const endMs = endUtc.getTime();
  const prevStartMs = previousStartUtc.getTime();

  const dailyBuckets = new Map(
    calendarDates.map((date) => [
      date,
      {
        date,
        visitors: 0,
        signups: 0,
        verified_signups: 0,
        convertedVisitorIds: new Set(),
      },
    ]),
  );

  const impressionById = new Map();
  let visitors = 0;
  let previousVisitors = 0;
  for (const row of impressionWindowRows) {
    const created = parseSqliteDate(row.createdAt);
    if (!created) continue;
    const ms = created.getTime();
    impressionById.set(row.id, { uniqueUserId: row.uniqueUserId, ms });
    if (ms >= startMs && ms < endMs) {
      visitors += 1;
      const bucket = dailyBuckets.get(formatLocalDate(created, zone));
      if (bucket) bucket.visitors += 1;
    } else if (ms >= prevStartMs && ms < startMs) {
      previousVisitors += 1;
    }
  }

  let signups = 0;
  let verifiedSignups = 0;
  let previousSignups = 0;
  let previousVerifiedSignups = 0;
  let heldCount = 0;
  const convertedSet = new Set();
  const prevConvertedSet = new Set();

  for (const row of signupWindowRows) {
    const created = parseSqliteDate(row.createdAt);
    if (!created) continue;
    const ms = created.getTime();
    const isHeld = Number(row.is_held) === 1;
    if (isHeld) {
      if (ms >= startMs && ms < endMs) heldCount += 1;
      continue;
    }
    const isVerified = row.verifiedAt != null;
    const imp = row.impressionId ? impressionById.get(row.impressionId) : null;
    if (ms >= startMs && ms < endMs) {
      signups += 1;
      if (isVerified) verifiedSignups += 1;
      const bucket = dailyBuckets.get(formatLocalDate(created, zone));
      if (bucket) {
        bucket.signups += 1;
        if (isVerified) bucket.verified_signups += 1;
      }
      if (imp && imp.ms >= startMs && imp.ms < endMs && imp.ms <= ms) {
        convertedSet.add(imp.uniqueUserId);
        if (bucket) bucket.convertedVisitorIds.add(imp.uniqueUserId);
      }
    } else if (ms >= prevStartMs && ms < startMs) {
      previousSignups += 1;
      if (isVerified) previousVerifiedSignups += 1;
      if (imp && imp.ms >= prevStartMs && imp.ms < startMs && imp.ms <= ms) {
        prevConvertedSet.add(imp.uniqueUserId);
      }
    }
  }

  const convertedVisitors = convertedSet.size;
  const previousConvertedVisitors = prevConvertedSet.size;
  const conversionRate = ratio(convertedVisitors, visitors);
  const verificationRate = ratio(verifiedSignups, signups);
  const previousConversionRate = ratio(previousConvertedVisitors, previousVisitors);
  const previousVerificationRate = ratio(previousVerifiedSignups, previousSignups);

  const referralPeriod = referralPeriodRows?.[0] ?? {};
  const pointsPeriod = pointsPeriodRows?.[0] ?? {};
  const first = {
    period_referred: referralPeriod.referred,
    period_referrers: referralPeriod.referrers,
    period_held: heldCount,
    points_signup: pointsPeriod.signup_points,
    points_referral: pointsPeriod.referral_points,
    start_date: startDateStr,
    end_date: resolvedEndDate,
  };
  const rows = Array.from(dailyBuckets.values(), (bucket) => ({
    date: bucket.date,
    visitors: bucket.visitors,
    signups: bucket.signups,
    verified_signups: bucket.verified_signups,
    converted_visitors: bucket.convertedVisitorIds.size,
  }));

  const emailStats = broadcasts.length
    ? await db.broadcastRecipient.groupBy({
        by: ["broadcastId", "status"],
        _count: { _all: true },
        where: { broadcastId: { in: broadcasts.map((broadcast) => broadcast.id) } },
      })
    : [];

  const channelGroups = toGroupRows(impressionSourceRows);
  const campaignGroups = channelGroups;
  const referrerGroups = channelGroups;
  const sourceGroups = channelGroups;
  const countryGroups = toGroupRows(impressionGeoRows);
  const regionGroups = countryGroups;
  const cityGroups = countryGroups;
  const deviceGroups = toGroupRows(impressionTechRows);
  const userAgentGroups = deviceGroups;

  const signupChannelGroups = toGroupRows(signupSourceRows);
  const signupCampaignGroups = signupChannelGroups;
  const signupReferrerGroups = signupChannelGroups;
  const signupSourceGroups = signupChannelGroups;
  const signupCountryGroups = toGroupRows(signupGeoRows);
  const signupCityGroups = signupCountryGroups;
  const signupDeviceGroups = toGroupRows(signupTechRows);
  const signupUserAgentGroups = signupDeviceGroups;

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
    const visitorTotal =
      visitorGroups[0]?._total ??
      Array.from(visitorCounts.values()).reduce((sum, value) => sum + value, 0);
    const signupTotal =
      signupDimensionGroups[0]?._total ??
      Array.from(signupCounts.values()).reduce((sum, value) => sum + value, 0);
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
      referrers: rank(referrerGroups, signupReferrerGroups, (group) => hostOf(group.referrer)),
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
      browsers: rank(userAgentGroups, signupUserAgentGroups, (group) => browserOf(group.device), 8),
      operatingSystems: rank(
        userAgentGroups,
        signupUserAgentGroups,
        (group) => operatingSystemOf(group.device),
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
