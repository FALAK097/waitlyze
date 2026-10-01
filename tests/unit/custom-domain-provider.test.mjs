import test from "node:test";
import assert from "node:assert/strict";
import { domainStatus, mapDnsRecords, mapVercelDomain, normalizeDomain, vercelDomain, vercelProjectPath } from "../../src/lib/domains/provider.mjs";

test("normalizes public internationalized hostnames and rejects unsafe or app-owned hosts", () => {
  assert.equal(normalizeDomain(" Launch.Example.com. "), "launch.example.com");
  assert.equal(normalizeDomain("bücher.example"), "xn--bcher-kva.example");
  for (const value of ["https://example.com", "foo:3000", "localhost", "127.0.0.1", "a.vercel.app", "*.example.com", "waitlyze.com"]) {
    assert.throws(() => normalizeDomain(value, "waitlyze.com"), { message: /hostname|valid|Waitlyze/ });
  }
});

test("builds fixed Vercel project endpoints and filters provider responses", async () => {
  assert.equal(vercelProjectPath("a.example.com", "add"), "/v10/projects/{project}/domains");
  assert.equal(vercelProjectPath("a.example.com", "verify"), "/v9/projects/{project}/domains/a.example.com/verify");
  assert.deepEqual(mapVercelDomain({ verified: true, verification: [{ type: "TXT", domain: "_vercel.a.example.com", value: "proof", reason: "internal" }, { reason: "invalid" }] }), { verified: true, verification: [{ type: "TXT", domain: "_vercel.a.example.com", value: "proof" }] });
  assert.equal(domainStatus({ verified: false }, { misconfigured: false }), "NEEDS_DNS");
  assert.equal(domainStatus({ verified: true }, { misconfigured: true }), "VERIFYING");
  assert.equal(domainStatus({ verified: true }, { misconfigured: false }), "ACTIVE");
  assert.deepEqual(mapDnsRecords({ recommendedCNAME: [{ value: "cname.vercel-dns.com" }], recommendedIPv4: [{ value: ["76.76.21.21"] }] }, "a.example.com"), [{ type: "CNAME", name: "a.example.com", value: "cname.vercel-dns.com" }]);
  assert.deepEqual(mapDnsRecords({ recommendedIPv4: [{ value: ["76.76.21.21"] }] }, "example.com"), [{ type: "A", name: "example.com", value: "76.76.21.21" }]);

  const prior = { token: process.env.VERCEL_TOKEN, project: process.env.VERCEL_PROJECT_ID, team: process.env.VERCEL_TEAM_ID, fetch: globalThis.fetch };
  process.env.VERCEL_TOKEN = "test-token";
  process.env.VERCEL_PROJECT_ID = "prj_test";
  process.env.VERCEL_TEAM_ID = "team_test";
  let called;
  globalThis.fetch = async (url, options) => { called = { url: String(url), options }; return new Response(JSON.stringify({ verified: true }), { status: 200 }); };
  try {
    const result = await vercelDomain(vercelProjectPath("a.example.com", "add"), { method: "POST", body: { name: "a.example.com" } });
    assert.deepEqual(result, { verified: true });
    assert.match(called.url, /^https:\/\/api\.vercel\.com\/v10\/projects\/prj_test\/domains\?teamId=team_test$/);
    assert.equal(called.options.headers.Authorization, "Bearer test-token");
    assert.equal(called.options.method, "POST");
    globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: "provider internals" } }), { status: 400 });
    await assert.rejects(vercelDomain(vercelProjectPath("a.example.com", "verify"), { method: "POST" }), { status: 400, message: /Check the DNS records/ });
  } finally {
    globalThis.fetch = prior.fetch;
    for (const [key, value] of [["VERCEL_TOKEN", prior.token], ["VERCEL_PROJECT_ID", prior.project], ["VERCEL_TEAM_ID", prior.team]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
