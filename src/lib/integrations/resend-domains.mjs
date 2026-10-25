const DOMAINS_URL = "https://api.resend.com/domains";

/**
 * Lists the domains on the founder's own Resend account (BYOK). The API key
 * is only ever sent to Resend over HTTPS — it is never logged, persisted,
 * or included in any error surfaced to the browser.
 */
export async function listResendDomains(apiKey, { fetchFn = fetch } = {}) {
  let response;
  try {
    response = await fetchFn(DOMAINS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw Object.assign(new Error("Could not reach Resend. Check your connection and try again."), {
      statusCode: 502,
      code: "RESEND_PROVIDER_UNREACHABLE",
    });
  }
  if (!response.ok) {
    const error = new Error(
      response.status === 401
        ? "Resend rejected the API key. Check the key and try again."
        : "Resend could not list domains for this key. Try again in a moment.",
    );
    error.statusCode = 502;
    error.code = response.status === 401 ? "RESEND_KEY_REJECTED" : "RESEND_DOMAINS_FAILED";
    throw error;
  }
  const body = await response.json().catch(() => ({}));
  const domains = Array.isArray(body?.data) ? body.data : [];
  return domains
    .filter((domain) => domain && typeof domain.name === "string")
    .map((domain) => ({
      id: typeof domain.id === "string" ? domain.id : null,
      name: domain.name,
      status: typeof domain.status === "string" ? domain.status : "unknown",
      createdAt: typeof domain.created_at === "string" ? domain.created_at : null,
    }));
}
