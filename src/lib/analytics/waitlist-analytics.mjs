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
           to_char(bounds.start_date, 'YYYY-MM-DD') AS start_date,
           to_char(bounds.end_date, 'YYYY-MM-DD') AS end_date
    FROM calendar
    CROSS JOIN period_summary
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

  return {
    range: { days: rangeDays, timeZone: zone, startDate: first?.start_date ?? null, endDate: first?.end_date ?? null },
    summary: {
      visitors,
      signups,
      verifiedSignups,
      pendingVerification: signups - verifiedSignups,
      convertedVisitors,
      eligibleReferrals,
      conversionRate: ratio(convertedVisitors, visitors),
      verificationRate: ratio(verifiedSignups, signups),
    },
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
