import crypto from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import pg from "pg";

const CONFIRMATION = "seed-review-account";
const dbUrl = process.env.DATABASE_URL || "";
const email = (process.env.OPENAI_REVIEW_ACCOUNT_EMAIL || "").trim().toLowerCase();
const password = process.env.OPENAI_REVIEW_ACCOUNT_PASSWORD || "";

if (process.env.OPENAI_REVIEW_SEED_CONFIRM !== CONFIRMATION) {
  throw new Error(`Set OPENAI_REVIEW_SEED_CONFIRM=${CONFIRMATION} to confirm the production seed.`);
}
if (!dbUrl) throw new Error("DATABASE_URL is required.");
if (!/^\S+@\S+\.\S+$/.test(email)) {
  throw new Error("OPENAI_REVIEW_ACCOUNT_EMAIL must be a valid dedicated reviewer email.");
}
if (password.length < 16) {
  throw new Error("OPENAI_REVIEW_ACCOUNT_PASSWORD must be at least 16 characters.");
}

const pool = new pg.Pool({ connectionString: dbUrl, max: 1 });
const client = await pool.connect();
const newId = () => crypto.randomUUID();

try {
  await client.query("BEGIN");

  let user = (
    await client.query(`SELECT id FROM users WHERE email = $1 LIMIT 1 FOR UPDATE`, [email])
  ).rows[0];
  if (!user) {
    user = (
      await client.query(
        `INSERT INTO users
          (id, email, name, "emailVerified", "isOnboarded", "createdAt", "updatedAt")
         VALUES ($1, $2, 'OpenAI Review', true, true, NOW(), NOW())
         RETURNING id`,
        [newId(), email],
      )
    ).rows[0];
  } else {
    await client.query(
      `UPDATE users
       SET name = 'OpenAI Review', "emailVerified" = true, "isOnboarded" = true, "updatedAt" = NOW()
       WHERE id = $1`,
      [user.id],
    );
  }

  const passwordHash = await hashPassword(password);
  const credentialAccount = (
    await client.query(
      `SELECT id FROM accounts
       WHERE "userId" = $1 AND "providerId" = 'credential' AND "accountId" = $1
       LIMIT 1`,
      [user.id],
    )
  ).rows[0];
  if (credentialAccount) {
    await client.query(`UPDATE accounts SET password = $2, "updatedAt" = NOW() WHERE id = $1`, [
      credentialAccount.id,
      passwordHash,
    ]);
  } else {
    await client.query(
      `INSERT INTO accounts
        (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, 'credential', $2, $3, NOW(), NOW())`,
      [newId(), user.id, passwordHash],
    );
  }

  let workspace = (
    await client.query(
      `SELECT id FROM workspaces WHERE "personalOwnerId" = $1 LIMIT 1 FOR UPDATE`,
      [user.id],
    )
  ).rows[0];
  if (!workspace) {
    workspace = (
      await client.query(
        `INSERT INTO workspaces
          (id, name, "personalOwnerId", "createdAt", "updatedAt")
         VALUES ($1, 'OpenAI Review Workspace', $2, NOW(), NOW())
         RETURNING id`,
        [newId(), user.id],
      )
    ).rows[0];
  } else {
    await client.query(
      `UPDATE workspaces SET name = 'OpenAI Review Workspace', "updatedAt" = NOW() WHERE id = $1`,
      [workspace.id],
    );
  }

  await client.query(
    `INSERT INTO workspace_members ("workspaceId", "userId", role, "createdAt")
     VALUES ($1, $2, 'OWNER', NOW())
     ON CONFLICT ("workspaceId", "userId") DO UPDATE SET role = 'OWNER'`,
    [workspace.id, user.id],
  );
  await client.query(`UPDATE users SET "lastWorkspaceId" = $2 WHERE id = $1`, [
    user.id,
    workspace.id,
  ]);
  await client.query(
    `INSERT INTO workspace_subscriptions
      ("workspaceId", plan, status, interval, "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt")
     VALUES ($1, 'PRO', 'ACTIVE', 'ANNUAL', NOW(), NOW() + INTERVAL '1 year', NOW(), NOW())
     ON CONFLICT ("workspaceId") DO UPDATE SET
       plan = 'PRO', status = 'ACTIVE', interval = 'ANNUAL',
       "currentPeriodStart" = NOW(), "currentPeriodEnd" = NOW() + INTERVAL '1 year',
       "cancelAtPeriodEnd" = false, "updatedAt" = NOW()`,
    [workspace.id],
  );

  let waitlist = (
    await client.query(
      `SELECT id FROM wait_lists
       WHERE "workspaceId" = $1 AND "creationKey" = 'openai-review-seed'
       LIMIT 1 FOR UPDATE`,
      [workspace.id],
    )
  ).rows[0];
  if (!waitlist) {
    waitlist = (
      await client.query(
        `INSERT INTO wait_lists
          (id, name, description, status, "publicSlug", "creationKey", "logoUrl", "workspaceId", "userId", "createdAt", "updatedAt")
         VALUES ($1, 'OpenAI Review Campaign', 'Sample campaign for OpenAI plugin review.',
           'PUBLISHED', $2, 'openai-review-seed', '/apple-icon.png', $3, $4, NOW(), NOW())
         RETURNING id`,
        [newId(), `openai-review-${user.id.slice(0, 8).toLowerCase()}`, workspace.id, user.id],
      )
    ).rows[0];
  } else {
    await client.query(
      `UPDATE wait_lists SET
        name = 'OpenAI Review Campaign',
        description = 'Sample campaign for OpenAI plugin review.',
        status = 'PUBLISHED', "logoUrl" = '/apple-icon.png', "updatedAt" = NOW()
       WHERE id = $1`,
      [waitlist.id],
    );
  }

  const sampleEmails = [
    "reviewer-alex@example.com",
    "reviewer-blair@example.com",
    "reviewer-casey@example.com",
  ];
  for (const [index, sampleEmail] of sampleEmails.entries()) {
    const uniqueUserId = `openai-review-user-${index + 1}`;
    const impression = (
      await client.query(
        `INSERT INTO impressions
          (id, "uniqueUserId", "deviceType", country, "utmSource", "waitListId", "createdAt", "updatedAt")
         VALUES ($1, $2, 'desktop', 'US', 'openai-review', $3, NOW() - ($4 * INTERVAL '1 day'), NOW())
         ON CONFLICT ("waitListId", "uniqueUserId") DO UPDATE SET "updatedAt" = NOW()
         RETURNING id`,
        [newId(), uniqueUserId, waitlist.id, index],
      )
    ).rows[0];
    await client.query(
      `INSERT INTO sign_ups
        (id, "uniqueUserId", "referralCode", email, "emailNormalized", points, rank,
         "waitListId", "impressionId", "verifiedAt", "marketingConsentAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, NOW(), NOW(),
         NOW() - ($9 * INTERVAL '1 day'), NOW())
       ON CONFLICT ("waitListId", "emailNormalized") DO UPDATE SET
         "verifiedAt" = NOW(), "marketingConsentAt" = NOW(), points = EXCLUDED.points,
         rank = EXCLUDED.rank, "impressionId" = EXCLUDED."impressionId", "updatedAt" = NOW()`,
      [
        newId(),
        uniqueUserId,
        newId(),
        sampleEmail,
        index === 0 ? 2 : 0,
        index + 1,
        waitlist.id,
        impression.id,
        index,
      ],
    );
  }

  const draftExists = (
    await client.query(
      `SELECT id FROM marketing_broadcasts
       WHERE "waitListId" = $1 AND name = 'Reviewer launch update' LIMIT 1`,
      [waitlist.id],
    )
  ).rows[0];
  if (!draftExists) {
    await client.query(
      `INSERT INTO marketing_broadcasts
        (id, "waitListId", name, subject, "previewText", body, "renderedHtml", "renderedText", status, "createdAt", "updatedAt")
       VALUES ($1, $2, 'Reviewer launch update', 'A launch update',
         'A sample draft for plugin review.', 'Thanks for joining our review campaign.',
         '<p>Thanks for joining our review campaign.</p>',
         'Thanks for joining our review campaign.', 'DRAFT', NOW(), NOW())`,
      [newId(), waitlist.id],
    );
  }

  await client.query("COMMIT");
  console.log(`Reviewer account ready: ${email}`);
  console.log(`Workspace: OpenAI Review Workspace (${workspace.id})`);
  console.log(`Campaign: OpenAI Review Campaign (${waitlist.id})`);
  console.log("The password was not printed. Store it only in the OpenAI review details form.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
