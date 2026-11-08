const API_ORIGIN = "https://api.cloudflare.com/client/v4";

/** Send a single transactional message through the customer's Email Sending account. */
export async function sendCloudflareEmail(
  { accountId, apiToken, fromEmail, replyTo, to, subject, html, text },
  { fetchFn = fetch } = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetchFn(
      `${API_ORIGIN}/accounts/${encodeURIComponent(accountId)}/email/sending/send`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to,
          subject,
          ...(html ? { html } : {}),
          ...(text ? { text } : {}),
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      },
    );
    const data = await response.json().catch(() => ({}));
    const messageId = data?.result?.message_id || data?.result?.messageId;
    if (!response.ok || data?.success === false || !messageId) {
      throw Object.assign(new Error("Cloudflare could not send this transactional email."), {
        code: data?.errors?.[0]?.code || `HTTP_${response.status}`,
        statusCode: response.status,
      });
    }
    return { data: { id: messageId }, result: data.result };
  } catch (error) {
    if (error.code) throw error;
    throw Object.assign(new Error("Could not reach Cloudflare Email Sending."), {
      code: error.name === "AbortError" ? "EMAIL_PROVIDER_TIMEOUT" : "EMAIL_PROVIDER_UNREACHABLE",
      statusCode: null,
    });
  } finally {
    clearTimeout(timeout);
  }
}
