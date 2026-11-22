export const COMMON_DKIM_SELECTORS = Object.freeze([
  { value: "resend", label: "resend (Resend)" },
  { value: "google", label: "google (Google Workspace)" },
  { value: "s1", label: "s1 (SendGrid / Mailgun)" },
  { value: "selector1", label: "selector1 (Microsoft 365)" },
  { value: "k1", label: "k1 (Mailchimp)" },
]);

const DOMAIN_RE = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function normalizeDomainInput(raw) {
  let cleaned = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!cleaned) return "";
  if (cleaned.includes("@")) {
    cleaned = cleaned.split("@").pop() || "";
  }
  cleaned = cleaned
    .replace(/^https?:\/\//, "")
    .split(/[/?#]/)[0]
    .replace(/:\d+$/, "");
  cleaned = cleaned.replace(/\.$/, "");
  if (
    !DOMAIN_RE.test(cleaned) ||
    cleaned === "localhost" ||
    cleaned.endsWith(".localhost") ||
    cleaned.endsWith(".local") ||
    cleaned.endsWith(".internal")
  ) {
    return "";
  }
  return cleaned;
}

function countSpfLookups(spfRecord) {
  const tokens = spfRecord.toLowerCase().split(/\s+/);
  let count = 0;
  for (const token of tokens) {
    if (
      token.startsWith("include:") ||
      token.startsWith("a:") ||
      token === "a" ||
      token.startsWith("mx:") ||
      token === "mx" ||
      token.startsWith("ptr") ||
      token.startsWith("exists:") ||
      token.startsWith("redirect=")
    ) {
      count += 1;
    }
  }
  return count;
}

function gradeFromScore(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function evaluateDnsRecords({
  domain,
  selector = "",
  txtRecords = [],
  dmarcRecords = [],
  mxRecords = [],
  dkimRecords = [],
}) {
  const spfRecords = txtRecords.filter((r) => /^v=spf1(\s|$)/i.test(r.trim()));
  let spfCheck;
  if (spfRecords.length === 0) {
    spfCheck = {
      id: "spf",
      name: "SPF (Sender Policy Framework)",
      status: "fail",
      points: 0,
      maxPoints: 30,
      rawRecord: "No v=spf1 TXT record found",
      summary: "Missing SPF record leaves your domain unprotected against sender spoofing.",
      remediation:
        "Publish a single TXT record on your sending domain authorizing your email provider.",
      copyableFix: `TXT @  v=spf1 include:amazonses.com ~all`,
    };
  } else if (spfRecords.length > 1) {
    spfCheck = {
      id: "spf",
      name: "SPF (Sender Policy Framework)",
      status: "fail",
      points: 5,
      maxPoints: 30,
      rawRecord: spfRecords.join("\n"),
      summary: `Found ${spfRecords.length} SPF records. RFC 7208 treats multiple v=spf1 records as a PermError.`,
      remediation: "Merge all include: mechanisms into a single TXT record and delete duplicates.",
      copyableFix: spfRecords[0],
    };
  } else {
    const spf = spfRecords[0];
    const lookups = countSpfLookups(spf);
    const hasHardOrSoftAll = /[-~]all\b/i.test(spf);
    const hasUnsafeAll = /\+all\b/i.test(spf);
    if (lookups > 10 || hasUnsafeAll) {
      spfCheck = {
        id: "spf",
        name: "SPF (Sender Policy Framework)",
        status: "warn",
        points: 15,
        maxPoints: 30,
        rawRecord: spf,
        summary: hasUnsafeAll
          ? "SPF ends with +all, allowing any server to spoof your domain."
          : `SPF contains ~${lookups} DNS lookup mechanisms (RFC 7208 hard limit is 10).`,
        remediation: hasUnsafeAll
          ? "Change +all to ~all or -all immediately."
          : "Prune unused providers or send launch broadcasts from a dedicated subdomain (e.g., mail." +
            domain +
            ").",
        copyableFix: `TXT mail.${domain}  v=spf1 include:amazonses.com ~all`,
      };
    } else {
      spfCheck = {
        id: "spf",
        name: "SPF (Sender Policy Framework)",
        status: hasHardOrSoftAll ? "pass" : "warn",
        points: hasHardOrSoftAll ? 30 : 24,
        maxPoints: 30,
        rawRecord: spf,
        summary: `Valid single SPF record (${lookups}/10 DNS lookups, ${hasHardOrSoftAll ? "enforced qualifier" : "neutral qualifier"}).`,
        remediation: hasHardOrSoftAll
          ? "No changes required—verify your transactional provider is included."
          : "Tighten the ending qualifier to ~all or -all.",
        copyableFix: "",
      };
    }
  }

  const validDmarc = dmarcRecords.find((r) => /^v=dmarc1\b/i.test(r.trim()));
  let dmarcCheck;
  if (!validDmarc) {
    dmarcCheck = {
      id: "dmarc",
      name: "DMARC (_dmarc policy)",
      status: "fail",
      points: 0,
      maxPoints: 30,
      rawRecord: `No TXT record at _dmarc.${domain}`,
      summary: "Missing DMARC record. Gmail and Yahoo require DMARC for bulk launch broadcasts.",
      remediation:
        "Publish a starter DMARC TXT record at _dmarc." + domain + " to enable alignment.",
      copyableFix: `TXT _dmarc.${domain}  v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`,
    };
  } else {
    const pMatch = validDmarc.match(/\bp\s*=\s*(none|quarantine|reject)/i);
    const policy = pMatch ? pMatch[1].toLowerCase() : "none";
    const hasRua = /\brua\s*=/i.test(validDmarc);
    const isEnforced = policy === "quarantine" || policy === "reject";
    dmarcCheck = {
      id: "dmarc",
      name: "DMARC (_dmarc policy)",
      status: isEnforced && hasRua ? "pass" : "warn",
      points: isEnforced ? (hasRua ? 30 : 26) : 18,
      maxPoints: 30,
      rawRecord: validDmarc,
      summary: `DMARC present with policy p=${policy}${hasRua ? " and aggregate reporting (rua)" : " (missing rua reporting tag)"}.`,
      remediation: isEnforced
        ? hasRua
          ? "Strong DMARC enforcement in place."
          : "Add rua=mailto:dmarc@" + domain + " so you receive alignment reports."
        : "After confirming SPF/DKIM pass in tests, upgrade p=none to p=quarantine or p=reject.",
      copyableFix: isEnforced
        ? ""
        : `TXT _dmarc.${domain}  v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`,
    };
  }

  const usableMxRecords = mxRecords.filter((record) => {
    const value = String(record).trim();
    const destination = value.replace(/^\d+\s+/, "").replace(/\.$/, "");
    return Boolean(destination) && destination !== "." && !/^0\s+\.$/.test(value);
  });
  const mxCheck =
    usableMxRecords.length > 0
      ? {
          id: "mx",
          name: "MX (Mail Exchange Routing)",
          status: "pass",
          points: 20,
          maxPoints: 20,
          rawRecord: usableMxRecords.slice(0, 4).join("\n"),
          summary: `${usableMxRecords.length} usable MX record(s) found for replies and bounce handling.`,
          remediation: "Mail routing is active.",
          copyableFix: "",
        }
      : {
          id: "mx",
          name: "MX (Mail Exchange Routing)",
          status: "fail",
          points: 0,
          maxPoints: 20,
          rawRecord: `No MX records found for ${domain}`,
          summary:
            "Domains without MX records are frequently scored as suspicious by spam filters.",
          remediation:
            "Configure valid MX records on your root domain (or verified Return-Path on your sending subdomain).",
          copyableFix: "",
        };

  let dkimCheck;
  if (!selector) {
    dkimCheck = {
      id: "dkim",
      name: "DKIM (DomainKeys Identified Mail)",
      status: "warn",
      points: 10,
      maxPoints: 20,
      rawRecord: "No DKIM selector entered (optional)",
      summary:
        "Enter your provider's DKIM selector (e.g., resend or google) to verify the public key record.",
      remediation:
        "When connecting Resend in Waitlyze Email settings, publish the exact DKIM TXT record Resend provides.",
      copyableFix: "",
    };
  } else {
    const validDkim = dkimRecords.find((record) => {
      const value = String(record);
      const publicKey = value.match(/(?:^|;)\s*p\s*=\s*([^;\s][^;]*)/i)?.[1]?.trim();
      const versionTag = value.match(/(?:^|;)\s*v\s*=\s*([^;]*)/i);
      const version = versionTag?.[1]?.trim();
      return (!versionTag || version?.toLowerCase() === "dkim1") && Boolean(publicKey);
    });
    dkimCheck = validDkim
      ? {
          id: "dkim",
          name: `DKIM (${selector}._domainkey)`,
          status: "pass",
          points: 20,
          maxPoints: 20,
          rawRecord: validDkim.slice(0, 180) + (validDkim.length > 180 ? "…" : ""),
          summary: `Public DKIM signing key found at ${selector}._domainkey.${domain}.`,
          remediation: "DKIM selector verified.",
          copyableFix: "",
        }
      : {
          id: "dkim",
          name: `DKIM (${selector}._domainkey)`,
          status: "fail",
          points: 0,
          maxPoints: 20,
          rawRecord: `No TXT record found at ${selector}._domainkey.${domain}`,
          summary: `Could not find a DKIM key for selector "${selector}".`,
          remediation:
            "Double-check your email provider's exact selector name or publish the DKIM TXT record from your Resend dashboard.",
          copyableFix: "",
        };
  }

  const checks = [spfCheck, dmarcCheck, mxCheck, dkimCheck];
  const score = checks.reduce((sum, c) => sum + c.points, 0);
  const band = score >= 85 ? "ready" : score >= 60 ? "needs_attention" : "high_risk";

  return {
    domain,
    selector,
    score,
    grade: gradeFromScore(score),
    band,
    checks,
    warmupChecklist: [
      "Connect and verify your Resend sending domain inside Waitlyze before enabling confirmations.",
      "Send verification emails first (high open & click engagement builds positive domain reputation).",
      "Use a dedicated subdomain (mail.yourdomain.com) if sending large launch-day broadcasts.",
      "Send launch broadcasts only to double-opt-in verified subscribers who explicitly consented.",
      "Include a clear one-click unsubscribe link (handled automatically by Waitlyze broadcasts).",
    ],
  };
}

export const SAMPLE_DNS_RESULT = evaluateDnsRecords({
  domain: "acme.example",
  selector: "resend",
  txtRecords: ["v=spf1 include:amazonses.com include:_spf.google.com ~all"],
  dmarcRecords: [],
  mxRecords: ["10 aspmx.l.google.com.", "20 alt1.aspmx.l.google.com."],
  dkimRecords: ["v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."],
});
