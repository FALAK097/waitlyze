#!/usr/bin/env node
// Waitlyze CLI — zero-dependency Node script for creating signups, checking
// subscriber status, awarding custom event points, and calling the Waitlyze
// REST API v1 from scripts and AI agents.
//
// Usage:
//   waitlyze signup <email> --waitlist <id> [--ref <code>] [--name <name>] [--marketing-consent]
//   waitlyze status <email> --waitlist <id>
//   waitlyze points <email> --event <event> --waitlist <id> [--idempotency-key <key>]
//   waitlyze workspaces
//   waitlyze request <METHOD> <path> [--data '<json>']
//
// Auth: --api-key flag, or the WAITLYZE_API_KEY environment variable (wl2_ keys).
// Target: --base-url flag, or WAITLYZE_BASE_URL (default https://waitlyze.com).

const DEFAULT_BASE_URL = "https://waitlyze.com";
const USAGE = `Waitlyze CLI

Usage:
  waitlyze signup <email> --waitlist <id> [--ref <code>] [--name <name>] [--marketing-consent]
      Create a signup (or replay one idempotently). Requires a waitlist-scoped
      API key with the waitlist:write scope.

  waitlyze status <email> --waitlist <id>
      Look up live position, points, referrals, and verification for an email.
      Requires a waitlist-scoped API key with the waitlist:read scope.

  waitlyze points <email> --event <event> --waitlist <id> [--idempotency-key <key>]
      Award custom event points to a verified subscriber. Requires the
      waitlist:write scope.

  waitlyze workspaces
      List the workspaces the API key can access (workspace:read scope).

  waitlyze request <METHOD> <path> [--data '<json>']
      Call any Waitlyze REST API v1 endpoint, e.g.
      waitlyze request GET /api/v1/waitlists

Global options:
  --api-key <key>     Waitlyze API key (env: WAITLYZE_API_KEY)
  --base-url <url>    API base URL (env: WAITLYZE_BASE_URL; default ${DEFAULT_BASE_URL})
  -h, --help          Show this help
  --version           Show version

Docs: https://waitlyze.com/docs/api/reference
Spec: https://waitlyze.com/openapi.json`;

function fail(message, code = 2) {
  console.error(`error: ${message}`);
  process.exit(code);
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--marketing-consent") {
      flags.marketingConsent = true;
      continue;
    }
    if (arg.startsWith("--") || arg === "-k" || arg === "-b" || arg === "-w") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        fail(`missing value for ${arg}`);
      }
      const longName =
        { k: "api-key", b: "base-url", w: "waitlist" }[arg.replace(/^--?/, "")] ||
        arg.replace(/^--?/, "");
      flags[longName] = value;
      i += 1;
      continue;
    }
    positional.push(arg);
  }
  return { positional, flags };
}

function requireFlag(flags, name, label) {
  const value = flags[name];
  if (!value) fail(`${label} is required (use --${name} or the environment variable)`);
  return value;
}

function baseUrl(flags) {
  return (flags["base-url"] || process.env.WAITLYZE_BASE_URL || DEFAULT_BASE_URL).replace(
    /\/$/,
    "",
  );
}

function apiKey(flags) {
  const key = flags["api-key"] || process.env.WAITLYZE_API_KEY;
  if (!key)
    fail(
      "an API key is required (use --api-key or set WAITLYZE_API_KEY). Create one at https://waitlyze.com/api-keys",
    );
  return key;
}

async function request({ method, path, key, base, body }) {
  const headers = {
    "Content-Type": "application/json",
    "X-Api-Key": key,
    Authorization: `Bearer ${key}`,
  };
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers,
      // fetch rejects on `body` for GET/HEAD; the request helper only receives
      // a body for methods that allow one.
      ...(body === undefined || method === "GET" || method === "HEAD"
        ? {}
        : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    fail(`request to ${base}${path} failed: ${error?.message || error}`, 1);
  }
  const raw = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail(
      `non-JSON response from ${base}${path} (HTTP ${response.status}): ${raw.slice(0, 200)}`,
      1,
    );
  }
  if (!response.ok) {
    console.error(JSON.stringify(parsed, null, 2));
    process.exit(1);
  }
  return parsed;
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--version") || argv.includes("-v")) {
    console.log("waitlyze-cli/0.13.0");
    return;
  }
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    console.log(USAGE);
    return;
  }

  const [command, ...rest] = argv;
  const { positional, flags } = parseArgs(rest);
  const base = baseUrl(flags);

  switch (command) {
    case "signup": {
      const email = positional[0];
      if (!email) fail("usage: waitlyze signup <email> --waitlist <id>");
      const body = {
        waitlistId: requireFlag(flags, "waitlist", "--waitlist <id>"),
        email,
      };
      if (flags.ref) body.referralCode = flags.ref;
      if (flags.name) body.name = flags.name;
      if (flags.marketingConsent) body.marketingConsent = true;
      printJson(
        await request({
          method: "POST",
          path: "/api/waitlist",
          key: apiKey(flags),
          base,
          body,
        }),
      );
      return;
    }
    case "status": {
      const email = positional[0];
      if (!email) fail("usage: waitlyze status <email> --waitlist <id>");
      const id = requireFlag(flags, "waitlist", "--waitlist <id>");
      printJson(
        await request({
          method: "GET",
          path: `/api/waitlist?waitlistId=${encodeURIComponent(id)}&email=${encodeURIComponent(email)}`,
          key: apiKey(flags),
          base,
        }),
      );
      return;
    }
    case "points": {
      const email = positional[0];
      if (!email || !flags.event)
        fail("usage: waitlyze points <email> --event <event> --waitlist <id>");
      const body = {
        waitlistId: requireFlag(flags, "waitlist", "--waitlist <id>"),
        email,
        event: flags.event,
      };
      if (flags["idempotency-key"]) body.idempotencyKey = flags["idempotency-key"];
      printJson(
        await request({
          method: "POST",
          path: "/api/waitlist/points",
          key: apiKey(flags),
          base,
          body,
        }),
      );
      return;
    }
    case "workspaces": {
      printJson(
        await request({
          method: "GET",
          path: "/api/v1/workspaces",
          key: apiKey(flags),
          base,
        }),
      );
      return;
    }
    case "request": {
      const [method, path] = positional;
      if (!method || !path) fail("usage: waitlyze request <METHOD> <path> [--data '<json>']");
      const httpMethod = method.toUpperCase();
      if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(httpMethod)) {
        fail(`unsupported method ${httpMethod}`);
      }
      let body;
      if (flags.data) {
        try {
          body = JSON.parse(flags.data);
        } catch {
          fail("--data must be valid JSON");
        }
      }
      printJson(await request({ method: httpMethod, path, key: apiKey(flags), base, body }));
      return;
    }
    default:
      fail(`unknown command "${command}". Run waitlyze --help for usage.`);
  }
}

main().catch((error) => fail(error?.message || String(error), 1));
