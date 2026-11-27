import { proxyPostHogRequest } from "@/lib/posthog/proxy.mjs";

export async function GET(request) {
  return proxyPostHogRequest(request);
}

export async function HEAD(request) {
  return proxyPostHogRequest(request);
}

export async function POST(request) {
  return proxyPostHogRequest(request);
}

export async function OPTIONS(request) {
  return proxyPostHogRequest(request);
}
