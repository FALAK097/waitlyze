const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

/**
 * A verified provider event whose delivery belongs to a different workspace.
 * Callers must acknowledge (not reject) these: when one provider account fans
 * an event out to several workspace endpoints, a 4xx would make the provider
 * retry and eventually disable the endpoint for everyone.
 */
export class WebhookWorkspaceMismatchError extends TypeError {
  constructor(message = "Webhook event does not belong to this workspace.") {
    super(message);
    this.name = "WebhookWorkspaceMismatchError";
  }
}

async function suppress(db, workspaceId, recipient, type) {
  const emailNormalized = normalizeEmail(recipient);
  if (!workspaceId || !emailNormalized) return;
  const reason = type === "email.complained" ? "COMPLAINT" : "BOUNCE";
  await db.emailSuppression.upsert({
    where: { workspaceId_emailNormalized: { workspaceId, emailNormalized } },
    create: { workspaceId, emailNormalized, reason },
    // A later bounce must not downgrade a previous complaint.
    update: reason === "COMPLAINT" ? { reason } : {},
  });
}

export async function applyKnownProviderEvents(db, providerMessageId, workspaceId, recipient) {
  if (!workspaceId) return;
  const emailNormalized = normalizeEmail(recipient);
  if (!emailNormalized) return;
  const events = await db.emailProviderEvent.findMany({
    where: {
      providerMessageId,
      recipientEmails: { has: emailNormalized },
      AND: [
        { OR: [{ workspaceId: null }, { workspaceId }] },
        { OR: [{ type: "email.complained" }, { type: "email.bounced", isPermanent: true }] },
      ],
    },
    orderBy: { type: "asc" },
  });
  for (const event of events) await suppress(db, workspaceId, emailNormalized, event.type);
}

async function deliveryRecipient(db, messageId) {
  const delivery = await db.outboxEvent.findFirst({
    where: { providerMessageId: messageId },
    select: { waitListId: true, payload: true },
  });
  if (!delivery?.waitListId) return null;
  const waitList = await db.waitList.findUnique({
    where: { id: delivery.waitListId },
    select: { workspaceId: true },
  });
  if (!waitList?.workspaceId) return null;
  const payload = delivery.payload;
  let recipient;
  if (typeof payload?.recipientId === "string" && typeof payload.broadcastId === "string") {
    const row = await db.broadcastRecipient.findFirst({
      where: {
        id: payload.recipientId,
        broadcastId: payload.broadcastId,
        providerMessageId: messageId,
        broadcast: { waitListId: delivery.waitListId },
      },
      select: { email: true, emailNormalized: true },
    });
    recipient = row?.emailNormalized || row?.email;
  } else if (typeof payload?.automationStepId === "string") {
    const step = await db.automationRunStep.findFirst({
      where: {
        id: payload.automationStepId,
        providerMessageId: messageId,
        run: { waitListId: delivery.waitListId },
      },
      select: { run: { select: { signUp: { select: { email: true, emailNormalized: true } } } } },
    });
    if (step)
      recipient =
        payload.recipientEmail || step.run?.signUp?.emailNormalized || step.run?.signUp?.email;
  } else if (typeof payload?.signUpId === "string") {
    const signup = await db.signUp.findFirst({
      where: { id: payload.signUpId, waitListId: delivery.waitListId },
      select: { email: true, emailNormalized: true },
    });
    if (signup) recipient = payload.recipientEmail || signup.emailNormalized || signup.email;
  }
  return recipient ? { workspaceId: waitList.workspaceId, recipient } : null;
}

/** Called only after the provider signature has been verified by the route. */
export async function recordVerifiedProviderEvent(db, event, eventId, expectedWorkspaceId = null) {
  const messageId = event?.data?.email_id;
  if (typeof eventId !== "string" || !eventId || typeof messageId !== "string" || !messageId)
    throw new TypeError("Invalid event payload");
  if (!["email.bounced", "email.complained"].includes(event.type)) return;
  const recipients = Array.isArray(event.data?.to) ? event.data.to : [event.data?.to];
  const recipientEmails = [
    ...new Set(
      recipients
        .slice(0, 100)
        .map(normalizeEmail)
        .filter((email) => email && email.length <= 320),
    ),
  ];
  const isPermanent = event.type === "email.complained" || event.data?.bounce?.type === "Permanent";
  const target = await deliveryRecipient(db, messageId);
  if (expectedWorkspaceId && target && target.workspaceId !== expectedWorkspaceId)
    throw new WebhookWorkspaceMismatchError();
  await db.emailProviderEvent.upsert({
    where: { providerEventId: eventId },
    create: {
      providerEventId: eventId,
      providerMessageId: messageId,
      workspaceId: target?.workspaceId ?? null,
      type: event.type,
      isPermanent,
      recipientEmails,
    },
    update: {},
  });
  if (!isPermanent) return;
  if (target && recipientEmails.includes(normalizeEmail(target.recipient)))
    await suppress(db, target.workspaceId, target.recipient, event.type);
}

// Cloudflare Email Sending event-subscription types (published to a Queue).
// Deferred/delivered/failed/rejected events are acknowledged but not stored.
const CLOUDFLARE_SENDING_EVENT_TYPES = new Set([
  "cf.email.sending.message.bounced",
  "cf.email.sending.message.complained",
]);

/**
 * Ingest a Cloudflare Email Sending lifecycle event (delivered via the
 * account's event subscription) and apply permanent bounces/complaints to
 * workspace suppression, mirroring the Resend webhook path. Called only from
 * the secret-authenticated internal route fed by the queue consumer.
 */
export async function recordCloudflareSendingEvent(db, event) {
  if (typeof event !== "object" || event === null) throw new TypeError("Invalid event payload");
  if (!CLOUDFLARE_SENDING_EVENT_TYPES.has(event.type)) return "ignored";
  const payload = event.payload || {};
  const eventId = payload.eventId;
  const messageId = payload.messageId;
  const recipient = normalizeEmail(payload.recipient);
  if (
    typeof eventId !== "string" ||
    !eventId ||
    typeof messageId !== "string" ||
    !messageId ||
    !recipient ||
    recipient.length > 320
  )
    throw new TypeError("Invalid event payload");
  const type =
    event.type === "cf.email.sending.message.complained" ? "email.complained" : "email.bounced";
  // A soft bounce whose retries are exhausted is terminal for this delivery.
  const isPermanent =
    type === "email.complained" || payload.terminal === true || payload.bounce?.type === "hard";

  // Map the delivery back to its workspace by the provider message id the
  // outbox recorded for it. When nothing matches (the id is saved just after
  // the send, or the send predates id recording), store the event
  // workspace-neutral instead of guessing from the sender address: several
  // workspaces can save the same fromEmail, so a guess could pick the wrong
  // one and stop that workspace's mail to this recipient, and the wrong
  // workspaceId would also make applyKnownProviderEvents skip the event for
  // the real sender. A neutral event is applied as soon as the message id
  // identifies the delivery.
  const target = await deliveryRecipient(db, messageId);
  await db.emailProviderEvent.upsert({
    where: { providerEventId: eventId },
    create: {
      providerEventId: eventId,
      providerMessageId: messageId,
      workspaceId: target?.workspaceId ?? null,
      type,
      isPermanent,
      recipientEmails: [recipient],
    },
    update: {},
  });
  if (!isPermanent || !target) return "recorded";
  await suppress(db, target.workspaceId, recipient, type);
  return "suppressed";
}
