const normalizeEmail = (email) => typeof email === "string" ? email.trim().toLowerCase() : "";

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
    where: { providerMessageId, recipientEmails: { has: emailNormalized }, OR: [{ type: "email.complained" }, { type: "email.bounced", isPermanent: true }] },
    orderBy: { type: "asc" },
  });
  for (const event of events) await suppress(db, workspaceId, emailNormalized, event.type);
}

async function deliveryRecipient(db, messageId) {
  const delivery = await db.outboxEvent.findFirst({ where: { providerMessageId: messageId }, select: { waitListId: true, payload: true } });
  if (!delivery?.waitListId) return null;
  const waitList = await db.waitList.findUnique({ where: { id: delivery.waitListId }, select: { workspaceId: true } });
  if (!waitList?.workspaceId) return null;
  const payload = delivery.payload;
  let recipient;
  if (typeof payload?.recipientId === "string" && typeof payload.broadcastId === "string") {
    const row = await db.broadcastRecipient.findFirst({ where: { id: payload.recipientId, broadcastId: payload.broadcastId, providerMessageId: messageId, broadcast: { waitListId: delivery.waitListId } }, select: { email: true, emailNormalized: true } });
    recipient = row?.emailNormalized || row?.email;
  } else if (typeof payload?.automationStepId === "string") {
    const step = await db.automationRunStep.findFirst({ where: { id: payload.automationStepId, providerMessageId: messageId, run: { waitListId: delivery.waitListId } }, select: { run: { select: { signUp: { select: { email: true, emailNormalized: true } } } } } });
    if (step) recipient = payload.recipientEmail || step.run?.signUp?.emailNormalized || step.run?.signUp?.email;
  } else if (typeof payload?.signUpId === "string") {
    const signup = await db.signUp.findFirst({ where: { id: payload.signUpId, waitListId: delivery.waitListId }, select: { email: true, emailNormalized: true } });
    if (signup) recipient = payload.recipientEmail || signup.emailNormalized || signup.email;
  }
  return recipient ? { workspaceId: waitList.workspaceId, recipient } : null;
}

/** Called only after the provider signature has been verified by the route. */
export async function recordVerifiedProviderEvent(db, event, eventId) {
  const messageId = event?.data?.email_id;
  if (typeof eventId !== "string" || !eventId || typeof messageId !== "string" || !messageId) throw new TypeError("Invalid event payload");
  if (!["email.bounced", "email.complained"].includes(event.type)) return;
  const recipients = Array.isArray(event.data?.to) ? event.data.to : [event.data?.to];
  const recipientEmails = [...new Set(recipients.slice(0, 100).map(normalizeEmail).filter((email) => email && email.length <= 320))];
  const isPermanent = event.type === "email.complained" || event.data?.bounce?.type === "Permanent";
  await db.emailProviderEvent.upsert({
    where: { providerEventId: eventId },
    create: { providerEventId: eventId, providerMessageId: messageId, type: event.type, isPermanent, recipientEmails },
    update: {},
  });
  if (!isPermanent) return;
  const target = await deliveryRecipient(db, messageId);
  if (target && recipientEmails.includes(normalizeEmail(target.recipient))) await suppress(db, target.workspaceId, target.recipient, event.type);
}
