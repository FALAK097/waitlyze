import { resolveWorkspaceEmailSender } from "./email-sender.mjs";

export function createWorkspaceResendSender({ db, defaults, createClient }) {
  const configByWorkspace = new Map();
  // Resolve each workspace's provider once per dispatcher. Never cache a
  // rejection: a transient database error must not fail every later send for
  // that workspace, so drop the entry and let the next call resolve again.
  const resolveProvider = (workspaceId, cacheKey) => {
    if (!configByWorkspace.has(cacheKey)) {
      const pending = resolveWorkspaceEmailSender(db, workspaceId, null).catch((error) => {
        configByWorkspace.delete(cacheKey);
        throw error;
      });
      configByWorkspace.set(cacheKey, pending);
    }
    return configByWorkspace.get(cacheKey);
  };
  return async ({ to, subject, html, text, headers, idempotencyKey, workspaceId }) => {
    const cacheKey = workspaceId || "default";
    const provider = (await resolveProvider(workspaceId, cacheKey)) || defaults;
    const resend = createClient(provider.apiKey);
    return resend.emails.send({ from: provider.fromEmail, to, subject, replyTo: provider.replyTo || defaults.replyTo, html, ...(text ? { text } : {}), ...(headers ? { headers } : {}) }, { idempotencyKey });
  };
}
