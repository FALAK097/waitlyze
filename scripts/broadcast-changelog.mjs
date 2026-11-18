#!/usr/bin/env node
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import pg from "pg";

import { renderChangelogEmailHtml } from "../src/emails/changelog-email.mjs";
import { changelogReleaseText } from "../src/emails/text.mjs";
import { parseChangelog } from "../src/lib/changelog.js";

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return null;
}

const hasFlag = (flag) => process.argv.includes(flag);

async function main() {
  const isDryRun = hasFlag("--dry-run");
  const testRecipient = getArg("--test");
  const requestedVersion = getArg("--version");
  const dbUrl = process.env.DATABASE_URL;

  console.log("=== Waitlyze Changelog Release Broadcast (Cloudflare Platform Email) ===");

  // 1. Parse CHANGELOG.md
  const changelogRaw = readFileSync(join(process.cwd(), "CHANGELOG.md"), "utf8");
  const releases = parseChangelog(changelogRaw);

  if (!releases || releases.length === 0) {
    throw new Error("No releases found in CHANGELOG.md.");
  }

  const release = requestedVersion
    ? releases.find((r) => r.version === requestedVersion)
    : releases[0];

  if (!release) {
    throw new Error(
      `Release ${requestedVersion || "latest"} not found in CHANGELOG.md. Available: ${releases.map((r) => r.version).join(", ")}`,
    );
  }

  const version = release.version;
  const changelogUrl = `https://waitlyze.com/docs/changelog#${release.id}`;
  const subject = `Waitlyze ${version}: ${release.title}`;

  console.log(`Release: ${version} (${release.date})`);
  console.log(`Title: ${release.title}`);
  console.log(`Subject: ${subject}`);
  console.log(`Changelog URL: ${changelogUrl}`);
  console.log(`Features count: ${release.features?.length || 0}`);
  console.log(`Fixes count: ${release.fixes?.length || 0}`);

  // 2. Render Email HTML and Plain Text
  const emailProps = {
    version,
    date: release.date,
    title: release.title,
    summary: release.summary,
    features: release.features,
    fixes: release.fixes,
    changelogUrl,
  };

  const html = await renderChangelogEmailHtml(emailProps);
  const text = changelogReleaseText(emailProps);

  if (!html || !text) {
    throw new Error("Failed to render changelog email template.");
  }

  // 3. Resolve Recipients
  let recipients = [];
  if (testRecipient) {
    console.log(`\nMode: TEST SEND to single recipient: ${testRecipient}`);
    recipients = [{ id: "test", email: testRecipient.trim().toLowerCase(), name: "Tester" }];
  } else {
    if (!dbUrl) {
      throw new Error("DATABASE_URL is required to fetch platform users.");
    }

    const pool = new pg.Pool({ connectionString: dbUrl });
    try {
      const res = await pool.query(
        `SELECT id, email, name FROM users WHERE email IS NOT NULL AND email != '' ORDER BY "createdAt" ASC`,
      );
      recipients = res.rows;
    } finally {
      await pool.end();
    }

    console.log(`\nFetched ${recipients.length} platform users from database.`);
  }

  if (recipients.length === 0) {
    console.log("No recipients found. Exiting.");
    return;
  }

  if (isDryRun) {
    console.log("\n[DRY-RUN] Sample recipients (first 5):");
    recipients
      .slice(0, 5)
      .forEach((u, i) => console.log(`  ${i + 1}. ${u.email} (${u.name || "No name"})`));
    console.log(
      `\n[DRY-RUN] Previewing Text output:\n----------------------------------------\n${text}\n----------------------------------------`,
    );
    console.log(
      `\n[DRY-RUN] Finished preview for ${recipients.length} recipients. No outbox rows were written.`,
    );
    return;
  }

  if (!dbUrl) {
    throw new Error("DATABASE_URL is required to enqueue outbox events.");
  }

  // 4. Enqueue into Outbox (Cloudflare Platform Sender: FOUNDER_NOTICE_REQUESTED)
  console.log(`\nEnqueueing ${recipients.length} notices into outbox table...`);
  const pool = new pg.Pool({ connectionString: dbUrl });

  let enqueuedCount = 0;
  try {
    for (const recipient of recipients) {
      const email = recipient.email.trim().toLowerCase();
      const eventKey = `founder-notice:changelog-release:${version}:${email}`;
      const payload = {
        kind: "changelog_release",
        to: email,
        subject,
        html,
        text,
        idempotencyKey: `changelog-release:${version}:${email}`,
      };

      const res = await pool.query(
        `INSERT INTO outbox_events ("id", "eventKey", "type", "payload", "status", "availableAt", "createdAt")
         VALUES ($1, $2, 'FOUNDER_NOTICE_REQUESTED', $3, 'PENDING', NOW(), NOW())
         ON CONFLICT ("eventKey") DO NOTHING
         RETURNING "id"`,
        [`evt_${randomUUID().replace(/-/g, "").slice(0, 24)}`, eventKey, JSON.stringify(payload)],
      );

      if (res.rowCount > 0) {
        enqueuedCount++;
        console.log(`  [ENQUEUED] ${email}`);
      } else {
        console.log(`  [SKIPPED - DUPLICATE] ${email}`);
      }
    }
  } finally {
    await pool.end();
  }

  console.log(
    `\nSuccessfully enqueued ${enqueuedCount} release notices for Cloudflare Email delivery.`,
  );

  // 5. Trigger Immediate Dispatch if OUTBOX_DISPATCH_SECRET is set
  const dispatchSecret = process.env.OUTBOX_DISPATCH_SECRET;
  const appUrl = (
    process.env.APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "https://waitlyze.com"
  ).replace(/\/$/, "");

  if (dispatchSecret) {
    console.log(
      `Triggering Cloudflare Email outbox dispatcher at ${appUrl}/api/internal/email-outbox...`,
    );
    try {
      const response = await fetch(`${appUrl}/api/internal/email-outbox`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${dispatchSecret}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[OK] Cloudflare dispatcher response:`, result);
      } else {
        console.warn(`[WARN] Dispatcher HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (err) {
      console.warn(`[WARN] Could not reach dispatcher endpoint: ${err.message}`);
      console.log("Notices remain queued in outbox and will be drained by Cloudflare worker cron.");
    }
  } else {
    console.log(
      "OUTBOX_DISPATCH_SECRET not provided locally. Notices will be drained by Cloudflare worker cron.",
    );
  }

  console.log("\n========================================");
  console.log(`Broadcast summary for ${version}:`);
  console.log(`  Total users: ${recipients.length}`);
  console.log(`  Enqueued into outbox: ${enqueuedCount}`);
  console.log(`  Platform sender: Cloudflare Email Sending (noreply@waitlyze.com)`);
  console.log("========================================");
}

main().catch((err) => {
  console.error("Broadcast failed:", err);
  process.exit(1);
});
