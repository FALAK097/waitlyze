import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isCacheablePublicDocument,
  isCacheablePublicResponse,
} from "../src/lib/edge-public-page-cache.mjs";

test("only anonymous HTML documents with no variants share a cache entry", () => {
  for (const route of ["/", "/templates", "/blog"]) {
    assert.equal(isCacheablePublicDocument(new Request(`https://waitlyze.com${route}`)), true);
  }
  for (const route of ["/waitlists", "/templates/saas", "/blog?tag=product", "/api/health"]) {
    assert.equal(isCacheablePublicDocument(new Request(`https://waitlyze.com${route}`)), false);
  }
  for (const headers of [
    { Cookie: "ba.session_token=secret" },
    { Authorization: "Bearer token" },
    { RSC: "1" },
    { "Next-Router-State-Tree": "[]" },
    { Accept: "text/markdown" },
  ]) {
    assert.equal(
      isCacheablePublicDocument(new Request("https://waitlyze.com/", { headers })),
      false,
    );
  }
  assert.equal(
    isCacheablePublicDocument(new Request("https://waitlyze.com/", { method: "POST" })),
    false,
  );
});

test("never cache errors, responses with cookies, or private data", () => {
  const html = { "content-type": "text/html; charset=utf-8" };
  assert.equal(isCacheablePublicResponse(new Response("ok", { headers: html })), true);
  assert.equal(
    isCacheablePublicResponse(new Response("no", { status: 503, headers: html })),
    false,
  );
  assert.equal(
    isCacheablePublicResponse(new Response("no", { headers: { ...html, "set-cookie": "a=b" } })),
    false,
  );
  assert.equal(
    isCacheablePublicResponse(
      new Response("no", { headers: { ...html, "cache-control": "private, no-store" } }),
    ),
    false,
  );
});
