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

// Benchmarks borrowed from public waitlist research (LaunchList ~11% median
// conversion; typical SaaS K-factor 0.1–0.5, self-sustaining at 1.0+).
const CONVERSION_BENCHMARKS = [
  { atLeast: 20, label: "Excellent", tone: "good" },
  { atLeast: 10, label: "Strong", tone: "good" },
  { atLeast: 5, label: "Typical", tone: "watch" },
  { atLeast: 0, label: "Needs work", tone: "bad" },
];
const KFACTOR_BENCHMARKS = [
  { atLeast: 1, label: "Self-sustaining", tone: "good" },
  { atLeast: 0.4, label: "Growing", tone: "good" },
  { atLeast: 0.1, label: "Early", tone: "watch" },
  { atLeast: 0, label: "Dormant", tone: "bad" },
];

function verdictFor(value, benchmarks) {
  if (value == null) return null;
  return benchmarks.find((benchmark) => value >= benchmark.atLeast) || null;
}

function prettifyDevice(deviceType) {
  if (!deviceType) return "Unknown";
  return deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
}

export async function getWaitlistAnalytics(db, { waitListId, days = 30, timeZone = "UTC", now = new Date() }) {
  if (typeof waitListId !== "string" || !waitListId) throw new TypeError("Waitlist ID is required.");
  const rangeDays = validDays(days);
  const zone = validTimeZone(timeZone);
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())) throw new TypeError("Choose a valid end time.");

  const rows = await db.$queryRaw`
    WITH period AS (
      SELECT ${waitListId}::text AS wait_list_id,
             ${zone}::text AS time_zone,
             ${now}::timestamptz AS now_at,
             date_trunc('day', ${now}::timestamptz AT TIME ZONE ${zone})::date AS end_date,
             ${rangeDays}::int AS day_count
    ), bounds AS (
      SELECT wait_list_id, time_zone,
             end_date - (day_count - 1) AS start_date,
             end_date,
             ((end_date - (day_count - 1))::timestamp AT TIME ZONE time_zone AT TIME ZONE 'UTC') AS start_utc,
             ((end_date + 1)::timestamp AT TIME ZONE time_zone AT TIME ZONE 'UTC') AS end_utc
      FROM period
    ), calendar AS (
      SELECT generate_series(start_date, end_date, interval '1 day')::date AS local_date
      FROM bounds
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
      FROM "sign_ups" AS signup
      CROSS JOIN bounds
      WHERE signup."waitListId" = bounds.wait_list_id
        AND signup."createdAt" >= bounds.start_utc
        AND signup."createdAt" < bounds.end_utc
      GROUP BY 1
    ), converted_daily AS (
      SELECT (signup."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE bounds.time_zone)::date AS local_date,
             COUNT(DISTINCT impression."uniqueUserId")::int AS converted_visitors
      FROM "sign_ups" AS signup
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
    ), referral_daily AS (
      SELECT (referred."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE bounds.time_zone)::date AS local_date,
             COUNT(*)::int AS eligible_referrals
      FROM "referrals" AS referral
      INNER JOIN "sign_ups" AS referred ON referred."id" = referral."signUpId"
      INNER JOIN "sign_ups" AS referrer
        ON referrer."id" = referral."referredById"
       AND referrer."waitListId" = referred."waitListId"
      INNER JOIN "wait_lists" AS waitlist
        ON waitlist."id" = referred."waitListId"
       AND waitlist."showReferrals" = true
      CROSS JOIN bounds
      WHERE referred."waitListId" = bounds.wait_list_id
        AND referred."createdAt" >= bounds.start_utc
        AND referred."createdAt" < bounds.end_utc
        AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
        AND referred."verifiedAt" IS NOT NULL
        AND referrer."verifiedAt" IS NOT NULL
        AND referral."referredById" IS NOT NULL
        AND referral."referredById" <> referral."signUpId"
      GROUP BY 1
    ), referred_cohort AS (
      SELECT referral."id" AS referral_id,
             referred."verifiedAt" IS NOT NULL AS is_verified,
             referred."id" AS signup_id
      FROM "referrals" AS referral
      INNER JOIN "sign_ups" AS referred ON referred."id" = referral."signUpId"
      INNER JOIN "wait_lists" AS waitlist
        ON waitlist."id" = referred."waitListId"
       AND waitlist."showReferrals" = true
      CROSS JOIN bounds
      WHERE referred."waitListId" = bounds.wait_list_id
        AND referred."createdAt" >= bounds.start_utc
        AND referred."createdAt" < bounds.end_utc
        AND referral."referredById" IS NOT NULL
        AND referral."referredById" <> referral."signUpId"
    ), sharers AS (
      SELECT DISTINCT referral."referredById" AS signup_id
      FROM "referrals" AS referral
      INNER JOIN "sign_ups" AS referred ON referred."id" = referral."signUpId"
      INNER JOIN "sign_ups" AS referrer
        ON referrer."id" = referral."referredById"
       AND referrer."waitListId" = referred."waitListId"
      CROSS JOIN bounds
      WHERE referred."waitListId" = bounds.wait_list_id
        AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
        AND referred."verifiedAt" IS NOT NULL
        AND referrer."verifiedAt" IS NOT NULL
        AND referral."referredById" IS NOT NULL
        AND referral."referredById" <> referral."signUpId"
    ), funnel_summary AS (
      SELECT (SELECT COUNT(*)::int FROM referred_cohort) AS referred,
             (SELECT COUNT(*)::int FROM referred_cohort WHERE is_verified) AS verified,
             (SELECT COUNT(DISTINCT referred_cohort.signup_id)::int
              FROM referred_cohort INNER JOIN sharers ON sharers.signup_id = referred_cohort.signup_id) AS shared_again
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
        (SELECT COUNT(*)::int FROM "sign_ups" AS signup CROSS JOIN bounds
         WHERE signup."waitListId" = bounds.wait_list_id
           AND signup."createdAt" >= bounds.start_utc
           AND signup."createdAt" < bounds.end_utc) AS signups,
        (SELECT COUNT(*) FILTER (WHERE signup."verifiedAt" IS NOT NULL)::int
         FROM "sign_ups" AS signup CROSS JOIN bounds
         WHERE signup."waitListId" = bounds.wait_list_id
           AND signup."createdAt" >= bounds.start_utc
           AND signup."createdAt" < bounds.end_utc) AS verified_signups,
        (SELECT COUNT(DISTINCT impression."uniqueUserId")::int
         FROM "sign_ups" AS signup
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
           AND impression."uniqueUserId" <> '') AS converted_visitors,
        (SELECT COALESCE(SUM(eligible_referrals), 0)::int FROM referral_daily) AS eligible_referrals
    )
    SELECT to_char(calendar.local_date, 'YYYY-MM-DD') AS date,
           COALESCE(visitor_daily.visitors, 0)::int AS visitors,
           COALESCE(signup_daily.signups, 0)::int AS signups,
           COALESCE(signup_daily.verified_signups, 0)::int AS verified_signups,
           COALESCE(converted_daily.converted_visitors, 0)::int AS converted_visitors,
           COALESCE(referral_daily.eligible_referrals, 0)::int AS eligible_referrals,
           period_summary.visitors AS period_visitors,
           period_summary.signups AS period_signups,
           period_summary.verified_signups AS period_verified_signups,
           period_summary.converted_visitors AS period_converted_visitors,
            period_summary.eligible_referrals AS period_eligible_referrals,
            funnel_summary.referred AS funnel_referred,
            funnel_summary.verified AS funnel_verified,
            funnel_summary.shared_again AS funnel_shared_again,
            points_period.signup_points AS points_signup,
            points_period.referral_points AS points_referral,
            to_char(bounds.start_date, 'YYYY-MM-DD') AS start_date,
            to_char(bounds.end_date, 'YYYY-MM-DD') AS end_date,
            bounds.start_utc AS start_utc,
            bounds.end_utc AS end_utc
     FROM calendar
     CROSS JOIN period_summary
     CROSS JOIN funnel_summary
     CROSS JOIN points_period
     CROSS JOIN bounds
    LEFT JOIN visitor_daily ON visitor_daily.local_date = calendar.local_date
    LEFT JOIN signup_daily ON signup_daily.local_date = calendar.local_date
    LEFT JOIN converted_daily ON converted_daily.local_date = calendar.local_date
    LEFT JOIN referral_daily ON referral_daily.local_date = calendar.local_date
    ORDER BY calendar.local_date
  `;

  const first = rows[0];
  const visitors = number(first?.period_visitors);
  const signups = number(first?.period_signups);
  const verifiedSignups = number(first?.period_verified_signups);
  const convertedVisitors = number(first?.period_converted_visitors);
  const eligibleReferrals = number(first?.period_eligible_referrals);
  const conversionRate = ratio(convertedVisitors, visitors);
  const verificationRate = ratio(verifiedSignups, signups);
  const kfactor = verifiedSignups === 0 ? null : Math.round((eligibleReferrals / verifiedSignups) * 100) / 100;

  const startUtc = first?.start_utc instanceof Date ? first.start_utc : new Date(first?.start_utc);
  const endUtc = first?.end_utc instanceof Date ? first.end_utc : new Date(first?.end_utc);
  const inRange = { gte: startUtc, lt: endUtc };

  const [
    topReferrerRows,
    utmGroups,
    referrerGroups,
    countryGroups,
    deviceGroups,
    broadcasts,
  ] = await Promise.all([
    db.$queryRaw`
      SELECT referrer."email" AS email, referrer."points" AS points, COUNT(*)::int AS referrals
      FROM "referrals" AS referral
      INNER JOIN "sign_ups" AS referred ON referred."id" = referral."signUpId"
      INNER JOIN "sign_ups" AS referrer ON referrer."id" = referral."referredById"
      INNER JOIN "wait_lists" AS waitlist ON waitlist."id" = referred."waitListId" AND waitlist."showReferrals" = true
      WHERE referred."waitListId" = ${waitListId}
        AND referred."createdAt" >= ${startUtc} AND referred."createdAt" < ${endUtc}
        AND referral."reviewStatus" IN ('CLEAR', 'APPROVED')
        AND referred."verifiedAt" IS NOT NULL AND referrer."verifiedAt" IS NOT NULL
        AND referral."referredById" IS NOT NULL AND referral."referredById" <> referral."signUpId"
      GROUP BY referrer."id", referrer."email", referrer."points"
      ORDER BY COUNT(*) DESC, referrer."email" ASC
      LIMIT 8`,
    db.signUp.groupBy({ by: ["utmSource"], _count: { _all: true }, where: { waitListId, createdAt: inRange } }),
    db.signUp.groupBy({ by: ["referrer"], _count: { _all: true }, where: { waitListId, createdAt: inRange } }),
    db.signUp.groupBy({ by: ["country"], _count: { _all: true }, where: { waitListId, createdAt: inRange } }),
    db.signUp.groupBy({ by: ["deviceType"], _count: { _all: true }, where: { waitListId, createdAt: inRange } }),
    db.marketingBroadcast.findMany({
      where: { waitListId, status: "SENT", sentAt: inRange },
      select: { id: true, name: true, sentAt: true },
      orderBy: { sentAt: "desc" },
      take: 5,
    }),
  ]);

  const emailStats = broadcasts.length
    ? await db.broadcastRecipient.groupBy({
        by: ["broadcastId", "status"],
        _count: { _all: true },
        where: { broadcastId: { in: broadcasts.map((broadcast) => broadcast.id) } },
      })
    : [];

  const rank = (groups, label) => {
    const total = groups.reduce((sum, group) => sum + group._count._all, 0);
    return groups
      .map((group) => ({ label: label(group), value: group._count._all }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((row) => ({ ...row, share: total === 0 ? 0 : Math.round((row.value / total) * 1000) / 10 }));
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

  return {
    range: { days: rangeDays, timeZone: zone, startDate: first?.start_date ?? null, endDate: first?.end_date ?? null },
    summary: {
      visitors,
      signups,
      verifiedSignups,
      pendingVerification: signups - verifiedSignups,
      convertedVisitors,
      eligibleReferrals,
      conversionRate,
      verificationRate,
      kfactor,
      conversionVerdict: verdictFor(conversionRate, CONVERSION_BENCHMARKS),
      kfactorVerdict: verdictFor(kfactor, KFACTOR_BENCHMARKS),
      pointsTotal: number(first?.points_signup) + number(first?.points_referral),
      pointsSignup: number(first?.points_signup),
      pointsReferral: number(first?.points_referral),
    },
    funnel: {
      referred: number(first?.funnel_referred),
      verified: number(first?.funnel_verified),
      sharedAgain: number(first?.funnel_shared_again),
    },
    topReferrers: topReferrerRows.map((row) => ({
      email: row.email,
      referrals: Number(row.referrals),
      points: Number(row.points ?? 0),
    })),
    sources: {
      utm: rank(utmGroups, (group) => group.utmSource || "Direct"),
      referrers: rank(referrerGroups, (group) => hostOf(group.referrer)),
    },
    geo: {
      countries: rank(countryGroups, (group) => group.country || "Unknown"),
      devices: rank(deviceGroups, (group) => prettifyDevice(group.deviceType)),
    },
    emails: broadcasts.map((broadcast) => {
      const counts = { DELIVERED: 0, FAILED: 0, total: 0 };
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
      eligibleReferrals: number(row.eligible_referrals),
    })),
    definitions: {
      visitors: "Distinct stored browser identifiers with at least one waitlist impression during the selected period. This is not a count of people.",
      signups: "Signup records created during the selected period, including those still awaiting email verification.",
      convertedVisitors: "Distinct visitor identifiers with a signup linked to an impression, where both records fall within the selected period.",
      conversionRate: "Converted visitors divided by distinct visitors in the selected period; unavailable when there are no visitors.",
      verificationRate: "Currently verified signup records created during the selected period divided by all signup records in that cohort; unavailable when there are no signups.",
      eligibleReferrals: "Referred signups created during the selected period where both addresses are verified, referrals are enabled, and review is clear or approved.",
      dailyVisitors: "Distinct visitor identifiers per local calendar day. A returning visitor can appear on multiple days, so daily counts do not sum to the period total.",
      kfactor: "Eligible referrals divided by verified signups in the selected period; 1.0 means every verified signup brings another. Unavailable without verified signups.",
      funnel: "Referred-in counts every referral link signup in the period; verified and shared-again are subsets using the same eligible rules.",
      points: "Points awarded by the referral engine during the selected period, split by signup and referral credit.",
      verdicts: "Conversion is weighed against an ~11% waitlist median (excellent at 20%+); K-factor against 1.0 self-sustaining. Benchmarks are directional, not targets.",
    },
    caveats: [
      "Visitor identifiers represent browser storage, not people. Clearing storage or changing devices can count one person more than once.",
      "Conversion includes only signups linked to a stored impression; direct or legacy signups without that link remain in total signups but not converted visitors.",
      "Verification and referral totals reflect current status. Later verification or review decisions can update historical cohorts.",
      "The end date is the current local calendar day and may contain only partial-day activity.",
      "Legacy records may predate the current deduplication and verification rules; use older periods as directional comparisons.",
      "Attribution sources are not consistently stored, so this endpoint does not claim channel performance.",
    ],
  };
}
