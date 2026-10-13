import { domainToASCII } from "node:url";
import { isIP } from "node:net";

export function normalizeDomain(input, rootDomain = process.env.APP_ROOT_DOMAIN) {
  if (typeof input !== "string") throw new Error("Enter a hostname such as launch.example.com.");
  const candidate = input.trim();
  if (candidate.length > 253 || /[:/@?#\\\s]/.test(candidate)) throw new Error("Enter a hostname such as launch.example.com.");
  const hostname = domainToASCII(candidate.replace(/\.$/, "").toLowerCase());
  if (!hostname || hostname.length > 253 || isIP(hostname) || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".vercel.app") || hostname.includes("*")) throw new Error("This hostname cannot be connected.");
  const labels = hostname.split(".");
  if (labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) throw new Error("Enter a valid public hostname.");
  const root = rootDomain ? domainToASCII(rootDomain.toLowerCase()) : "";
  if (root && (hostname === root || hostname.endsWith(`.${root}`))) throw new Error("Use a domain outside the Waitlyze app domain.");
  return hostname;
}

function config() {
  const token = process.env.VERCEL_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID;
  if (!token || !project) throw Object.assign(new Error("Custom domains are not configured yet."), { status: 503 });
  return { token, project, team: process.env.VERCEL_TEAM_ID };
}

export async function vercelDomain(path, { method = "GET", body } = {}) {
  const { token, project, team } = config();
  const url = new URL(`https://api.vercel.com${path.replace("{project}", encodeURIComponent(project))}`);
  if (team) url.searchParams.set("teamId", team);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { method, signal: controller.signal, headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const status = response.status === 409 ? 409 : response.status === 400 ? 400 : 502;
      const message = status === 409 ? "This hostname is already assigned to another project." : status === 400 ? "Vercel rejected this domain request. Check the DNS records and project settings." : "Vercel could not update this domain. Try again.";
      throw Object.assign(new Error(message), { status });
    }
    return data;
  } catch (error) {
    if (error.status) throw error;
    throw Object.assign(new Error("Could not reach the domain provider. Try again."), { status: 502 });
  } finally { clearTimeout(timeout); }
}

export function vercelProjectPath(hostname, action = "get") {
  const domain = `/v9/projects/{project}/domains/${encodeURIComponent(hostname)}`;
  return action === "add" ? `/v10/projects/{project}/domains` : action === "verify" ? `${domain}/verify` : domain;
}
export function mapVercelDomain(data) {
  const verification = Array.isArray(data?.verification) ? data.verification.filter((item) => item?.type && item?.domain && item?.value).map(({ type, domain, value }) => ({ type, domain, value })) : [];
  return { verified: data?.verified === true, verification };
}

export function domainStatus(domain, config) {
  if (domain?.verified !== true) return "NEEDS_DNS";
  if (config?.misconfigured !== false) return "VERIFYING";
  return "ACTIVE";
}

export function mapDnsRecords(data, hostname) {
  const records = [];
  for (const item of Array.isArray(data?.recommendedCNAME) ? data.recommendedCNAME : []) {
    if (typeof item?.value === "string") records.push({ type: "CNAME", name: hostname, value: item.value });
  }
  if (!records.length) {
    for (const item of Array.isArray(data?.recommendedIPv4) ? data.recommendedIPv4 : []) {
      const value = Array.isArray(item?.value) ? item.value[0] : item?.value;
      if (typeof value === "string") records.push({ type: "A", name: hostname, value });
    }
  }
  for (const item of Array.isArray(data?.records) ? data.records : []) {
    if (item?.type && item?.name && item?.value) records.push({ type: item.type, name: item.name, value: item.value });
  }
  return records.slice(0, 5);
}
