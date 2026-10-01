import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

const key = () => {
  const value = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY || "";
  const bytes = Buffer.from(value, "base64");
  if (bytes.length !== 32) throw new Error("WEBHOOK_SECRET_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return bytes;
};

function configurationError(message) {
  const error = new Error(message);
  error.code = "WEBHOOK_URL_INVALID";
  return error;
}

export function encryptSecret(secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return { ciphertext: ciphertext.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64") };
}

export function decryptSecret(record) {
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(record.iv, "base64"));
  decipher.setAuthTag(Buffer.from(record.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(record.ciphertext, "base64")), decipher.final()]).toString("utf8");
}

export function createWebhookSecret() { return `whsec_${randomBytes(32).toString("base64url")}`; }

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function signWebhook(secret, timestamp, payload) {
  return createHmac("sha256", secret).update(`${timestamp}.${canonicalJson(payload)}`).digest("hex");
}

export function verifyWebhookSignature(secret, timestamp, payload, signature) {
  const expected = Buffer.from(signWebhook(secret, timestamp, payload), "hex");
  let supplied;
  try { supplied = Buffer.from(signature, "hex"); } catch { return false; }
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function inV4(ip, base, bits) {
  const value = ip.split(".").reduce((n, part) => (n * 256 + Number(part)) >>> 0, 0);
  const network = base.split(".").reduce((n, part) => (n * 256 + Number(part)) >>> 0, 0);
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (value & mask) === (network & mask);
}

function ipv6BigInt(ip) {
  let v = ip.toLowerCase();
  const embedded = v.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (embedded) {
    const octets = embedded[1].split(".").map(Number);
    if (octets.some((x) => x > 255)) return null;
    v = v.replace(embedded[1], `${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`);
  }
  const halves = v.split("::");
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const groups = halves.length === 2 ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right] : left;
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups.reduce((n, g) => (n << 16n) | BigInt(`0x${g}`), 0n);
}

function inV6(value, base, bits) {
  const n = ipv6BigInt(value), b = ipv6BigInt(base);
  if (n === null || b === null) return false;
  const shift = BigInt(128 - bits);
  return (n >> shift) === (b >> shift);
}

export function isPublicAddress(address) {
  const version = isIP(address);
  if (version === 4) return ![
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
    ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
    ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
    ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
  ].some(([base, bits]) => inV4(address, base, bits));
  if (version === 6) return inV6(address, "2000::", 3) && ![
    ["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20],
  ].some(([base, bits]) => inV6(address, base, bits));
  return false;
}

export function validateWebhookUrl(input) {
  if (typeof input !== "string" || input.length > 2048 || input.includes("\\")) throw configurationError("Enter a valid HTTPS endpoint.");
  let url;
  try { url = new URL(input); } catch { throw configurationError("Enter a valid HTTPS endpoint."); }
  if (url.protocol !== "https:" || url.username || url.password || url.hash || (url.port && url.port !== "443")) throw configurationError("Webhook endpoints must use HTTPS on the standard port.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || !host.includes(".")) throw configurationError("Use a public internet hostname.");
  if (isIP(host) && !isPublicAddress(host)) throw configurationError("Use a public internet hostname.");
  url.search = url.search ? "?…" : "";
  return { url: new URL(input), safeUrl: url.toString() };
}

export async function resolvePublicTarget(hostname, resolver = lookup) {
  const host = hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await resolver(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    const error = new Error("Webhook target resolved to a non-public address.");
    error.code = "TARGET_BLOCKED";
    throw error;
  }
  return addresses;
}
