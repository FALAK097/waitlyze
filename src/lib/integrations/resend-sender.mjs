import { resolveWorkspaceEmailSender } from "./email-sender.mjs";

export function createWorkspaceResendSender({ db, defaults, createClient }) {
  const configByWorkspace = new Map();
  return async ({ to, subject, html, headers, idempotencyKey, workspaceId }) => {
    const cacheKey = workspaceId || "default";
    if (!configByWorkspace.has(cacheKey)) configByWorkspace.set(cacheKey, resolveWorkspaceEmailSender(db, workspaceId, null));
    const provider = await configByWorkspace.get(cacheKey) || defaults;
    const resend = createClient(provider.apiKey);
    return resend.emails.send({ from: provider.fromEmail, to, subject, replyTo: defaults.replyTo, html, ...(headers ? { headers } : {}) }, { idempotencyKey });
  };
}
