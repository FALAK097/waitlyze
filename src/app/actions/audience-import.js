"use server";

import Papa from "papaparse";
import prisma from "@/lib/prisma";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { AccessError } from "@/lib/workspaces/service.mjs";
import { validateSignupEmail } from "@/utils/server/email-validation.mjs";

const MAX_ROWS = 5000;
const MAX_BYTES = 2 * 1024 * 1024;

// Imports signups from a CSV file with an `email` column. Imported rows are
// unverified and receive no emails; founders verify or mail them afterwards.
export async function importSignups(waitListId, formData) {
  try {
    const { scope } = await requireCampaign(waitListId, "manageAudience");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a CSV file to import." };
    if (file.size > MAX_BYTES) return { ok: false, message: "That file is too large. Keep imports under 2 MB." };
    const parsed = Papa.parse(await file.text(), { header: true, skipEmptyLines: true });
    const fields = parsed.meta.fields || [];
    const emailKey = fields.find((field) => field.trim().toLowerCase() === "email");
    if (!emailKey) return { ok: false, message: "The CSV needs an 'email' column. Download the template to see the format." };
    const raw = parsed.data.slice(0, MAX_ROWS + 1);
    if (raw.length === 0) return { ok: false, message: "No rows found in that file." };
    if (raw.length > MAX_ROWS) return { ok: false, message: `Keep imports to ${MAX_ROWS.toLocaleString()} rows at a time.` };

    const seen = new Set();
    const candidates = [];
    let invalid = 0;
    for (const row of raw) {
      const email = typeof row?.[emailKey] === "string" ? row[emailKey].trim() : "";
      if (validateSignupEmail(email)) {
        invalid += 1;
        continue;
      }
      const normalized = email.toLowerCase();
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      candidates.push({ email, emailNormalized: normalized });
    }
    if (candidates.length === 0) return { ok: false, message: invalid > 0 ? "Every row failed validation. Check the emails and try again." : "No new emails in that file." };

    const existing = await prisma.signUp.findMany({
      where: { waitListId, waitList: scope, emailNormalized: { in: candidates.map((row) => row.emailNormalized) } },
      select: { emailNormalized: true },
    });
    const known = new Set(existing.map((row) => row.emailNormalized));
    const fresh = candidates.filter((row) => !known.has(row.emailNormalized));
    const duplicates = candidates.length - fresh.length;
    let imported = 0;
    for (let index = 0; index < fresh.length; index += 500) {
      const chunk = fresh.slice(index, index + 500).map((row) => ({
        ...row,
        uniqueUserId: `import:${Date.now().toString(36)}:${index}:${Math.random().toString(36).slice(2, 10)}`,
        waitListId,
      }));
      const result = await prisma.signUp.createMany({ data: chunk, skipDuplicates: true });
      imported += result.count;
    }
    return { ok: true, imported, duplicates: duplicates + (fresh.length - imported), invalid };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, message: "You no longer have access to this waitlist." };
    console.error("Audience import failed", error?.code || error?.name);
    return { ok: false, message: "Couldn't import that file. Try again." };
  }
}
