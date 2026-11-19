import { execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";

import { hashPassword } from "better-auth/crypto";

const email = (process.env.OPENAI_REVIEW_ACCOUNT_EMAIL || "openai-review@waitlyze.com")
  .trim()
  .toLowerCase();
const password = process.env.OPENAI_REVIEW_ACCOUNT_PASSWORD;
if (!password) {
  throw new Error("OPENAI_REVIEW_ACCOUNT_PASSWORD environment variable is required.");
}

console.log(`Preparing D1 seed for reviewer account: ${email}`);

const passwordHash = await hashPassword(password);
const newId = () => crypto.randomUUID();

const userId = newId();
const accountId = newId();
const ws1Id = newId();
const ws2Id = newId();
const waitlist1Id = newId();
const waitlist2Id = newId();
const slug1 = `openai-review-${userId.slice(0, 8).toLowerCase()}`;
const slug2 = `openai-secondary-${userId.slice(0, 8).toLowerCase()}`;

function sqlEscape(val) {
  if (val === null || val === undefined) return "NULL";
  return `'${String(val).replace(/'/g, "''")}'`;
}

const escapedEmail = sqlEscape(email);

const sqlStatements = [
  // Clean up any existing entries for this specific reviewer account and workspaces
  `DELETE FROM sign_ups WHERE waitListId IN (SELECT id FROM wait_lists WHERE userId IN (SELECT id FROM users WHERE email = ${escapedEmail}));`,
  `DELETE FROM impressions WHERE waitListId IN (SELECT id FROM wait_lists WHERE userId IN (SELECT id FROM users WHERE email = ${escapedEmail}));`,
  `DELETE FROM marketing_broadcasts WHERE waitListId IN (SELECT id FROM wait_lists WHERE userId IN (SELECT id FROM users WHERE email = ${escapedEmail}));`,
  `DELETE FROM wait_lists WHERE userId IN (SELECT id FROM users WHERE email = ${escapedEmail});`,
  `DELETE FROM workspace_subscriptions WHERE workspaceId IN (SELECT workspaceId FROM workspace_members WHERE userId IN (SELECT id FROM users WHERE email = ${escapedEmail}));`,
  `DELETE FROM workspace_members WHERE userId IN (SELECT id FROM users WHERE email = ${escapedEmail});`,
  `DELETE FROM workspaces WHERE personalOwnerId IN (SELECT id FROM users WHERE email = ${escapedEmail}) OR name IN ('OpenAI Review Workspace', 'OpenAI Secondary Workspace');`,
  `DELETE FROM accounts WHERE userId IN (SELECT id FROM users WHERE email = ${escapedEmail});`,
  `DELETE FROM users WHERE email = ${escapedEmail};`,

  // User
  `INSERT INTO users (id, email, name, emailVerified, isOnboarded, lastWorkspaceId, createdAt, updatedAt)
   VALUES (${sqlEscape(userId)}, ${escapedEmail}, 'OpenAI Review', 1, 1, ${sqlEscape(ws1Id)}, datetime('now'), datetime('now'));`,

  // Account
  `INSERT INTO accounts (id, accountId, providerId, userId, password, createdAt, updatedAt)
   VALUES (${sqlEscape(accountId)}, ${sqlEscape(userId)}, 'credential', ${sqlEscape(userId)}, ${sqlEscape(passwordHash)}, datetime('now'), datetime('now'));`,

  // Primary Workspace
  `INSERT INTO workspaces (id, name, personalOwnerId, createdAt, updatedAt)
   VALUES (${sqlEscape(ws1Id)}, 'OpenAI Review Workspace', ${sqlEscape(userId)}, datetime('now'), datetime('now'));`,

  `INSERT INTO workspace_members (workspaceId, userId, role, createdAt)
   VALUES (${sqlEscape(ws1Id)}, ${sqlEscape(userId)}, 'OWNER', datetime('now'));`,

  `INSERT INTO workspace_subscriptions (workspaceId, plan, status, interval, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, createdAt, updatedAt)
   VALUES (${sqlEscape(ws1Id)}, 'PRO', 'ACTIVE', 'ANNUAL', datetime('now'), datetime('now', '+1 year'), 0, datetime('now'), datetime('now'));`,

  // Primary Waitlist Campaign
  `INSERT INTO wait_lists (id, name, description, status, publicSlug, creationKey, logoUrl, workspaceId, userId, createdAt, updatedAt)
   VALUES (${sqlEscape(waitlist1Id)}, 'OpenAI Review Campaign', 'Sample campaign for OpenAI plugin review.', 'PUBLISHED', ${sqlEscape(slug1)}, 'openai-review-seed', '/apple-icon.png', ${sqlEscape(ws1Id)}, ${sqlEscape(userId)}, datetime('now'), datetime('now'));`,

  // Secondary Workspace
  `INSERT INTO workspaces (id, name, personalOwnerId, createdAt, updatedAt)
   VALUES (${sqlEscape(ws2Id)}, 'OpenAI Secondary Workspace', NULL, datetime('now'), datetime('now'));`,

  `INSERT INTO workspace_members (workspaceId, userId, role, createdAt)
   VALUES (${sqlEscape(ws2Id)}, ${sqlEscape(userId)}, 'OWNER', datetime('now'));`,

  `INSERT INTO workspace_subscriptions (workspaceId, plan, status, interval, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, createdAt, updatedAt)
   VALUES (${sqlEscape(ws2Id)}, 'PRO', 'ACTIVE', 'ANNUAL', datetime('now'), datetime('now', '+1 year'), 0, datetime('now'), datetime('now'));`,

  // Secondary Waitlist Campaign
  `INSERT INTO wait_lists (id, name, description, status, publicSlug, creationKey, logoUrl, workspaceId, userId, createdAt, updatedAt)
   VALUES (${sqlEscape(waitlist2Id)}, 'OpenAI Secondary Campaign', 'Secondary workspace test campaign.', 'DRAFT', ${sqlEscape(slug2)}, 'openai-secondary-seed', '/apple-icon.png', ${sqlEscape(ws2Id)}, ${sqlEscape(userId)}, datetime('now'), datetime('now'));`,
];

// Sample subscribers and impressions for primary campaign
const sampleEmails = [
  "reviewer-alex@example.com",
  "reviewer-blair@example.com",
  "reviewer-casey@example.com",
];

for (const [index, sampleEmail] of sampleEmails.entries()) {
  const impId = newId();
  const signId = newId();
  const refCode = newId();
  const uniqueUserId = `openai-review-user-${index + 1}`;

  sqlStatements.push(`
    INSERT INTO impressions (id, uniqueUserId, deviceType, country, utmSource, waitListId, createdAt, updatedAt)
    VALUES (${sqlEscape(impId)}, ${sqlEscape(uniqueUserId)}, 'desktop', 'US', 'openai-review', ${sqlEscape(waitlist1Id)}, datetime('now', '-${index} day'), datetime('now'));
  `);

  sqlStatements.push(`
    INSERT INTO sign_ups (id, uniqueUserId, referralCode, email, emailNormalized, points, rank, waitListId, impressionId, verifiedAt, marketingConsentAt, createdAt, updatedAt)
    VALUES (${sqlEscape(signId)}, ${sqlEscape(uniqueUserId)}, ${sqlEscape(refCode)}, ${sqlEscape(sampleEmail)}, ${sqlEscape(sampleEmail)}, ${index === 0 ? 2 : 0}, ${index + 1}, ${sqlEscape(waitlist1Id)}, ${sqlEscape(impId)}, datetime('now'), datetime('now'), datetime('now', '-${index} day'), datetime('now'));
  `);
}

// Marketing broadcast draft
const bId = newId();
sqlStatements.push(`
  INSERT INTO marketing_broadcasts (id, waitListId, name, subject, previewText, body, renderedHtml, renderedText, status, createdAt, updatedAt)
  VALUES (${sqlEscape(bId)}, ${sqlEscape(waitlist1Id)}, 'Reviewer launch update', 'A launch update', 'A sample draft for plugin review.', 'Thanks for joining our review campaign.', '<p>Thanks for joining our review campaign.</p>', 'Thanks for joining our review campaign.', 'DRAFT', datetime('now'), datetime('now'));
`);

const seedFile = `/tmp/seed_openai_review_${Date.now()}.sql`;
fs.writeFileSync(seedFile, sqlStatements.join("\n"));

const isRemote = process.argv.includes("--remote");
const targetFlag = isRemote ? "--remote" : "--local";

console.log(`Executing seed on D1 (${targetFlag})...`);
try {
  execSync(`CI=true pnpm wrangler d1 execute waitlyze-db ${targetFlag} --file=${seedFile}`, {
    stdio: "inherit",
  });
} finally {
  try {
    fs.unlinkSync(seedFile);
  } catch {
    // Ignore cleanup errors
  }
}

console.log("\n=========================================");
console.log("✅ Seed executed successfully!");
console.log(`Email:     ${email}`);
console.log(`User ID:   ${userId}`);
console.log(`Primary:   OpenAI Review Workspace (${ws1Id})`);
console.log(`Campaign:  OpenAI Review Campaign (${waitlist1Id})`);
console.log(`Secondary: OpenAI Secondary Workspace (${ws2Id})`);
console.log("Password:  [REDACTED]");
console.log("=========================================\n");
