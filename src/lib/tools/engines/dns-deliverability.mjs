export const COMMON_DKIM_SELECTORS = Object.freeze([
  { value: "resend", label: "resend — Resend" },
  { value: "google", label: "google — Google Workspace" },
  { value: "s1", label: "s1 — SendGrid" },
  { value: "selector1", label: "selector1 — Microsoft 365" },
  { value: "k1", label: "k1 — Mailchimp" },
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
    const mechanism = token.replace(/^[+\-~?]/, "");
    if (/^include:/i.test(mechanism) || /^a(?:$|[:/])/i.test(mechanism)) {
      count += 1;
    } else if (/^mx(?:$|[:/])/i.test(mechanism)) {
      count += 1;
    } else if (/^ptr(?:$|:)/i.test(mechanism)) {
      count += 1;
    } else if (/^exists:/i.test(mechanism) || /^redirect=/i.test(mechanism)) {
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

const RSA_ENCRYPTION_OID = [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01];

function readDerTlv(bytes, offset, end) {
  if (offset >= end) return null;
  const tag = bytes[offset];
  let pos = offset + 1;
  if (pos >= end) return null;
  const firstLen = bytes[pos];
  pos += 1;
  let len = 0;
  if ((firstLen & 0x80) === 0) {
    len = firstLen;
  } else {
    const numOctets = firstLen & 0x7f;
    if (numOctets === 0 || numOctets > 4 || pos + numOctets > end) return null;
    for (let i = 0; i < numOctets; i += 1) {
      len = (len << 8) | bytes[pos];
      pos += 1;
    }
    if (len < 128) return null; // Non-canonical DER length
  }
  const valueEnd = pos + len;
  if (valueEnd > end) return null;
  return { tag, valueStart: pos, valueEnd, nextOffset: valueEnd };
}

function isValidRsaSpkiDer(bytes) {
  const outer = readDerTlv(bytes, 0, bytes.length);
  if (!outer || outer.tag !== 0x30 || outer.nextOffset !== bytes.length) return false;

  const algId = readDerTlv(bytes, outer.valueStart, outer.valueEnd);
  if (!algId || algId.tag !== 0x30) return false;

  const oid = readDerTlv(bytes, algId.valueStart, algId.valueEnd);
  if (!oid || oid.tag !== 0x06) return false;
  if (oid.valueEnd - oid.valueStart !== RSA_ENCRYPTION_OID.length) return false;
  for (let i = 0; i < RSA_ENCRYPTION_OID.length; i += 1) {
    if (bytes[oid.valueStart + i] !== RSA_ENCRYPTION_OID[i]) return false;
  }

  const bitString = readDerTlv(bytes, algId.nextOffset, outer.valueEnd);
  if (
    !bitString ||
    bitString.tag !== 0x03 ||
    bitString.nextOffset !== outer.valueEnd ||
    bitString.valueEnd - bitString.valueStart < 2 ||
    bytes[bitString.valueStart] !== 0x00
  ) {
    return false;
  }

  const rsaSeqStart = bitString.valueStart + 1;
  const rsaSeq = readDerTlv(bytes, rsaSeqStart, bitString.valueEnd);
  if (!rsaSeq || rsaSeq.tag !== 0x30 || rsaSeq.nextOffset !== bitString.valueEnd) return false;

  const modulus = readDerTlv(bytes, rsaSeq.valueStart, rsaSeq.valueEnd);
  if (!modulus || modulus.tag !== 0x02 || modulus.valueEnd <= modulus.valueStart) return false;
  if (bytes[modulus.valueStart] & 0x80) return false; // Must be non-negative DER INTEGER
  const modStart = bytes[modulus.valueStart] === 0x00 ? modulus.valueStart + 1 : modulus.valueStart;
  if (modulus.valueEnd - modStart < 128) return false; // Require >= 1024-bit RSA modulus

  const exponent = readDerTlv(bytes, modulus.nextOffset, rsaSeq.valueEnd);
  if (
    !exponent ||
    exponent.tag !== 0x02 ||
    exponent.nextOffset !== rsaSeq.valueEnd ||
    exponent.valueEnd <= exponent.valueStart ||
    (bytes[exponent.valueStart] & 0x80) !== 0
  ) {
    return false;
  }
  return true;
}

function isValidDkimPublicKey(record, publicKey) {
  const cleanKey = String(publicKey || "").replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleanKey) || cleanKey.length % 4 !== 0) {
    return false;
  }
  let binary;
  try {
    binary = atob(cleanKey);
  } catch {
    return false;
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const keyTypeMatch = String(record).match(/(?:^|;)\s*k\s*=\s*([^;\s]+)/i);
  const keyType = (keyTypeMatch?.[1] || "rsa").toLowerCase();
  if (keyType === "ed25519") {
    return bytes.length === 32;
  }
  if (keyType !== "rsa") {
    return false;
  }
  return isValidRsaSpkiDer(bytes);
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
          : `SPF contains ~${lookups} top-level DNS lookup mechanisms; nested includes can add lookups toward the RFC 7208 limit of 10.`,
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
        summary: `Valid single SPF record (${lookups} top-level DNS lookup mechanisms; nested includes can add lookups, ${hasHardOrSoftAll ? "enforced qualifier" : "neutral qualifier"}).`,
        remediation: hasHardOrSoftAll
          ? "No changes required. Verify your transactional provider is included."
          : "Tighten the ending qualifier to ~all or -all.",
        copyableFix: "",
      };
    }
  }

  const dmarcCandidates = dmarcRecords.filter((record) => /^v=dmarc1\b/i.test(record.trim()));
  const validDmarc = dmarcCandidates.length === 1 ? dmarcCandidates[0] : null;
  let dmarcCheck;
  if (dmarcCandidates.length > 1) {
    dmarcCheck = {
      id: "dmarc",
      name: "DMARC (_dmarc policy)",
      status: "fail",
      points: 0,
      maxPoints: 30,
      rawRecord: dmarcCandidates.join("\n"),
      summary: `Found ${dmarcCandidates.length} DMARC records at _dmarc.${domain}; the conflicting records make the policy invalid.`,
      remediation: "Keep one DMARC TXT record at _dmarc and merge its policy and reporting tags.",
      copyableFix: `TXT _dmarc.${domain}  v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`,
    };
  } else if (!validDmarc) {
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
    const dkimCandidates = dkimRecords.filter((record) => {
      const value = String(record);
      const versionTag = value.match(/(?:^|;)\s*v\s*=\s*([^;]*)/i);
      const version = versionTag?.[1]?.trim();
      const hasKeyTag = /(?:^|;)\s*p\s*=/i.test(value);
      return (!versionTag || version?.toLowerCase() === "dkim1") && hasKeyTag;
    });
    const hasMultipleDkim = dkimCandidates.length > 1;
    const validDkimRecord = !hasMultipleDkim
      ? dkimCandidates.find((record) => {
          const publicKey = String(record)
            .match(/(?:^|;)\s*p\s*=\s*([^;]*)/i)?.[1]
            ?.trim();
          return Boolean(publicKey) && isValidDkimPublicKey(record, publicKey);
        })
      : null;
    const malformedDkimRecord =
      !hasMultipleDkim &&
      !validDkimRecord &&
      dkimCandidates.find((record) => {
        const publicKey = String(record)
          .match(/(?:^|;)\s*p\s*=\s*([^;]*)/i)?.[1]
          ?.trim();
        return Boolean(publicKey);
      });
    const revokedDkimRecord =
      !hasMultipleDkim && !validDkimRecord && !malformedDkimRecord && dkimCandidates.length > 0
        ? dkimCandidates[0]
        : "";

    dkimCheck = hasMultipleDkim
      ? {
          id: "dkim",
          name: `DKIM (${selector}._domainkey)`,
          status: "fail",
          points: 0,
          maxPoints: 20,
          rawRecord: dkimCandidates.map((r) => r.slice(0, 120)).join("\n"),
          summary: `Found ${dkimCandidates.length} DKIM TXT records at ${selector}._domainkey.${domain}. RFC 6376 requires a unique record per selector.`,
          remediation:
            "Keep only one active DKIM TXT record on this selector and delete duplicate or revoked records.",
          copyableFix: "",
        }
      : validDkimRecord
        ? {
            id: "dkim",
            name: `DKIM (${selector}._domainkey)`,
            status: "pass",
            points: 20,
            maxPoints: 20,
            rawRecord: validDkimRecord.slice(0, 180) + (validDkimRecord.length > 180 ? "…" : ""),
            summary: `Valid DKIM public key found at ${selector}._domainkey.${domain}.`,
            remediation:
              "DKIM key record is published. Send a signed test message to confirm live alignment.",
            copyableFix: "",
          }
        : malformedDkimRecord
          ? {
              id: "dkim",
              name: `DKIM (${selector}._domainkey)`,
              status: "warn",
              points: 8,
              maxPoints: 20,
              rawRecord:
                malformedDkimRecord.slice(0, 180) + (malformedDkimRecord.length > 180 ? "…" : ""),
              summary: `DKIM record found at ${selector}._domainkey.${domain}, but its public key (p=) looks truncated or invalid base64.`,
              remediation:
                "Copy the full DKIM public key from your email provider dashboard without truncating or adding placeholder characters.",
              copyableFix: "",
            }
          : revokedDkimRecord
            ? {
                id: "dkim",
                name: `DKIM (${selector}._domainkey)`,
                status: "fail",
                points: 0,
                maxPoints: 20,
                rawRecord:
                  revokedDkimRecord.slice(0, 180) + (revokedDkimRecord.length > 180 ? "…" : ""),
                summary: `DKIM record at ${selector}._domainkey.${domain} has an empty or revoked public key (p=).`,
                remediation:
                  "Re-generate or publish the active DKIM key from your email provider dashboard.",
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
  dkimRecords: [
    "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCrevesQivmHkigdzqUFb+x0d+Iu2jf3O86cjURullpu18ynocaxuv22yZ7PFCUtYPuJMRB+vsx/eVz+twqCcADYvgTL6PhSM9HPAjcNnr08rzF5eZAspIn6vB6k36veh0/f+DW0QVdX24TkX8ZQO/jymFAMR++zYbreLOh80QqPQIDAQAB",
  ],
});
