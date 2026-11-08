import { resolveEmailSender } from "@/lib/email/sender-resolution.mjs";

// Customer messages may use only a connected per-waitlist or workspace sender.
// Waitlyze's deployment Resend key is reserved for platform product emails.
// Never cache a rejection: a transient database error must not fail every
// later send for that scope, so drop the entry and resolve it again.
export function createWorkspaceResendSender({
  db,
  createClient,
  waitListId: defaultWaitListId = null,
}) {
  const configByKey = new Map();
  // Resolve each workspace+waitlist pair once per dispatcher. Never cache a
  // rejection: a transient database error must not fail every later send for
  // that scope, so drop the entry and let the next call resolve again.
  const resolveProvider = (workspaceId, waitListId, cacheKey) => {
    if (!configByKey.has(cacheKey)) {
      const pending = resolveEmailSender(db, { workspaceId, waitListId }).catch((error) => {
        configByKey.delete(cacheKey);
        throw error;
      });
      configByKey.set(cacheKey, pending);
    }
    return configByKey.get(cacheKey);
  };
  return async ({
    to,
    subject,
    html,
    text,
    headers,
    idempotencyKey,
    workspaceId,
    waitListId = defaultWaitListId,
  }) => {
    const cacheKey = `${workspaceId || "default"}:${waitListId || "-"}`;
    const provider = await resolveProvider(workspaceId, waitListId, cacheKey);
    const resend = createClient(provider.apiKey);
    return resend.emails.send(
      {
        from: provider.fromEmail,
        to,
        subject,
        replyTo: provider.replyTo || provider.fromEmail,
        html,
        ...(text ? { text } : {}),
        ...(headers ? { headers } : {}),
      },
      { idempotencyKey },
    );
  };
}
