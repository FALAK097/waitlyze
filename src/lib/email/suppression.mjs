const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export async function applyKnownProviderEvents(db, providerMessageId, workspaceId, recipient) {
  if (!workspaceId) return;
  const events = await db.emailProviderEvent.findMany({
    where: { providerMessageId, OR: [{ type: "email.complained" }, { type: "email.bounced", isPermanent: true }] },
    orderBy: { type: "asc" },
  });
  for (const event of events) {
    const emailNormalized = normalizeEmail(recipient);
    if (!emailNormalized) continue;
    await db.emailSuppression.upsert({
      where: { workspaceId_emailNormalized: { workspaceId, emailNormalized } },
      create: { workspaceId, emailNormalized, reason: event.type === "email.complained" ? "COMPLAINT" : "BOUNCE" },
      update: { reason: event.type === "email.complained" ? "COMPLAINT" : "BOUNCE" },
    });
  }
}
