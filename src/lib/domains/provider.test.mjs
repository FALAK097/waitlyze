import assert from "node:assert/strict";
import { test } from "node:test";

import { cloudflareHostnameStatus, mapCloudflareHostname, normalizeDomain } from "./provider.mjs";

test("normalizes hostnames and rejects the app domain, URLs, and platform hosts", () => {
  assert.equal(normalizeDomain("  Launch.Example.com. "), "launch.example.com");
  assert.throws(() => normalizeDomain("waitlyze.com"), /Waitlyze app domain/);
  assert.throws(() => normalizeDomain("waitlyze.falakgala.dev"), /Waitlyze app domain/);
  assert.throws(() => normalizeDomain("https://launch.example.com"));
  assert.throws(() => normalizeDomain("launch.workers.dev"));
});

test("requires both hostname activation and a live certificate", () => {
  assert.equal(
    cloudflareHostnameStatus({ status: "pending", ssl: { status: "active" } }),
    "NEEDS_DNS",
  );
  assert.equal(
    cloudflareHostnameStatus({ status: "active", ssl: { status: "pending_validation" } }),
    "VERIFYING",
  );
  assert.equal(cloudflareHostnameStatus({ status: "active", ssl: { status: "active" } }), "ACTIVE");
  assert.equal(
    cloudflareHostnameStatus({ status: "blocked", ssl: { status: "active" } }),
    "NEEDS_ATTENTION",
  );
});

test("returns customer CNAME and certificate validation records", () => {
  const result = mapCloudflareHostname(
    {
      id: "hostname-id",
      status: "pending",
      ssl: {
        status: "pending_validation",
        validation_records: [{ txt_name: "_acme.example.com", txt_record: "token" }],
      },
      ownership_verification: {
        type: "txt",
        name: "_cf-custom-hostname.example.com",
        value: "ownership-token",
      },
    },
    "launch.example.com",
    "customers.waitlyze.com",
  );

  assert.equal(result.id, "hostname-id");
  assert.equal(result.status, "NEEDS_DNS");
  assert.deepEqual(result.dnsRecords, [
    { type: "CNAME", name: "launch.example.com", value: "customers.waitlyze.com" },
  ]);
  assert.deepEqual(result.verification, [
    { type: "TXT", name: "_cf-custom-hostname.example.com", value: "ownership-token" },
    { type: "TXT", name: "_acme.example.com", value: "token" },
  ]);
});
