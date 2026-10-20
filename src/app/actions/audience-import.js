"use server";

import Papa from "papaparse";

import { emailLookupForms, normalizeSignupEmail } from "@/lib/normalize-email.mjs";
import prisma from "@/lib/prisma";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { AccessError } from "@/lib/workspaces/service.mjs";
import { validateSignupEmail } from "@/utils/server/email-validation.mjs";

const MAX_ROWS = 5000;
const MAX_BYTES = 2 * 1024 * 1024;
const REFERRAL_CODE_FORMAT = /^[A-Za-z0-9_-]{4,64}$/;

const truthy = (value) =>
  ["true", "1", "yes", "verified"].includes(
    String(value ?? "")
      .trim()
      .toLowerCase(),
  );

function parsePoints(value) {
  if (value == null || value === "") return 0;
  const points = Number.parseInt(String(value).trim(), 10);
  return Number.isSafeInteger(points) && points >= 0 ? Math.min(points, 1000000) : 0;
}

function parseCountry(value) {
  const code = String(value ?? "")
    .trim()
    .toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function parseJoinedAt(value) {
  if (value == null || value === "") return null;
  const time = new Date(String(value).trim()).getTime();
  return Number.isNaN(time) ? null : new Date(time);
}

// Bulk import from a CSV with an `email` column plus optional `country`,
// `points`, `referral_code`, `referred_by` (email or code), `verified` and
// `joined_at` columns (`Status` and `Joined at` from waitlist exports are
// recognized as fallbacks). Imported rows start unverified unless marked
// verified and never trigger emails. Referral links resolve in a second pass.
export async function importSignups(waitListId, formData) {
  try {
    const { scope } = await requireCampaign(waitListId, "manageAudience");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0)
      return { ok: false, message: "Choose a CSV file to import." };
    if (file.size > MAX_BYTES)
      return { ok: false, message: "That file is too large. Keep imports under 2 MB." };
    const parsed = Papa.parse(await file.text(), { header: true, skipEmptyLines: true });
    const fields = parsed.meta.fields || [];
    const keyOf = (name) => fields.find((field) => field.trim().toLowerCase() === name);
    const emailKey = keyOf("email");
    if (!emailKey)
      return {
        ok: false,
        message: "The CSV needs an 'email' column. Download the template to see the format.",
      };
    const countryKey = keyOf("country");
    const pointsKey = keyOf("points");
    const codeKey = keyOf("referral_code");
    const referredByKey = keyOf("referred_by");
    const verifiedKey = keyOf("verified") ?? keyOf("status");
    const joinedAtKey = keyOf("joined_at") ?? keyOf("joined at");
    const cell = (row, key) => (key && typeof row?.[key] === "string" ? row[key].trim() : "");

    const raw = parsed.data.slice(0, MAX_ROWS + 1);
    if (raw.length === 0) return { ok: false, message: "No rows found in that file." };
    if (raw.length > MAX_ROWS)
      return { ok: false, message: `Keep imports to ${MAX_ROWS.toLocaleString()} rows at a time.` };

    const seen = new Set();
    // Referral codes are globally unique, so check the CSV's codes across all
    // waitlists instead of scanning this one.
    const csvCodes = [
      ...new Set(
        raw
          .map((row) => cell(row, codeKey))
          .filter((code) => code && REFERRAL_CODE_FORMAT.test(code)),
      ),
    ];
    const takenCodes = new Set(
      csvCodes.length
        ? (
            await prisma.signUp.findMany({
              where: { referralCode: { in: csvCodes } },
              select: { referralCode: true },
            })
          ).map((row) => row.referralCode)
        : [],
    );
    const candidates = [];
    let invalid = 0;
    for (const row of raw) {
      const email = cell(row, emailKey);
      if (validateSignupEmail(email)) {
        invalid += 1;
        continue;
      }
      const normalized = normalizeSignupEmail(email);
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      const code = cell(row, codeKey);
      const useCode =
        code && REFERRAL_CODE_FORMAT.test(code) && !takenCodes.has(code) ? code : null;
      if (useCode) takenCodes.add(useCode);
      candidates.push({
        email,
        emailNormalized: normalized,
        country: countryKey ? parseCountry(cell(row, countryKey)) : null,
        points: pointsKey ? parsePoints(cell(row, pointsKey)) : 0,
        referralCode: useCode,
        referredBy: referredByKey ? cell(row, referredByKey) : "",
        verifiedAt: verifiedKey && truthy(cell(row, verifiedKey)) ? new Date() : null,
        createdAt: joinedAtKey ? parseJoinedAt(cell(row, joinedAtKey)) : null,
      });
    }
    if (candidates.length === 0)
      return {
        ok: false,
        message:
          invalid > 0
            ? "Every row failed validation. Check the emails and try again."
            : "No new emails in that file.",
      };

    const existing = await prisma.signUp.findMany({
      where: {
        waitListId,
        waitList: scope,
        emailNormalized: {
          in: [...new Set(candidates.flatMap((row) => emailLookupForms(row.email)))],
        },
      },
      select: { emailNormalized: true },
    });
    const known = new Set(existing.map((row) => row.emailNormalized));
    // Legacy Gmail variants (dotted / plus-tagged rows) never match by
    // spelling, so fold every stored Gmail address to canonical form once
    // and match candidates against that. Single extra query, only when the
    // CSV actually contains Gmail addresses.
    if (candidates.some((row) => /@gmail\.com$|@googlemail\.com$/i.test(row.email))) {
      const gmailRows = await prisma.signUp.findMany({
        where: {
          waitListId,
          OR: [
            { emailNormalized: { endsWith: "@gmail.com" } },
            { emailNormalized: { endsWith: "@googlemail.com" } },
          ],
        },
        select: { emailNormalized: true },
      });
      for (const row of gmailRows) {
        if (row.emailNormalized) known.add(normalizeSignupEmail(row.emailNormalized));
      }
    }
    const fresh = candidates.filter(
      (row) => !emailLookupForms(row.email).some((form) => known.has(form)),
    );
    const duplicates = candidates.length - fresh.length;

    let imported = 0;
    const stamp = Date.now().toString(36);
    for (let index = 0; index < fresh.length; index += 500) {
      const chunk = fresh.slice(index, index + 500).map((row, offset) => ({
        email: row.email,
        emailNormalized: row.emailNormalized,
        uniqueUserId: `import:${stamp}:${index + offset}`,
        waitListId,
        country: row.country,
        points: row.points,
        ...(row.referralCode ? { referralCode: row.referralCode } : {}),
        ...(row.verifiedAt ? { verifiedAt: row.verifiedAt } : {}),
        ...(row.createdAt ? { createdAt: row.createdAt } : {}),
      }));
      const result = await prisma.signUp.createMany({ data: chunk, skipDuplicates: true });
      imported += result.count;
    }

    // Second pass: link referrals by email or code, including rows from this file.
    let referralsLinked = 0;
    const linkable = fresh.filter((row) => row.referredBy);
    if (linkable.length > 0) {
      const created = await prisma.signUp.findMany({
        where: { waitListId, emailNormalized: { in: fresh.map((row) => row.emailNormalized) } },
        select: { id: true, emailNormalized: true, referralCode: true },
      });
      const byEmail = new Map(created.map((row) => [row.emailNormalized, row]));
      const byCode = new Map(created.map((row) => [row.referralCode, row]));
      const slots = await prisma.signUp.findMany({
        where: { waitListId, waitList: scope },
        select: { id: true, emailNormalized: true, referralCode: true },
      });
      for (const row of slots) {
        if (!byEmail.has(row.emailNormalized)) byEmail.set(row.emailNormalized, row);
        if (row.referralCode && !byCode.has(row.referralCode)) byCode.set(row.referralCode, row);
      }
      const links = [];
      for (const row of linkable) {
        const newcomer = byEmail.get(row.emailNormalized);
        const key = row.referredBy.trim();
        const referrer =
          emailLookupForms(key)
            .map((form) => byEmail.get(form))
            .find(Boolean) || byCode.get(key);
        if (newcomer && referrer && referrer.id !== newcomer.id)
          links.push({ signUpId: newcomer.id, referredById: referrer.id });
      }
      for (let index = 0; index < links.length; index += 500) {
        const result = await prisma.referral.createMany({
          data: links.slice(index, index + 500),
          skipDuplicates: true,
        });
        referralsLinked += result.count;
      }
    }
    return {
      ok: true,
      imported,
      duplicates: duplicates + (fresh.length - imported),
      invalid,
      referralsLinked,
    };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, message: "You no longer have access to this waitlist." };
    console.error("Audience import failed", error?.code || error?.name);
    return { ok: false, message: "Couldn't import that file. Try again." };
  }
}
