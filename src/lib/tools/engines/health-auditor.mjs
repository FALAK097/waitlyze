import { normalizeSignupEmail } from "@/lib/normalize-email.mjs";

export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.org",
  "sharklasers.com",
  "grr.la",
  "yopmail.com",
  "yopmail.fr",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "tempmailo.com",
  "throwaway.email",
  "trashmail.com",
  "trashmail.net",
  "getnada.com",
  "nada.email",
  "maildrop.cc",
  "dispostable.com",
  "fakeinbox.com",
  "mohmal.com",
  "mintemail.com",
  "mailnesia.com",
  "mytemp.email",
  "burnermail.io",
  "tempail.com",
  "discard.email",
  "emailondeck.com",
  "getairmail.com",
  "harakirimail.com",
  "inboxbear.com",
  "jetable.org",
  "mailcatch.com",
  "mailnull.com",
  "mailsac.com",
  "mailexpire.com",
  "spamgourmet.com",
  "spambox.us",
  "spambog.com",
  "tempinbox.com",
  "tempmailaddress.com",
  "tmpmail.org",
  "tmpmail.net",
  "wegwerfmail.de",
  "0-mail.com",
  "33mail.com",
  "anonbox.net",
  "crazymailing.com",
  "dropmail.me",
  "e4ward.com",
  "filzmail.com",
  "gishpuppy.com",
  "incognitomail.org",
  "meltmail.com",
  "mt2015.com",
  "no-spam.ws",
  "nowmymail.com",
  "pookmail.com",
  "sneakemail.com",
  "tmail.ws",
]);

export const ROLE_LOCAL_PARTS = new Set([
  "admin",
  "administrator",
  "info",
  "support",
  "sales",
  "contact",
  "hello",
  "team",
  "office",
  "billing",
  "noreply",
  "no-reply",
  "postmaster",
  "webmaster",
  "hostmaster",
  "abuse",
  "security",
  "help",
  "marketing",
  "press",
  "test",
  "demo",
]);

export const SAMPLE_WAITLIST_CSV = [
  "email,created_at,verified,referred_by",
  "maya@linear-labs.io,2026-11-10T09:12:00Z,true,",
  "david.chen@acme.dev,2026-11-10T09:44:00Z,true,ref_maya",
  "priya.patel@northstar.co,2026-11-11T14:20:00Z,true,ref_maya",
  "alex.rivera@gmail.com,2026-11-12T11:05:00Z,true,",
  "alexrivera+1@gmail.com,2026-11-12T11:06:10Z,false,ref_alex",
  "alex.rivera+2@gmail.com,2026-11-12T11:06:35Z,false,ref_alex",
  "a.lexrivera+3@gmail.com,2026-11-12T11:07:02Z,false,ref_alex",
  "burner99@mailinator.com,2026-11-12T11:07:15Z,false,ref_alex",
  "bot01@yopmail.com,2026-11-12T11:07:22Z,false,ref_alex",
  "bot02@guerrillamail.com,2026-11-12T11:07:31Z,false,ref_alex",
  "sarah@vercel-team.org,2026-11-13T16:10:00Z,true,",
  "tom@foundry.app,2026-11-14T08:30:00Z,true,ref_sarah",
  "info@randomcorp.com,2026-11-14T10:00:00Z,false,",
  "admin@startup.io,2026-11-14T10:15:00Z,true,",
  "not-an-email-address,2026-11-14T12:00:00Z,false,",
  "elena@stripe-partner.dev,2026-11-15T09:00:00Z,true,",
  "kenji@cloudscale.jp,2026-11-15T13:20:00Z,true,ref_elena",
  "nina@designops.co,2026-11-16T10:40:00Z,true,",
  "omar@productcraft.io,2026-11-17T15:05:00Z,true,",
  "tempuser@10minutemail.com,2026-11-17T15:12:00Z,false,",
  "claire@signalworks.ai,2026-11-18T11:00:00Z,true,",
  "liam@metricsflow.com,2026-11-18T17:30:00Z,true,",
  "hannah@devportal.dev,2026-11-19T08:45:00Z,true,",
  "noah@launchdeck.co,2026-11-19T14:15:00Z,true,",
  "zoe@betaforge.io,2026-11-20T09:30:00Z,true,",
].join("\n");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function pickField(row, candidates) {
  for (const key of Object.keys(row)) {
    const lower = key.trim().toLowerCase();
    if (candidates.includes(lower)) return row[key];
  }
  return "";
}

function gradeFromScore(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function auditParsedRows(rows = []) {
  const validRows = Array.isArray(rows) ? rows.filter((r) => r && typeof r === "object") : [];
  const totalRows = validRows.length;
  if (totalRows === 0) {
    return null;
  }

  const canonicalGroups = new Map();
  const domainCounts = new Map();
  const refTimestamps = new Map();

  // First pass: collect referral burst windows
  const parsedItems = validRows.map((row, index) => {
    const rawEmail = String(
      pickField(row, ["email", "email_address", "subscriber", "address", "e-mail"]) || "",
    ).trim();
    const rawDate = String(
      pickField(row, ["created_at", "createdat", "timestamp", "date", "joined_at"]) || "",
    ).trim();
    const rawVerified = String(
      pickField(row, ["verified", "verified_at", "status", "confirmed"]) || "",
    )
      .trim()
      .toLowerCase();
    const rawRef = String(
      pickField(row, ["referred_by", "referral_code", "referrer", "ref"]) || "",
    ).trim();

    const ts = rawDate ? Date.parse(rawDate) : Number.NaN;
    if (rawRef && Number.isFinite(ts)) {
      if (!refTimestamps.has(rawRef)) refTimestamps.set(rawRef, []);
      refTimestamps.get(rawRef).push({ index, ts });
    }

    return { row, index, rawEmail, rawDate, ts, rawVerified, rawRef };
  });

  // Detect velocity bursts (>= 4 signups sharing the same referral code within 5 minutes)
  // Uses an O(n) two-pointer sliding window + high-water mark so large CSV files stay instant.
  const velocityFlaggedIndices = new Set();
  for (const entries of refTimestamps.values()) {
    entries.sort((a, b) => a.ts - b.ts);
    let right = 0;
    let markedUpTo = -1;
    for (let left = 0; left < entries.length; left += 1) {
      while (right < entries.length && entries[right].ts - entries[left].ts <= 5 * 60 * 1000) {
        right += 1;
      }
      if (right - left >= 4) {
        const start = Math.max(left, markedUpTo + 1);
        for (let k = start; k < right; k += 1) {
          velocityFlaggedIndices.add(entries[k].index);
        }
        markedUpTo = Math.max(markedUpTo, right - 1);
      }
    }
  }

  let invalidCount = 0;
  let disposableCount = 0;
  let duplicateAliasCount = 0;
  let roleCount = 0;
  let unverifiedCount = 0;
  let velocityBurstCount = 0;

  const cleanRows = [];
  const flaggedRows = [];
  const auditedItems = parsedItems.map((item) => {
    const reasons = [];
    const emailLower = item.rawEmail.toLowerCase();
    let canonical = null;

    if (!EMAIL_RE.test(emailLower)) {
      invalidCount += 1;
      reasons.push("Invalid email syntax");
    } else {
      const atIdx = emailLower.lastIndexOf("@");
      const localPart = emailLower.slice(0, atIdx);
      const domain = emailLower.slice(atIdx + 1);
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);

      canonical = normalizeSignupEmail(emailLower);
      if (!canonicalGroups.has(canonical)) canonicalGroups.set(canonical, []);
      canonicalGroups.get(canonical).push({ item, reasons });

      if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
        disposableCount += 1;
        reasons.push("Disposable / burner domain");
      }

      const baseLocal = localPart.split("+")[0];
      if (ROLE_LOCAL_PARTS.has(baseLocal)) {
        roleCount += 1;
        reasons.push("Role-based address");
      }
    }

    if (velocityFlaggedIndices.has(item.index)) {
      velocityBurstCount += 1;
      reasons.push("Suspicious referral velocity burst");
    }

    if (
      item.rawVerified === "false" ||
      item.rawVerified === "0" ||
      item.rawVerified === "unverified"
    ) {
      unverifiedCount += 1;
    }

    return { item, reasons };
  });

  for (const group of canonicalGroups.values()) {
    if (group.length < 2) continue;
    duplicateAliasCount += group.length - 1;
    const survivor = group.find(({ reasons }) => reasons.length === 0) || group[0];
    for (const candidate of group) {
      if (candidate === survivor) continue;
      const emailLower = candidate.item.rawEmail.toLowerCase();
      candidate.reasons.push(
        normalizeSignupEmail(emailLower) !== emailLower
          ? "Gmail dot/plus-alias self-referral duplicate"
          : "Duplicate email address",
      );
    }
  }

  for (const { item, reasons } of auditedItems) {
    if (reasons.length === 0) {
      cleanRows.push({
        ...item.row,
        email: item.rawEmail,
        joined_at: item.rawDate,
        verified: item.rawVerified || "unknown",
        audit_status: "clean",
        audit_reason: "",
      });
    } else {
      flaggedRows.push({
        ...item.row,
        email: item.rawEmail,
        joined_at: item.rawDate,
        verified: item.rawVerified || "unknown",
        audit_status: "flagged",
        audit_reason: reasons.join("; "),
      });
    }
  }

  const invalidPct = (invalidCount / totalRows) * 100;
  const disposablePct = (disposableCount / totalRows) * 100;
  const dupPct = (duplicateAliasCount / totalRows) * 100;
  const rolePct = (roleCount / totalRows) * 100;
  const velocityPct = (velocityBurstCount / totalRows) * 100;
  const unverifiedPct = (unverifiedCount / totalRows) * 100;

  const penalty =
    invalidPct * 1.6 +
    disposablePct * 1.8 +
    dupPct * 1.5 +
    rolePct * 0.6 +
    velocityPct * 1.2 +
    (unverifiedPct > 35 ? (unverifiedPct - 35) * 0.35 : 0);

  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  const band = score >= 85 ? "clean" : score >= 60 ? "moderate" : "high_risk";

  const topDomains = [...domainCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([domain, count]) => ({ domain, count }));

  const recommendations = [];
  if (disposableCount > 0) {
    recommendations.push(
      `Remove ${disposableCount} disposable-domain address(es) before broadcasting to avoid hard bounces.`,
    );
  }
  if (duplicateAliasCount > 0) {
    recommendations.push(
      `Deduplicate ${duplicateAliasCount} canonical/plus-alias collision(s); Waitlyze normalizes Gmail dot/+aliases automatically.`,
    );
  }
  if (velocityBurstCount > 0) {
    recommendations.push(
      `Enable Waitlyze STRICT fraud posture: detected ${velocityBurstCount} signups inside tight referral velocity bursts.`,
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Your list looks healthy. Keep double opt-in enabled when migrating to maintain deliverability.",
    );
  }

  return {
    mode: "csv",
    score,
    grade: gradeFromScore(score),
    band,
    totalRows,
    cleanCount: cleanRows.length,
    flaggedCount: flaggedRows.length,
    cleanPct: Math.round((cleanRows.length / totalRows) * 100),
    invalidCount,
    disposableCount,
    duplicateAliasCount,
    roleCount,
    velocityBurstCount,
    unverifiedCount,
    topDomains,
    recommendations,
    exportColumns: [...new Set(validRows.flatMap((row) => Object.keys(row)))].concat(
      ["email", "joined_at", "verified"].filter(
        (key) => !validRows.some((row) => Object.keys(row).includes(key)),
      ),
    ),
    cleanRows,
    flaggedRows,
  };
}

export function auditManualMetrics({
  totalSubscribers = 1500,
  verifiedPct = 68,
  disposableEstimatePct = 6,
  duplicateEstimatePct = 5,
  averageAgeDays = 45,
} = {}) {
  const total = Math.max(10, Math.round(Number(totalSubscribers) || 1500));
  const vPct = Math.max(0, Math.min(100, Number(verifiedPct) || 0));
  const dPct = Math.max(0, Math.min(60, Number(disposableEstimatePct) || 0));
  const dupPct = Math.max(0, Math.min(50, Number(duplicateEstimatePct) || 0));
  const age = Math.max(1, Math.min(365, Number(averageAgeDays) || 30));

  const decayPenalty = age > 60 ? Math.min(20, (age - 60) * 0.2) : 0;
  const unverifiedPenalty = vPct < 75 ? (75 - vPct) * 0.45 : 0;
  const score = Math.max(
    0,
    Math.min(100, Math.round(100 - dPct * 1.8 - dupPct * 1.4 - unverifiedPenalty - decayPenalty)),
  );
  const band = score >= 85 ? "clean" : score >= 60 ? "moderate" : "high_risk";
  const riskyPct = Math.min(95, Math.round(dPct + dupPct + Math.max(0, 100 - vPct) * 0.25));
  const cleanCount = Math.max(0, Math.round((total * (100 - riskyPct)) / 100));

  return {
    mode: "manual",
    score,
    grade: gradeFromScore(score),
    band,
    totalRows: total,
    cleanCount,
    flaggedCount: total - cleanCount,
    cleanPct: 100 - riskyPct,
    disposableCount: Math.round((total * dPct) / 100),
    duplicateAliasCount: Math.round((total * dupPct) / 100),
    velocityBurstCount: 0,
    recommendations: [
      vPct < 75
        ? "Run a gentle re-confirmation wave before launch day; unverified waitlists risk high bounce rates."
        : "Strong verification baseline; preserve double opt-in on new signups.",
      age > 60
        ? "List age exceeds 60 days. Send a short behind-the-scenes warm-up note before launching."
        : "List freshness is solid for launch-day conversion.",
      score < 85
        ? "Enable Waitlyze STRICT fraud mode to enforce IP & device velocity limits on referrals."
        : "Standard Waitlyze anti-abuse protections fit this campaign well.",
    ],
    cleanRows: [],
    flaggedRows: [],
  };
}
