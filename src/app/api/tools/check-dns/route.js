import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { publicClientIdentity } from "@/lib/security/public-rate-limit.mjs";
import {
  evaluateDnsRecords,
  normalizeDomainInput,
} from "@/lib/tools/engines/dns-deliverability.mjs";

const DNS_RECORD_TYPES = Object.freeze({
  MX: 15,
  TXT: 16,
});

async function queryDoh(name, type) {
  const expectedTypeCode = DNS_RECORD_TYPES[type];
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/dns-json" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data?.Answer)) return [];
  return data.Answer.filter((entry) =>
    expectedTypeCode ? Number(entry?.type) === expectedTypeCode : true,
  )
    .map((entry) => {
      const raw = String(entry?.data || "").trim();
      if (type === "TXT") {
        // Unwrap RFC quoted TXT chunks: `"v=spf1 " "include:..."` -> `v=spf1 include:...`
        return raw.replace(/"\s+"/g, "").replace(/^"|"$/g, "");
      }
      return raw;
    })
    .filter(Boolean);
}

export async function POST(request) {
  try {
    const ip = publicClientIdentity(request.headers);

    let allowed;
    try {
      allowed = await checkRateLimit(prisma, `tool-dns:${ip}`, 30, 60 * 60 * 1000);
    } catch {
      return NextResponse.json(
        { ok: false, error: "DNS checks are temporarily unavailable. Please try again shortly." },
        { status: 503, headers: { "Retry-After": "60" } },
      );
    }
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Rate limit reached (30 DNS checks/hour). Please try again shortly." },
        { status: 429, headers: { "Retry-After": "300" } },
      );
    }

    const body = await request.json();
    const domain = normalizeDomainInput(body?.domain);
    if (!domain) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid public domain name such as acme.com." },
        { status: 400 },
      );
    }

    const rawSelector = String(body?.selector || "")
      .trim()
      .toLowerCase();
    const selector = rawSelector && /^[a-z0-9._-]{1,63}$/.test(rawSelector) ? rawSelector : "";

    const [txtRecords, dmarcRecords, mxRecords, dkimRecords] = await Promise.all([
      queryDoh(domain, "TXT"),
      queryDoh(`_dmarc.${domain}`, "TXT"),
      queryDoh(domain, "MX"),
      selector ? queryDoh(`${selector}._domainkey.${domain}`, "TXT") : Promise.resolve([]),
    ]);

    const result = evaluateDnsRecords({
      domain,
      selector,
      txtRecords,
      dmarcRecords,
      mxRecords,
      dkimRecords,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const msg =
      error?.name === "TimeoutError"
        ? "DNS lookup timed out. Please retry in a moment."
        : "Could not inspect DNS records for that domain.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
