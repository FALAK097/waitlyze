// Dev-only seed: realistic email-section demo data for one waitlist —
// subscribers in every eligibility bucket, broadcasts in DRAFT / SENDING /
// SENT / CANCELED with mixed recipient statuses, automation runs in
// SENT / SKIPPED / FAILED / scheduled states, and referral edges so the
// referral recipes make sense. All addresses use the falakrmfc@gmail.com
// account so tests land in a real inbox when delivery is configured.
//
// Usage: node --env-file=.env scripts/seed-email-demo.mjs [waitlistId]
//
// Safety: refuses to run unless DATABASE_URL points at localhost. Seeded
// automation runs never create PENDING outbox events, so the dispatcher
// cannot fire them; seeded broadcast recipients are terminal or belong to a
// SENDING broadcast whose pending outbox rows are not created either.

import pg from "pg";

const [waitlistId = "cmv7uz9eq000jfnqxf0rhul3m"] = process.argv.slice(2);
const dbUrl = process.env.DATABASE_URL || "";
if (!/localhost|127\.0\.0\.1/.test(dbUrl)) {
  console.error("Refusing to seed: DATABASE_URL does not point at localhost.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: dbUrl });
const cuid = (prefix) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const iso = (minutesAgo) => new Date(Date.now() - minutesAgo * 60_000).toISOString();
const normalize = (email) => email.trim().toLowerCase();

const messageHtml = (headline, lines) => `<!DOCTYPE html><html><body style="margin:0;background:#f4f6f1;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:24px auto;background:#fff;border-radius:12px;padding:32px;">
    <p style="margin:0 0 12px;font-size:20px;font-weight:700;color:#17261b;">${headline}</p>
    ${lines.map((line) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#3a4a3d;">${line}</p>`).join("")}
    <p style="margin:24px 0 0;font-size:12px;color:#9aa59b;">You are receiving this because you joined the waitlist. Unsubscribe anytime.</p>
  </div>
</body></html>`;

try {
  const { rows: lists } = await pool.query(
    `SELECT id, name, status::text AS status, "workspaceId", "userId" FROM wait_lists WHERE id = $1`,
    [waitlistId],
  );
  if (!lists.length) {
    console.error(`Waitlist not found: ${waitlistId}`);
    process.exit(1);
  }
  const list = lists[0];
  console.log(`Waitlist: ${list.name || "Untitled"} (${waitlistId}, ${list.status})`);
  if (list.status !== "PUBLISHED") {
    await pool.query(`UPDATE wait_lists SET status = 'PUBLISHED' WHERE id = $1`, [waitlistId]);
    console.log("Published the waitlist so broadcast eligibility matches a live list.");
  }

  const { rows: already } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM sign_ups WHERE "waitListId" = $1 AND email LIKE 'emaildemo+%'`,
    [waitlistId],
  );
  if (already[0].count > 0) {
    console.log(`Already seeded (${already[0].count} demo subscribers). Delete the waitlist or its emaildemo+ rows to reseed.`);
    process.exit(0);
  }

  const now = Date.now();
  const profiles = [
    { tag: "01", verified: true, consent: true, unsub: false, sent: true },
    { tag: "02", verified: true, consent: true, unsub: false, sent: true },
    { tag: "03", verified: true, consent: true, unsub: false, sent: true },
    { tag: "04", verified: true, consent: true, unsub: false, sent: true },
    { tag: "05", verified: true, consent: true, unsub: false, sent: true },
    { tag: "06", verified: true, consent: true, unsub: false, sent: true },
    { tag: "07", verified: true, consent: true, unsub: false, sent: true },
    { tag: "08", verified: true, consent: true, unsub: false, sent: true },
    { tag: "09", verified: true, consent: false, unsub: false, sent: false },
    { tag: "10", verified: true, consent: true, unsub: true, sent: false },
    { tag: "11", verified: false, consent: false, unsub: false, sent: false },
    { tag: "12", verified: false, consent: false, unsub: false, sent: false },
  ];
  const signups = [];
  for (const profile of profiles) {
    const email = `emaildemo+${profile.tag}@gmail.com`;
    const id = cuid("s");
    const created = iso(60 * 24 * (14 - Number(profile.tag)));
    await pool.query(
      `INSERT INTO sign_ups (id, "uniqueUserId", "referralCode", email, "emailNormalized", "waitListId", "points", "signUpEmailSent", "verifiedAt", "marketingConsentAt", "marketingUnsubscribedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)`,
      [
        id, cuid("u"), crypto.randomUUID(), email, normalize(email), waitlistId,
        profile.tag === "02" ? 3 : profile.tag === "01" ? 1 : 0,
        profile.sent, profile.verified ? created : null, profile.consent ? created : null,
        profile.unsub ? iso(60 * 6) : null, created,
      ],
    );
    if (profile.consent) {
      await pool.query(
        `INSERT INTO marketing_consent_events (id, "waitListId", "signUpId", action, source, "consentText", "createdAt")
         VALUES ($1, $2, $3, 'OPTED_IN', 'PUBLIC_SIGNUP', 'Send me product updates.', $4)`,
        [cuid("m"), waitlistId, id, created],
      );
    }
    signups.push({ id, email, ...profile });
  }
  console.log(`Created ${signups.length} demo subscribers (8 fully eligible, plus no-consent / unsubscribed / unverified).`);

  // Referral edges: 01 referred by 02 (verified), 03 referred by 02 (pending).
  const byTag = Object.fromEntries(signups.map((s) => [s.tag, s]));
  await pool.query(
    `INSERT INTO referrals (id, "signUpId", "referredById", "reviewStatus", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'APPROVED', $4, $4)`,
    [cuid("r"), byTag["01"].id, byTag["02"].id, iso(60 * 24 * 5)],
  );
  await pool.query(
    `INSERT INTO referrals (id, "signUpId", "referredById", "reviewStatus", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'CLEAR', $4, $4)`,
    [cuid("r"), byTag["03"].id, byTag["02"].id, iso(60 * 24 * 2)],
  );

  // Automation recipes (off, so nothing sends) + runs in every status.
  const recipeDefs = [
    { type: "WELCOME", subject: "You’re on {{waitlist}}", body: "Thanks for confirming. Your personal link: {{referral_link}}", delayMinutes: 0 },
    { type: "REFERRAL_REMINDER", subject: "Share {{waitlist}} with a friend", body: "Know someone who would love this? {{referral_link}}", delayMinutes: 1440 },
    { type: "REFERRAL_MILESTONE", subject: "You helped {{waitlist}} grow", body: "You’ve brought {{referral_count}} people. {{referral_link}}", delayMinutes: 0, milestoneCount: 3 },
  ];
  const recipes = {};
  for (const def of recipeDefs) {
    const existing = (await pool.query(
      `SELECT id FROM automation_recipes WHERE "waitListId" = $1 AND type = $2::"AutomationRecipeType"`,
      [waitlistId, def.type],
    )).rows[0];
    let recipeId = existing?.id;
    if (!recipeId) {
      recipeId = cuid("a");
      const versionId = cuid("v");
      await pool.query(
        `INSERT INTO automation_recipes (id, "waitListId", type, status, "currentVersion", "createdAt", "updatedAt")
         VALUES ($1, $2, $3::"AutomationRecipeType", 'PAUSED', 1, $4, $4)`,
        [recipeId, waitlistId, def.type, iso(60 * 48)],
      );
      await pool.query(
        `INSERT INTO automation_recipe_versions (id, "recipeId", version, config, "createdAt")
         VALUES ($1, $2, 1, $3::jsonb, $4)`,
        [versionId, recipeId, JSON.stringify({ trigger: def.type === "REFERRAL_MILESTONE" ? "REFERRAL_VERIFIED" : "SIGNUP_VERIFIED", delayMinutes: def.delayMinutes, subject: def.subject, body: def.body, ...(def.milestoneCount ? { milestoneCount: def.milestoneCount } : {}) }), iso(60 * 48)],
      );
      recipeId = recipeId;
    } else {
      const version = (await pool.query(
        `SELECT id FROM automation_recipe_versions WHERE "recipeId" = $1 ORDER BY version DESC LIMIT 1`,
        [recipeId],
      )).rows[0];
      if (!version) {
        await pool.query(
          `INSERT INTO automation_recipe_versions (id, "recipeId", version, config, "createdAt")
           VALUES ($1, $2, 1, $3::jsonb, $4)`,
          [cuid("v"), recipeId, JSON.stringify({ trigger: def.type === "REFERRAL_MILESTONE" ? "REFERRAL_VERIFIED" : "SIGNUP_VERIFIED", delayMinutes: def.delayMinutes, subject: def.subject, body: def.body, ...(def.milestoneCount ? { milestoneCount: def.milestoneCount } : {}) }), iso(60 * 48)],
        );
      }
    }
    recipes[def.type] = recipeId;
  }
  console.log("Ensured automation recipes (paused).");

  const runSpecs = [
    { tag: "01", type: "WELCOME", status: "SENT", minutesAgo: 60 * 24 * 13 },
    { tag: "02", type: "WELCOME", status: "SENT", minutesAgo: 60 * 24 * 12 },
    { tag: "03", type: "REFERRAL_REMINDER", status: "SENT", minutesAgo: 60 * 24 * 3 },
    { tag: "04", type: "REFERRAL_REMINDER", status: "SKIPPED", reason: "REFERRALS_ALREADY_VERIFIED", minutesAgo: 60 * 20 },
    { tag: "05", type: "REFERRAL_MILESTONE", status: "SENT", minutesAgo: 60 * 8 },
    { tag: "06", type: "WELCOME", status: "FAILED", reason: "provider_rejected", minutesAgo: 60 * 5 },
    { tag: "07", type: "REFERRAL_REMINDER", status: "PENDING", minutesAgo: -60 * 30 },
    { tag: "08", type: "WELCOME", status: "CANCELED", reason: "AUTOMATION_PAUSED", minutesAgo: 60 * 3 },
  ];
  for (const spec of runSpecs) {
    const signup = byTag[spec.tag];
    const recipeId = recipes[spec.type];
    const version = (await pool.query(
      `SELECT id FROM automation_recipe_versions WHERE "recipeId" = $1 ORDER BY version DESC LIMIT 1`,
      [recipeId],
    )).rows[0];
    const runId = cuid("n");
    const at = iso(Math.abs(spec.minutesAgo));
    const scheduledAt = spec.status === "PENDING" ? new Date(Date.now() + 30 * 60_000).toISOString() : at;
    const finished = ["SENT", "SKIPPED", "FAILED", "CANCELED"].includes(spec.status);
    await pool.query(
      `INSERT INTO automation_runs (id, "recipeId", "recipeVersionId", "waitListId", "signUpId", "triggerKey", status, "scheduledAt", "startedAt", "finishedAt", "skipReason", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7::"AutomationRunStatus", $8, $9, $10, $11, $8)`,
      [runId, recipeId, version.id, waitlistId, signup.id, `demo:${spec.type}:${spec.tag}`, spec.status, scheduledAt, finished ? at : null, finished ? at : null, spec.reason || null],
    );
    if (spec.status !== "SKIPPED") {
      const stepKey = "send_email";
      const stepId = cuid("t");
      const stepStatus = spec.status === "PENDING" ? "PENDING" : spec.status === "CANCELED" ? "CANCELED" : spec.status;
      await pool.query(
        `INSERT INTO automation_run_steps (id, "runId", "stepKey", position, status, "availableAt", "outboxEventKey", "lastErrorCode", "createdAt", "finishedAt")
         VALUES ($1, $2, $3, 0, $4::"AutomationStepStatus", $5, $6, $7, $5, $8)`,
        [stepId, runId, stepKey, stepStatus, scheduledAt, `automation.step:${runId}:${stepKey}`, spec.status === "FAILED" ? (spec.reason || "provider_error") : spec.status === "CANCELED" ? "AUTOMATION_PAUSED" : null, finished ? at : null],
      );
      // Terminal events so the dispatcher never picks these up.
      if (spec.status !== "PENDING") {
        await pool.query(
          `INSERT INTO outbox_events (id, "eventKey", type, payload, status, attempts, "availableAt", "createdAt", "processedAt", "waitListId", "lastErrorCode")
           VALUES ($1, $2, 'MARKETING_AUTOMATION_STEP_REQUESTED', $3::jsonb, $4::"OutboxStatus", $5, $6, $6, $7, $8, $9)
           ON CONFLICT ("eventKey") DO NOTHING`,
          [cuid("o"), `automation.step:${runId}:${stepKey}`, JSON.stringify({ automationStepId: stepId }), spec.status === "SENT" ? "DELIVERED" : "FAILED", spec.status === "SENT" ? 1 : 0, at, at, waitlistId, spec.status === "SENT" ? null : "DEMO_SEED"],
        );
      }
    }
  }
  console.log(`Created ${runSpecs.length} automation runs (sent / skipped / failed / canceled / scheduled).`);

  const broadcastSpecs = [
    { name: "Product update #1", subject: "We shipped dark mode", previewText: "Plus a faster join flow for your referrals.", status: "SENT", minutesAgo: 60 * 24 * 2, headline: "Product update #1", lines: ["We shipped dark mode, a faster join flow, and better referral tracking.", "Your personal link still works exactly as before."] },
    { name: "Weekly digest", subject: "This week on the waitlist", previewText: "Milestone progress and a new invite copy.", status: "SENDING", minutesAgo: 45, headline: "This week", lines: ["Your waitlist crossed a new milestone.", "Keep sharing your link to move up the line."] },
    { name: "Ideas — do not send", subject: "", previewText: "", status: "DRAFT", minutesAgo: 90, headline: "", lines: [] },
    { name: "Flash sale (canceled)", subject: "Early access pricing", previewText: "48 hours only.", status: "CANCELED", minutesAgo: 60 * 24 * 6, headline: "Early access", lines: ["This send was canceled before delivery completed."] },
  ];
  const eligible = signups.filter((s) => s.verified && s.consent && !s.unsub);
  for (const spec of broadcastSpecs) {
    const broadcastId = cuid("b");
    const at = iso(Math.abs(spec.minutesAgo));
    const isDraft = spec.status === "DRAFT";
    const recipientCount = isDraft ? 0 : eligible.length;
    await pool.query(
      `INSERT INTO marketing_broadcasts (id, "waitListId", name, subject, "previewText", body, "editorDocument", "renderedHtml", "renderedText", status, "recipientCount", "createdAt", "updatedAt", "sentAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10::"BroadcastStatus", $11, $12, $12, $13)`,
      [
        broadcastId, waitlistId, spec.name, spec.subject, spec.previewText,
        spec.lines.join("\n\n"),
        isDraft ? null : JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: spec.lines.map((line) => ({ type: "text", text: line })) }] }),
        isDraft ? null : messageHtml(spec.headline, spec.lines),
        isDraft ? null : `${spec.headline}\n\n${spec.lines.join("\n\n")}`,
        spec.status, recipientCount, at,
        ["SENT", "CANCELED"].includes(spec.status) ? at : null,
      ],
    );
    if (isDraft) continue;
    const statuses = spec.status === "SENDING"
      ? ["DELIVERED", "DELIVERED", "PROCESSING", "PENDING", "FAILED"]
      : ["DELIVERED", "DELIVERED", "DELIVERED", "FAILED", "SKIPPED", "CANCELED"];
    for (const [index, signup] of eligible.entries()) {
      const rowStatus = statuses[index % statuses.length];
      await pool.query(
        `INSERT INTO broadcast_recipients (id, "broadcastId", "signUpId", email, "emailNormalized", status, "providerMessageId", "lastErrorCode", "deliveredAt", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6::"BroadcastRecipientStatus", $7, $8, $9, $10)
         ON CONFLICT ("broadcastId", "signUpId") DO NOTHING`,
        [
          cuid("c"), broadcastId, signup.id, signup.email, normalize(signup.email), rowStatus,
          rowStatus === "DELIVERED" ? `demo${crypto.randomUUID().slice(0, 8)}` : null,
          rowStatus === "FAILED" ? "provider_rejected" : rowStatus === "SKIPPED" ? "SUPPRESSED" : rowStatus === "CANCELED" ? "BROADCAST_CANCELED" : null,
          rowStatus === "DELIVERED" ? at : null, at,
        ],
      );
    }
  }
  console.log(`Created ${broadcastSpecs.length} broadcasts (draft / sending / sent / canceled) with mixed recipient statuses.`);
  console.log("Done. Open Emails → Broadcasts / Automations / Logs to review the seeded data.");
} finally {
  await pool.end();
}
