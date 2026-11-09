import { isIP } from "node:net";
import { domainToASCII } from "node:url";

const DEFAULT_ROOT_DOMAIN = "waitlyze.com";

export function normalizeDomain(
  input,
  rootDomain = process.env.APP_ROOT_DOMAIN || DEFAULT_ROOT_DOMAIN,
) {
  if (typeof input !== "string") throw new Error("Enter a hostname such as launch.example.com.");
  const candidate = input.trim();
  if (candidate.length > 253 || /[:/@?#\\\s]/.test(candidate))
    throw new Error("Enter a hostname such as launch.example.com.");
  const hostname = domainToASCII(candidate.replace(/\.$/, "").toLowerCase());
  if (
    !hostname ||
    hostname.length > 253 ||
    isIP(hostname) ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".workers.dev") ||
    hostname.includes("*")
  )
    throw new Error("This hostname cannot be connected.");
  const labels = hostname.split(".");
  if (
    labels.length < 2 ||
    labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
  )
    throw new Error("Enter a valid public hostname.");
  const root = domainToASCII(rootDomain.toLowerCase());
  if (root && (hostname === root || hostname.endsWith(`.${root}`)))
    throw new Error("Use a domain outside the Waitlyze app domain.");
  return hostname;
}

function cloudflareConfig() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) {
    throw Object.assign(new Error("Custom domains are not configured yet."), { status: 503 });
  }
  return {
    token,
    zoneId,
    target: process.env.CLOUDFLARE_CUSTOM_HOSTNAME_TARGET || "customers.waitlyze.com",
  };
}

async function cloudflareRequest(path, { method = "GET", body, allowNotFound = false } = {}) {
  const { token } = cloudflareConfig();
  const url = new URL(`https://api.cloudflare.com/client/v4${path}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => ({}));
    if (allowNotFound && response.status === 404) return null;
    if (!response.ok || data.success === false) {
      const status = response.status === 409 ? 409 : response.status === 400 ? 400 : 502;
      const message =
        status === 409
          ? "This hostname is already connected to another service."
          : status === 400
            ? "Cloudflare rejected this hostname. Check the domain and try again."
            : "Cloudflare could not update this domain. Try again.";
      throw Object.assign(new Error(message), { status });
    }
    return data.result;
  } catch (error) {
    if (error.status) throw error;
    throw Object.assign(new Error("Could not reach Cloudflare. Try again."), { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

function customHostnamePath(zoneId) {
  return `/zones/${encodeURIComponent(zoneId)}/custom_hostnames`;
}

async function findCloudflareHostname(hostname) {
  const { zoneId } = cloudflareConfig();
  const query = new URLSearchParams({ "hostname.exact": hostname, per_page: "1" });
  const results = await cloudflareRequest(`${customHostnamePath(zoneId)}?${query}`);
  return Array.isArray(results)
    ? results.find((entry) => entry.hostname === hostname) || null
    : null;
}

export async function createCloudflareHostname(hostname) {
  const { zoneId } = cloudflareConfig();
  const result = await cloudflareRequest(customHostnamePath(zoneId), {
    method: "POST",
    body: {
      hostname,
      ssl: {
        method: "txt",
        type: "dv",
        settings: { min_tls_version: "1.2" },
      },
    },
  });
  return mapCloudflareHostname(result, hostname);
}

export async function getCloudflareHostname({ providerId, hostname }) {
  const { zoneId } = cloudflareConfig();
  let result = null;
  if (providerId)
    result = await cloudflareRequest(
      `${customHostnamePath(zoneId)}/${encodeURIComponent(providerId)}`,
      {
        allowNotFound: true,
      },
    );
  // The stored ID may be stale (the hostname was recreated in the Cloudflare
  // dashboard). Search by hostname before concluding it does not exist, so
  // refresh flows reuse it instead of attempting a duplicate creation.
  if (!result) result = await findCloudflareHostname(hostname);
  if (!result) return null;
  return mapCloudflareHostname(result, hostname);
}

export async function deleteCloudflareHostname({ providerId, hostname }) {
  const { zoneId } = cloudflareConfig();
  const current = providerId ? { id: providerId } : await findCloudflareHostname(hostname);
  if (!current?.id) return;
  await cloudflareRequest(`${customHostnamePath(zoneId)}/${encodeURIComponent(current.id)}`, {
    method: "DELETE",
    allowNotFound: true,
  });
}

export function mapCloudflareHostname(
  result,
  hostname,
  target = process.env.CLOUDFLARE_CUSTOM_HOSTNAME_TARGET || "customers.waitlyze.com",
) {
  const records = [];
  const ownership = result?.ownership_verification;
  if (ownership?.type && ownership?.name && (ownership.value || ownership.record)) {
    records.push({
      type: String(ownership.type).toUpperCase(),
      name: ownership.name,
      value: ownership.value || ownership.record,
    });
  }

  for (const item of Array.isArray(result?.ssl?.validation_records)
    ? result.ssl.validation_records
    : []) {
    const name = item?.txt_name || item?.hostname || item?.name;
    const value = item?.txt_record || item?.txt_value || item?.value;
    if (name && value) records.push({ type: "TXT", name, value });
  }

  const verification = records.filter((record) => record.type === "TXT");
  return {
    id: result?.id || null,
    status: cloudflareHostnameStatus(result),
    verification,
    dnsRecords: [{ type: "CNAME", name: hostname, value: target }],
  };
}

export function cloudflareHostnameStatus(result) {
  const hostnameStatus = result?.status;
  const sslStatus = result?.ssl?.status;
  if (hostnameStatus === "active" && sslStatus === "active") return "ACTIVE";
  if (
    ["blocked", "deleted", "pending_deletion", "moved"].includes(hostnameStatus) ||
    ["expired", "validation_timed_out", "issuance_timed_out", "deployment_timed_out"].includes(
      sslStatus,
    )
  )
    return "NEEDS_ATTENTION";
  if (hostnameStatus === "active") return "VERIFYING";
  return "NEEDS_DNS";
}
