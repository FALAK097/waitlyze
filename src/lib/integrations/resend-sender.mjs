import { resolveEmailSender } from "@/lib/email/sender-resolution.mjs";

// Phase 7c: this factory is the ONE sending path wired end-to-end to the
// per-waitlist BYOK seam. Pass waitListId per send (or as a factory default)
// and a CONNECTED per-waitlist sender wins over the workspace connection;
// omit it and resolution behaves exactly as before (workspace → default).
// Every other sending path keeps calling without waitListId until the
// follow-ups listed in sender-resolution.mjs land — that is intentional,
// not an oversight. Never cache a rejection (see below).
export function createWorkspaceResendSender({
  db,
  defaults,
  createClient,
  waitListId: defaultWaitListId = null,
}) {
  const configByKey = new Map();
  // Resolve each workspace+waitlist pair once per dispatcher. Never cache a
  // rejection: a transient database error must not fail every later send for
  // that scope, so drop the entry and let the next call resolve again.
  const resolveProvider = (workspaceId, waitListId, cacheKey) => {
    if (!configByKey.has(cacheKey)) {
      const pending = resolveEmailSender(db, { workspaceId, waitListId, defaults }).catch(
        (error) => {
          configByKey.delete(cacheKey);
          throw error;
        },
      );
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
    const provider = (await resolveProvider(workspaceId, waitListId, cacheKey)) || defaults;
    const resend = createClient(provider.apiKey);
    return resend.emails.send(
      {
        from: provider.fromEmail,
        to,
        subject,
        replyTo: provider.replyTo || defaults.replyTo,
        html,
        ...(text ? { text } : {}),
        ...(headers ? { headers } : {}),
      },
      { idempotencyKey },
    );
  };
}
