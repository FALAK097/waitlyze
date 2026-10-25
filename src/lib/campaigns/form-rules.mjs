// Per-form join rules: allow/block lists, phone + custom fields, redirect
// allowlist, and the double opt-in effective flag. Pure helpers shared by the
// pre-DB validator (validateRequest) and the signup transaction
// (createCampaignSignup), so the API-key path gets the same enforcement.
// Every default is "off" — lists empty, toggles false — preserving behavior
// for snapshots saved before these settings existed.

import { getEmailDomain } from "@/utils/server/email-validation.mjs";

import { templateSnapshotSchema } from "../templates/catalog.mjs";

const MAX_CUSTOM_VALUE = 2000;

// Double opt-in audit: "double opt-in" here means requiring email confirmation
// before a signup counts (verifiedAt stays null until the link is clicked and
// position scoring is verified-only). The legacy `verification` toggle already
// enforced that mechanic; `doubleOptIn` is the explicit per-form setting. A
// signup requires confirmation only when BOTH are on, so pre-existing
// snapshots (verification true/false, no doubleOptIn key) behave exactly as
// before: the zod default (true) keeps the AND neutral.
export function requiresDoubleOptIn(form) {
  if (!form || typeof form !== "object") return true;
  return form.verification !== false && form.doubleOptIn !== false;
}

export function normalizeDomainList(entries) {
  if (!Array.isArray(entries)) return [];
  const out = [];
  const seen = new Set();
  for (const entry of entries) {
    if (typeof entry !== "string") continue;
    const domain = entry.trim().toLowerCase().replace(/^@+/, "");
    if (domain && domain.length <= 253 && !seen.has(domain)) {
      seen.add(domain);
      out.push(domain);
    }
  }
  return out;
}

const domainMatches = (domain, entry) => domain === entry || domain.endsWith(`.${entry}`);

export function checkEmailDomainRules(form, email) {
  const domain = getEmailDomain(typeof email === "string" ? email.trim() : "");
  if (!domain) return null;
  const blocked = normalizeDomainList(form?.blockedEmailDomains);
  if (blocked.some((entry) => domainMatches(domain, entry))) {
    return `Email addresses from ${domain} aren't accepted on this waitlist.`;
  }
  const allowed = normalizeDomainList(form?.allowedEmailDomains);
  if (allowed.length > 0 && !allowed.some((entry) => domainMatches(domain, entry))) {
    return "This waitlist is only open to approved email domains.";
  }
  return null;
}

export function normalizeCountryList(entries) {
  if (!Array.isArray(entries)) return [];
  const out = [];
  const seen = new Set();
  for (const entry of entries) {
    if (typeof entry !== "string") continue;
    const code = entry.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(code) && !seen.has(code)) {
      seen.add(code);
      out.push(code);
    }
  }
  return out;
}

export function checkCountryRules(form, country) {
  const code = typeof country === "string" ? country.trim().toUpperCase() : "";
  const blocked = normalizeCountryList(form?.blockedCountries);
  if (code && blocked.includes(code)) {
    return "This waitlist isn't available in your country right now.";
  }
  const allowed = normalizeCountryList(form?.allowedCountries);
  // No detectable country + an allowlist: fail closed would lock out
  // legitimate VPN/proxy signups and local dev, so unknown geo passes and the
  // founder's blocklist remains the hard gate.
  if (allowed.length > 0 && code && !allowed.includes(code)) {
    return "This waitlist isn't available in your country right now.";
  }
  return null;
}

// E.164: explicit country calling code required (leading +), 8–15 digits.
// That leading + is the "country validation" — numbers without a country code
// never validate.
export function normalizePhoneNumber(phone) {
  if (typeof phone !== "string") return "";
  return phone.replace(/[\s\-().]/g, "");
}

export function validatePhoneNumber(phone, form) {
  const optional = !form?.collectPhone && !form?.requirePhone;
  const value = normalizePhoneNumber(phone);
  if (!value) {
    if (form?.requirePhone)
      return "Add your phone number with its country code (e.g. +14155552671).";
    return null;
  }
  if (!optional && !/^\+[1-9]\d{7,14}$/.test(value)) {
    return "Enter a valid phone number with country code (e.g. +14155552671).";
  }
  // Phone collection off: ignore stray values instead of erroring.
  if (optional) return null;
  return null;
}

// Custom field answers arrive as [{id, value}]. Returns {error, answers} with
// answers sanitized to [{id, label, value}] (checkbox → "yes"/"no").
export function sanitizeCustomFieldAnswers(form, raw) {
  const fields = Array.isArray(form?.customFields) ? form.customFields : [];
  if (fields.length === 0) return { error: null, answers: [] };
  const byId = new Map(fields.map((field) => [String(field.id).toLowerCase(), field]));
  const seen = new Set();
  const answers = [];
  const list = Array.isArray(raw) ? raw.slice(0, 10) : [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const field = byId.get(String(entry.id ?? "").toLowerCase());
    if (!field || seen.has(field.id.toLowerCase())) continue;
    seen.add(field.id.toLowerCase());
    let value = entry.value;
    if (field.type === "checkbox") {
      value =
        value === true || value === "true" || value === "on" || value === "yes" ? "yes" : "no";
    } else {
      value = typeof value === "string" ? value.trim().slice(0, MAX_CUSTOM_VALUE) : "";
    }
    answers.push({ id: field.id, label: field.label, value });
  }
  for (const field of fields) {
    const answer = answers.find((item) => item.id.toLowerCase() === String(field.id).toLowerCase());
    const empty =
      !answer || (field.type === "checkbox" ? answer.value !== "yes" : answer.value === "");
    if (field.required && empty) return { error: `“${field.label}” is required.`, answers: [] };
    if (empty) continue;
    if (field.type === "select" && !field.options.includes(answer.value)) {
      return { error: `Choose a valid option for “${field.label}”.`, answers: [] };
    }
    if (field.type === "number" && !/^-?\d+(\.\d+)?$/.test(answer.value)) {
      return { error: `“${field.label}” must be a number.`, answers: [] };
    }
  }
  return { error: null, answers };
}

// Request-body sanitizer for the public route: caps counts/lengths before the
// values reach validation or storage.
export function pickCustomFields(body) {
  const raw = body && typeof body === "object" ? body.customFields : undefined;
  if (!Array.isArray(raw)) return undefined;
  return raw.slice(0, 10).map((entry) => ({
    id: typeof entry?.id === "string" ? entry.id.slice(0, 40) : "",
    value:
      typeof entry?.value === "string"
        ? entry.value.slice(0, MAX_CUSTOM_VALUE)
        : entry?.value === true
          ? "true"
          : "",
  }));
}

// Redirect allowlist: relative paths are same-origin by construction and always
// allowed; absolute URLs must be https AND host-allowlisted. Anything else
// resolves to null (stay on the cockpit) — never an attacker URL, because the
// client only navigates to the server-vetted value echoed in the response.
export function resolveSuccessRedirect(form) {
  const target = typeof form?.successRedirectUrl === "string" ? form.successRedirectUrl.trim() : "";
  if (!target) return null;
  if (target.includes("\\")) return null;
  // WHATWG URL parsing strips ASCII tabs/newlines and treats backslashes as
  // slashes, so `/\evil.com` or embedded control characters would resolve
  // off-origin in the browser. Reject them before the shape checks below.
  // oxlint-disable-next-line no-control-regex -- intentional: WHATWG URL parsing strips these chars, enabling open redirects; rejecting them is the security boundary
  if (/[\u0000-\u0020]/.test(target)) return null;
  if (/^\/(?!\/)/.test(target)) return target.slice(0, 500);
  if (/^https:\/\//i.test(target)) {
    let host = "";
    try {
      host = new URL(target).hostname.toLowerCase();
    } catch {
      return null;
    }
    const allowlisted = normalizeDomainList(form?.successRedirectAllowlist).includes(host);
    return allowlisted ? target.slice(0, 500) : null;
  }
  return null;
}

// Loads the published form config for pre-DB checks. Null only when unpublished;
// a missing revision or invalid snapshot is an error so callers fail closed.
export async function getPublishedFormConfig(db, waitListId) {
  const row = await db.waitList.findUnique({
    where: { id: waitListId, status: "PUBLISHED" },
    select: { publishedRevision: true },
  });
  if (!row) return null;
  if (!row.publishedRevision) throw new Error("Published waitlist has no publication revision.");

  const publication = await db.waitListPublicationRevision.findUnique({
    where: {
      waitListId_revision: { waitListId, revision: row.publishedRevision },
    },
    select: { snapshot: true },
  });
  const parsed = templateSnapshotSchema.safeParse(publication?.snapshot);
  if (!parsed.success) throw new Error("Published waitlist has an invalid publication snapshot.");
  return parsed.data.form;
}
