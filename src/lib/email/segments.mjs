// Broadcast segment targeting (Phase 7b). Segments are always computed
// server-side from live signup data; the client only sends the segment key.

export const BROADCAST_SEGMENTS = {
  ALL: {
    label: "Everyone opted in",
    description: "Every verified subscriber who opted in to updates.",
  },
  TOP_REFERRERS: {
    label: "Top referrers",
    description: "Opted-in subscribers with at least one verified referral.",
  },
  INACTIVE: {
    label: "Inactive",
    description: "Opted in over 14 days ago with no verified referrals yet.",
  },
};

export function normalizeSegment(value) {
  return Object.hasOwn(BROADCAST_SEGMENTS, value) ? value : "ALL";
}

const VERIFIED_REFERRAL_EXISTS = `EXISTS (
  SELECT 1 FROM "referrals" r
  JOIN "sign_ups" referred ON referred."id" = r."signUpId"
  WHERE r."referredById" = s."id"
    AND r."reviewStatus" IN ('CLEAR', 'APPROVED')
    AND referred."waitListId" = s."waitListId"
    AND referred."verifiedAt" IS NOT NULL
)`;

// Static SQL predicates over the s (sign_ups) / w (wait_lists) aliases used
// by the broadcast audience queries. The segment key is allow-listed above,
// so these fragments contain no user input.
export function segmentVerifiedPredicate() {
  // Every broadcast targets verified signups only: email verification is the
  // confirm-your-address handshake, so unverified (possibly someone else's
  // typed-in) addresses must never receive founder-written marketing email.
  return `s."verifiedAt" IS NOT NULL`;
}

export function segmentExtraPredicate(segment, now = null) {
  switch (segment) {
    case "TOP_REFERRERS":
      return `AND ${VERIFIED_REFERRAL_EXISTS}`;
    case "INACTIVE": {
      const cutoffExpr =
        now instanceof Date && !Number.isNaN(now.valueOf())
          ? `julianday('${new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().replace("Z", "+00:00")}')`
          : `julianday('now', '-14 days')`;
      return `AND julianday(s."createdAt") < ${cutoffExpr} AND NOT ${VERIFIED_REFERRAL_EXISTS}`;
    }
    default:
      return "";
  }
}
