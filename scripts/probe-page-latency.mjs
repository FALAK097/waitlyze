// Measure document or RSC request latency without a browser or load-test dependency.
// Example: node scripts/probe-page-latency.mjs http://localhost:3000/waitlists 20 4
const [rawUrl, rawSamples = "20", rawConcurrency = "4"] = process.argv.slice(2);
if (!rawUrl) {
  console.error("Usage: node scripts/probe-page-latency.mjs <url> [samples=20] [concurrency=4]");
  process.exit(2);
}

const url = new URL(rawUrl);
const samples = Number(rawSamples);
const concurrency = Number(rawConcurrency);
if (
  !["http:", "https:"].includes(url.protocol) ||
  !Number.isInteger(samples) ||
  samples < 1 ||
  samples > 1000 ||
  !Number.isInteger(concurrency) ||
  concurrency < 1 ||
  concurrency > 50
) {
  throw new Error("Use an HTTP URL, 1–1000 samples, and 1–50 concurrent requests.");
}

const timings = [];
const headerTimings = [];
const statuses = new Map();
let next = 0;

async function worker() {
  while (next < samples) {
    next += 1;
    const started = performance.now();
    try {
      const response = await fetch(url, {
        headers: process.env.PROBE_COOKIE ? { Cookie: process.env.PROBE_COOKIE } : {},
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });
      headerTimings.push(performance.now() - started);
      // Consume the body: a streaming response can start quickly but finish slowly.
      await response.arrayBuffer();
      timings.push(performance.now() - started);
      statuses.set(response.status, (statuses.get(response.status) || 0) + 1);
    } catch (error) {
      statuses.set(error.name || "error", (statuses.get(error.name || "error") || 0) + 1);
    }
  }
}

await Promise.all(Array.from({ length: Math.min(samples, concurrency) }, () => worker()));
timings.sort((a, b) => a - b);
headerTimings.sort((a, b) => a - b);
const percentile = (values, fraction) =>
  values.length ? Math.round(values[Math.ceil(values.length * fraction) - 1]) : null;

console.log(
  JSON.stringify(
    {
      url: url.toString(),
      samples,
      concurrency,
      statuses: Object.fromEntries(statuses),
      completed: timings.length,
      headersMs: {
        p50: percentile(headerTimings, 0.5),
        p95: percentile(headerTimings, 0.95),
        p99: percentile(headerTimings, 0.99),
      },
      latencyMs: {
        p50: percentile(timings, 0.5),
        p95: percentile(timings, 0.95),
        p99: percentile(timings, 0.99),
        max: timings.length ? Math.round(timings.at(-1)) : null,
      },
    },
    null,
    2,
  ),
);
