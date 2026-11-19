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

const sqlStatements = [
  // Clean up any existing entries
  `DELETE FROM sign_ups;`,
  `DELETE FROM impressions;`,
  `DELETE FROM marketing_broadcasts;`,
  `DELETE FROM wait_lists;`,
  `DELETE FROM workspace_subscriptions;`,
  `DELETE FROM workspace_members;`,
  `DELETE FROM workspaces;`,
  `DELETE FROM accounts;`,
  `DELETE FROM users;`,

  // User
  `INSERT INTO users (id, email, name, emailVerified, isOnboarded, lastWorkspaceId, createdAt, updatedAt)
   VALUES ('${userId}', '${email}', 'OpenAI Review', 1, 1, '${ws1Id}', datetime('now'), datetime('now'));`,

  // Account
  `INSERT INTO accounts (id, accountId, providerId, userId, password, createdAt, updatedAt)
   VALUES ('${accountId}', '${userId}', 'credential', '${userId}', '${passwordHash}', datetime('now'), datetime('now'));`,

  // Primary Workspace
  `INSERT INTO workspaces (id, name, personalOwnerId, createdAt, updatedAt)
   VALUES ('${ws1Id}', 'OpenAI Review Workspace', '${userId}', datetime('now'), datetime('now'));`,

  `INSERT INTO workspace_members (workspaceId, userId, role, createdAt)
   VALUES ('${ws1Id}', '${userId}', 'OWNER', datetime('now'));`,

  `INSERT INTO workspace_subscriptions (workspaceId, plan, status, interval, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, createdAt, updatedAt)
   VALUES ('${ws1Id}', 'PRO', 'ACTIVE', 'ANNUAL', datetime('now'), datetime('now', '+1 year'), 0, datetime('now'), datetime('now'));`,

  // Primary Waitlist Campaign
  `INSERT INTO wait_lists (id, name, description, status, publicSlug, creationKey, logoUrl, workspaceId, userId, createdAt, updatedAt)
   VALUES ('${waitlist1Id}', 'OpenAI Review Campaign', 'Sample campaign for OpenAI plugin review.', 'PUBLISHED', '${slug1}', 'openai-review-seed', '/apple-icon.png', '${ws1Id}', '${userId}', datetime('now'), datetime('now'));`,

  // Secondary Workspace
  `INSERT INTO workspaces (id, name, personalOwnerId, createdAt, updatedAt)
   VALUES ('${ws2Id}', 'OpenAI Secondary Workspace', NULL, datetime('now'), datetime('now'));`,

  `INSERT INTO workspace_members (workspaceId, userId, role, createdAt)
   VALUES ('${ws2Id}', '${userId}', 'OWNER', datetime('now'));`,

  `INSERT INTO workspace_subscriptions (workspaceId, plan, status, interval, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, createdAt, updatedAt)
   VALUES ('${ws2Id}', 'PRO', 'ACTIVE', 'ANNUAL', datetime('now'), datetime('now', '+1 year'), 0, datetime('now'), datetime('now'));`,

  // Secondary Waitlist Campaign
  `INSERT INTO wait_lists (id, name, description, status, publicSlug, creationKey, logoUrl, workspaceId, userId, createdAt, updatedAt)
   VALUES ('${waitlist2Id}', 'OpenAI Secondary Campaign', 'Secondary workspace test campaign.', 'DRAFT', '${slug2}', 'openai-secondary-seed', '/apple-icon.png', '${ws2Id}', '${userId}', datetime('now'), datetime('now'));`,
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
    VALUES ('${impId}', '${uniqueUserId}', 'desktop', 'US', 'openai-review', '${waitlist1Id}', datetime('now', '-${index} day'), datetime('now'));
  `);

  sqlStatements.push(`
    INSERT INTO sign_ups (id, uniqueUserId, referralCode, email, emailNormalized, points, rank, waitListId, impressionId, verifiedAt, marketingConsentAt, createdAt, updatedAt)
    VALUES ('${signId}', '${uniqueUserId}', '${refCode}', '${sampleEmail}', '${sampleEmail}', ${index === 0 ? 2 : 0}, ${index + 1}, '${waitlist1Id}', '${impId}', datetime('now'), datetime('now'), datetime('now', '-${index} day'), datetime('now'));
  `);
}

// Marketing broadcast draft
const bId = newId();
sqlStatements.push(`
  INSERT INTO marketing_broadcasts (id, waitListId, name, subject, previewText, body, renderedHtml, renderedText, status, createdAt, updatedAt)
  VALUES ('${bId}', '${waitlist1Id}', 'Reviewer launch update', 'A launch update', 'A sample draft for plugin review.', 'Thanks for joining our review campaign.', '<p>Thanks for joining our review campaign.</p>', 'Thanks for joining our review campaign.', 'DRAFT', datetime('now'), datetime('now'));
`);

const seedFile = `/tmp/seed_openai_review_${Date.now()}.sql`;
fs.writeFileSync(seedFile, sqlStatements.join("\n"));
console.log(`Generated seed file at ${seedFile}`);

const isRemote = process.argv.includes("--remote");
const targetFlag = isRemote ? "--remote" : "--local";

console.log(`Executing seed on D1 (${targetFlag})...`);
execSync(`CI=true pnpm wrangler d1 execute waitlyze-db ${targetFlag} --file=${seedFile}`, {
  stdio: "inherit",
});

console.log("\n=========================================");
console.log("✅ Seed executed successfully!");
console.log(`Email:     ${email}`);
console.log(`Password:  ${password}`);
console.log(`User ID:   ${userId}`);
console.log(`Primary:   OpenAI Review Workspace (${ws1Id})`);
console.log(`Campaign:  OpenAI Review Campaign (${waitlist1Id})`);
console.log(`Secondary: OpenAI Secondary Workspace (${ws2Id})`);
console.log("=========================================\n");
