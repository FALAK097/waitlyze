#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

import pg from "pg";
import { Resend } from "resend";

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
  const batchSize = Math.max(1, parseInt(getArg("--batch-size") || "25", 10));
  const delayMs = Math.max(0, parseInt(getArg("--delay-ms") || "500", 10));

  console.log("=== Waitlyze Changelog Release Broadcast ===");

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
    const dbUrl = process.env.DATABASE_URL;
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
      `\n[DRY-RUN] Finished preview for ${recipients.length} recipients. No emails were sent.`,
    );
    return;
  }

  // 4. Initialize Resend
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY environment variable is missing.");
  }

  const resend = new Resend(resendApiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Waitlyze <noreply@waitlyze.com>";
  const replyTo = process.env.RESEND_REPLY_TO || "support@waitlyze.com";

  console.log(`Sender: ${fromEmail}`);
  console.log(`Reply-To: ${replyTo}`);
  console.log(`Starting delivery to ${recipients.length} recipients...`);

  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    console.log(`\nSending batch ${Math.floor(i / batchSize) + 1} (${batch.length} recipients)...`);

    await Promise.all(
      batch.map(async (recipient) => {
        const idempotencyKey = `changelog-release:${version}:${recipient.id || recipient.email}`;
        try {
          const { error } = await resend.emails.send(
            {
              from: fromEmail,
              to: recipient.email,
              replyTo,
              subject,
              html,
              text,
            },
            { idempotencyKey },
          );

          if (error) {
            console.error(`  [FAILED] ${recipient.email}:`, error.message || error);
            failedCount++;
          } else {
            console.log(`  [OK] ${recipient.email}`);
            sentCount++;
          }
        } catch (err) {
          console.error(`  [ERROR] ${recipient.email}:`, err.message);
          failedCount++;
        }
      }),
    );

    if (i + batchSize < recipients.length && delayMs > 0) {
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }

  console.log("\n========================================");
  console.log(`Broadcast summary for ${version}:`);
  console.log(`  Total: ${recipients.length}`);
  console.log(`  Accepted / Sent: ${sentCount}`);
  console.log(`  Failed: ${failedCount}`);
  console.log("========================================");

  if (failedCount > 0 && sentCount === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Broadcast failed:", err);
  process.exit(1);
});
