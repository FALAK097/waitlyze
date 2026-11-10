// scripts/seed-rich-showcase.mjs
// Realistic showcase demo data for Waitlyze screenshots and product showcase.
// Populates rich waitlists, subscribers, referrals, impressions, email broadcasts,
// and automations for preview-owner@waitlyze.local.

import crypto from "node:crypto";

import dotenv from "dotenv";
import pg from "pg";

import { snapshotTemplate } from "../src/lib/templates/catalog.mjs";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "";
let dbHost = "";
try {
  dbHost = new URL(dbUrl).hostname;
} catch {}

if (!["localhost", "127.0.0.1", "[::1]"].includes(dbHost)) {
  console.error("Refusing to seed: DATABASE_URL must point to localhost. Found:", dbHost);
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: dbUrl });

function cuid(prefix = "c") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function subDays(days, hours = 0, mins = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours, d.getMinutes() - mins);
  return d;
}

const FIRST_NAMES = [
  "Elena",
  "Marcus",
  "Sofia",
  "Alex",
  "Sarah",
  "Liam",
  "Maya",
  "Julian",
  "Aria",
  "David",
  "Chloe",
  "Lucas",
  "Amara",
  "Nathan",
  "Zoe",
  "Gabriel",
  "Isabella",
  "Kai",
  "Emily",
  "Oliver",
  "Mia",
  "Leo",
  "Hannah",
  "Noah",
  "Freya",
  "Ethan",
  "Leila",
  "Soren",
  "Tara",
  "Mateo",
  "Clara",
  "Felix",
  "Nora",
  "Caleb",
  "Ivy",
  "Jasper",
  "Stella",
  "Owen",
  "Ruby",
  "Silas",
  "Lila",
  "Arthur",
  "Mila",
  "Finn",
  "Gemma",
  "Wyatt",
  "Hazel",
  "Milo",
  "Esme",
  "Theodore",
];

const LAST_NAMES = [
  "Rostova",
  "Chen",
  "Patel",
  "Thorne",
  "Jenkins",
  "Vance",
  "Lin",
  "Karr",
  "Gomez",
  "Kim",
  "Sinclair",
  "Holloway",
  "Dubois",
  "Mercer",
  "Novak",
  "Kowalski",
  "Sterling",
  "O'Connor",
  "Takahashi",
  "Al-Mansoor",
  "Lindqvist",
  "Fontana",
  "Moreau",
  "Vanderbilt",
  "Schneider",
  "Santos",
  "Popov",
  "Larsson",
  "Bauer",
  "Ricci",
  "Navarro",
  "Abebe",
  "Fischer",
  "Castillo",
  "Tanaka",
  "Berg",
  "Nakamura",
  "Morales",
  "Vogel",
  "Kruger",
];

const COUNTRIES = [
  { code: "US", name: "United States", city: "San Francisco", lat: "37.7749", lng: "-122.4194" },
  { code: "US", name: "United States", city: "New York", lat: "40.7128", lng: "-74.0060" },
  { code: "GB", name: "United Kingdom", city: "London", lat: "51.5074", lng: "-0.1278" },
  { code: "DE", name: "Germany", city: "Berlin", lat: "52.5200", lng: "13.4050" },
  { code: "CA", name: "Canada", city: "Toronto", lat: "43.6532", lng: "-79.3832" },
  { code: "FR", name: "France", city: "Paris", lat: "48.8566", lng: "2.3522" },
  { code: "JP", name: "Japan", city: "Tokyo", lat: "35.6762", lng: "139.6503" },
  { code: "IN", name: "India", city: "Bengaluru", lat: "12.9716", lng: "77.5946" },
  { code: "AU", name: "Australia", city: "Sydney", lat: "-33.8688", lng: "151.2093" },
  { code: "NL", name: "Netherlands", city: "Amsterdam", lat: "52.3676", lng: "4.9041" },
];

const SOURCES = [
  { utmSource: "producthunt", utmMedium: "launch", referrer: "https://www.producthunt.com" },
  { utmSource: "twitter", utmMedium: "social", referrer: "https://t.co" },
  { utmSource: "linkedin", utmMedium: "feed", referrer: "https://www.linkedin.com" },
  { utmSource: "github", utmMedium: "readme", referrer: "https://github.com" },
  { utmSource: "newsletter", utmMedium: "email", referrer: "" },
  { utmSource: "", utmMedium: "", referrer: "" },
];

const DEVICES = [
  { device: "Macintosh", deviceType: "desktop" },
  { device: "Macintosh", deviceType: "desktop" },
  { device: "Windows", deviceType: "desktop" },
  { device: "iPhone", deviceType: "mobile" },
  { device: "Android", deviceType: "mobile" },
];

function createCustomizedSnapshot({
  name,
  eyebrow = "PRIVATE BETA",
  tagline,
  description,
  buttonText = "Request early access",
  placeholder = "name@company.com",
}) {
  const base = snapshotTemplate("saas");
  const sections = base.sections.map((sec) => {
    if (sec.type === "navigation") {
      return { ...sec, brand: name, buttonText };
    }
    if (sec.type === "hero") {
      return {
        ...sec,
        eyebrow,
        heading: tagline || sec.heading,
        body: description || sec.body,
      };
    }
    if (sec.type === "form") {
      return {
        ...sec,
        heading: `Request early access to ${name}`,
        body: "Join our early supporter cohort and receive your private access link.",
      };
    }
    return sec;
  });

  return {
    ...base,
    sections,
    form: {
      ...base.form,
      buttonText,
      placeholder,
    },
  };
}

async function main() {
  console.log("Seeding rich showcase data...");

  // 1. Get or create dedicated demo user and workspace
  const showcaseEmail = process.env.SHOWCASE_USER_EMAIL || "alex@waitlyze.local";
  const userRes = await pool.query(
    `SELECT wm."workspaceId", u.* FROM users u
     LEFT JOIN workspace_members wm ON wm."userId" = u.id
     WHERE u.email IN ($1, 'preview-owner@waitlyze.local')
     ORDER BY CASE WHEN u.email = $1 THEN 0 ELSE 1 END LIMIT 1`,
    [showcaseEmail],
  );

  let user = userRes.rows[0];
  let workspaceId = user?.workspaceId;

  if (!user) {
    const userId = cuid("u");
    await pool.query(
      `INSERT INTO users (id, name, email, "emailVerified", "isOnboarded", "createdAt", "updatedAt")
       VALUES ($1, 'Alex Rivera', $2, true, true, NOW(), NOW())`,
      [userId, showcaseEmail],
    );
    const uRow = await pool.query(`SELECT * FROM users WHERE email = $1`, [showcaseEmail]);
    user = uRow.rows[0];
  }

  if (!workspaceId) {
    workspaceId = cuid("ws");
    await pool.query(
      `INSERT INTO workspaces (id, name, "personalOwnerId", "createdAt", "updatedAt")
       VALUES ($1, 'Nova Studio Workspace', $2, NOW(), NOW())`,
      [workspaceId, user.id],
    );
    await pool.query(
      `INSERT INTO workspace_members ("workspaceId", "userId", role, "createdAt")
       VALUES ($1, $2, 'OWNER', NOW())`,
      [workspaceId, user.id],
    );
  }

  await pool.query(`UPDATE users SET "isOnboarded" = true, name = 'Alex Rivera' WHERE id = $1`, [
    user.id,
  ]);

  // 2. Set Pro Subscription
  await pool.query(
    `
    INSERT INTO workspace_subscriptions ("workspaceId", plan, status, interval, "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt")
    VALUES ($1, 'PRO', 'ACTIVE', 'ANNUAL', $2, $3, $2, $2)
    ON CONFLICT ("workspaceId")
    DO UPDATE SET plan = 'PRO', status = 'ACTIVE', interval = 'ANNUAL', "currentPeriodStart" = $2, "currentPeriodEnd" = $3, "updatedAt" = NOW()
  `,
    [workspaceId, subDays(30), subDays(-335)],
  );
  console.log(
    "Workspace upgraded to PRO plan with full analytics, email marketing & custom domains.",
  );

  // 3. Clear existing signups/impressions for this workspace to ensure clean high quality data
  const existingWaitlists = await pool.query(`SELECT id FROM wait_lists WHERE "workspaceId" = $1`, [
    workspaceId,
  ]);
  for (const wl of existingWaitlists.rows) {
    await pool.query(`DELETE FROM impressions WHERE "waitListId" = $1`, [wl.id]);
    await pool.query(`DELETE FROM sign_ups WHERE "waitListId" = $1`, [wl.id]);
    await pool.query(`DELETE FROM marketing_broadcasts WHERE "waitListId" = $1`, [wl.id]);
    await pool.query(`DELETE FROM automation_recipes WHERE "waitListId" = $1`, [wl.id]);
    await pool.query(`DELETE FROM webhook_subscriptions WHERE "waitListId" = $1`, [wl.id]);
  }

  // 4. Update / Upsert Primary Waitlist: Nova Studio
  const novaId = "cmw7nr6iu0002iz6lhgh24pxa";
  const novaSnapshot = createCustomizedSnapshot({
    name: "Nova Studio",
    tagline: "The real-time collaborative canvas.",
    description:
      "Infinite boards, generative design systems, and instant multiplayer sync for modern product teams.",
    buttonText: "Request early access",
    placeholder: "Enter your work email...",
  });

  await pool.query(
    `
    INSERT INTO wait_lists (
      id, name, "publicSlug", description, "websiteUrl",
      "buttonColor", "buttonBorder", "buttonTextColor",
      "badgeColor", "badgeText", "badgeTextColor",
      "showBadge", "showReferrals", "showBranding", "showSocialProof",
      "buttonText", "placeholderText", "successMessage",
      status, "publishedRevision", "publishedTemplateRevision", "templateRevision", "templateSnapshot",
      "sendEmailsToSubscribers", "userId", "workspaceId",
      "createdAt", "updatedAt"
    )
    VALUES (
      $1, 'Nova Studio', 'nova-studio',
      'The real-time collaborative canvas for modern product and design teams. Seamless generative layouts, infinite boards, and instant component sync.',
      'https://novastudio.ai',
      '#10b981', '#059669', '#ffffff',
      '#10b981', 'BETA COHORT 1', '#ffffff',
      true, true, false, true,
      'Request early access', 'Enter your work email...',
      'You are on the list! Check your inbox for your private referral link.',
      'PUBLISHED', 1, 1, 1, $5,
      true, $2, $3,
      $4, $4
    )
    ON CONFLICT (id)
    DO UPDATE SET
      name = 'Nova Studio',
      "publicSlug" = 'nova-studio',
      description = 'The real-time collaborative canvas for modern product and design teams. Seamless generative layouts, infinite boards, and instant component sync.',
      "websiteUrl" = 'https://novastudio.ai',
      "buttonColor" = '#10b981',
      "badgeText" = 'BETA COHORT 1',
      "badgeColor" = '#10b981',
      "showBadge" = true,
      "showReferrals" = true,
      "showBranding" = false,
      "showSocialProof" = true,
      status = 'PUBLISHED',
      "publishedRevision" = 1,
      "publishedTemplateRevision" = 1,
      "templateRevision" = 1,
      "templateSnapshot" = $5,
      "sendEmailsToSubscribers" = true,
      "userId" = $2,
      "workspaceId" = $3,
      "updatedAt" = NOW()
  `,
    [novaId, user.id, workspaceId, subDays(30), JSON.stringify(novaSnapshot)],
  );

  await pool.query(
    `
    INSERT INTO wait_list_publication_revisions (
      id, "waitListId", revision, "templateRevision", snapshot, "createdAt"
    ) VALUES (
      $1, $2, 1, 1, $3, NOW()
    )
    ON CONFLICT ("waitListId", revision)
    DO UPDATE SET snapshot = $3
  `,
    [cuid("pr"), novaId, JSON.stringify(novaSnapshot)],
  );

  const hyperFocusId = "cmw7hyperfocus0001iz6l74of9yrx";
  const hyperFocusSnapshot = createCustomizedSnapshot({
    name: "HyperFocus AI",
    tagline: "Deep work and distraction shield for engineers.",
    description: "Smart calendar blocks, context switching prevention, and AI-driven flow states.",
    buttonText: "Join waitlist",
    placeholder: "name@company.com",
  });

  const hyperRes = await pool.query(
    `
    INSERT INTO wait_lists (
      id, name, "publicSlug", description, "websiteUrl",
      "buttonColor", "buttonTextColor", status, "publishedRevision", "publishedTemplateRevision",
      "templateRevision", "templateSnapshot", "userId", "workspaceId",
      "createdAt", "updatedAt"
    ) VALUES (
      $1, 'HyperFocus AI', 'hyperfocus',
      'Intelligent focus blocks and distraction shield for engineers.',
      'https://hyperfocus.dev',
      '#6366f1', '#ffffff', 'PUBLISHED', 1, 1,
      1, $5, $2, $3,
      $4, $4
    )
    ON CONFLICT ("publicSlug")
    DO UPDATE SET
      name = 'HyperFocus AI',
      description = 'Intelligent focus blocks and distraction shield for engineers.',
      "websiteUrl" = 'https://hyperfocus.dev',
      "buttonColor" = '#6366f1',
      status = 'PUBLISHED',
      "publishedRevision" = 1,
      "publishedTemplateRevision" = 1,
      "templateRevision" = 1,
      "templateSnapshot" = $5,
      "userId" = $2,
      "workspaceId" = $3,
      "updatedAt" = NOW()
    RETURNING id
  `,
    [hyperFocusId, user.id, workspaceId, subDays(18), JSON.stringify(hyperFocusSnapshot)],
  );
  const actualHyperFocusId = hyperRes.rows[0].id;

  await pool.query(
    `
    INSERT INTO wait_list_publication_revisions (
      id, "waitListId", revision, "templateRevision", snapshot, "createdAt"
    ) VALUES (
      $1, $2, 1, 1, $3, NOW()
    )
    ON CONFLICT ("waitListId", revision)
    DO UPDATE SET snapshot = $3
  `,
    [cuid("pr"), actualHyperFocusId, JSON.stringify(hyperFocusSnapshot)],
  );

  const devPulseId = "cmw7devpulse00001iz6l74of9yrx";
  const devPulseRes = await pool.query(
    `
    INSERT INTO wait_lists (
      id, name, "publicSlug", description, "websiteUrl",
      "buttonColor", "buttonTextColor", status, "userId", "workspaceId",
      "createdAt", "updatedAt"
    ) VALUES (
      $1, 'DevPulse CLI', 'devpulse',
      'Distributed systems telemetry streamed directly to terminal stdout.',
      'https://devpulse.sh',
      '#0f172a', '#ffffff', 'DRAFT', $2, $3,
      $4, $4
    )
    ON CONFLICT ("publicSlug")
    DO UPDATE SET
      name = 'DevPulse CLI',
      description = 'Distributed systems telemetry streamed directly to terminal stdout.',
      "websiteUrl" = 'https://devpulse.sh',
      "buttonColor" = '#0f172a',
      status = 'DRAFT',
      "userId" = $2,
      "workspaceId" = $3,
      "updatedAt" = NOW()
    RETURNING id
  `,
    [devPulseId, user.id, workspaceId, subDays(5)],
  );
  const actualDevPulseId = devPulseRes.rows[0].id;

  await pool.query(`DELETE FROM wait_lists WHERE id NOT IN ($1, $2, $3) AND "workspaceId" = $4`, [
    novaId,
    actualHyperFocusId,
    actualDevPulseId,
    workspaceId,
  ]);

  // 6. Generate 340 Subscribers for Nova Studio with authentic curves
  console.log("Generating subscribers and referrals for Nova Studio...");
  const subscribers = [];
  const topReferrers = [];

  // Top 10 viral champions
  const leaders = [
    { name: "Elena Rostova", email: "elena.rostova@designworks.io", referrals: 44, points: 195 },
    { name: "Marcus Chen", email: "marcus@chenlabs.co", referrals: 32, points: 145 },
    { name: "Sofia Patel", email: "sofia.patel@acme-ventures.com", referrals: 24, points: 112 },
    { name: "Alex Thorne", email: "alex.thorne@vector-graphics.dev", referrals: 19, points: 88 },
    { name: "Sarah Jenkins", email: "sarah.j@productcraft.org", referrals: 15, points: 72 },
    { name: "Liam Vance", email: "vance.liam@studioflow.cc", referrals: 12, points: 58 },
    { name: "Maya Lin", email: "maya@lin-collective.design", referrals: 10, points: 48 },
    { name: "Julian Karr", email: "julian@karr-media.com", referrals: 8, points: 38 },
    { name: "Aria Gomez", email: "aria@gomez-consulting.io", referrals: 7, points: 34 },
    { name: "David Kim", email: "david.kim@hyper-scale.net", referrals: 5, points: 26 },
  ];

  let currentRank = 1;

  for (const leader of leaders) {
    const signupId = cuid("s");
    const created = subDays(28, Math.floor(Math.random() * 12), Math.floor(Math.random() * 59));
    const loc = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const src = SOURCES[Math.floor(Math.random() * 3)];
    const dev = DEVICES[0];

    await pool.query(
      `
      INSERT INTO sign_ups (
        id, "uniqueUserId", "referralCode", email, "emailNormalized",
        "waitListId", points, rank, device, "deviceType",
        city, country, latitude, longitude,
        "utmSource", "utmMedium", referrer,
        "signUpEmailSent", "verifiedAt", "marketingConsentAt",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17,
        true, $18, $18,
        $18, $18
      )
    `,
      [
        signupId,
        cuid("u"),
        crypto.randomUUID(),
        leader.email,
        leader.email.toLowerCase(),
        novaId,
        leader.points,
        currentRank++,
        dev.device,
        dev.deviceType,
        loc.city,
        loc.code,
        loc.lat,
        loc.lng,
        src.utmSource,
        src.utmMedium,
        src.referrer,
        created,
      ],
    );

    subscribers.push({ id: signupId, email: leader.email, created });
    topReferrers.push({ id: signupId, remaining: leader.referrals });
  }

  // Now generate remaining ~310 subscribers spread across days 27 down to 0
  let refPoolIdx = 0;
  for (let i = 11; i <= 325; i++) {
    const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const domain = [
      "gmail.com",
      "hey.com",
      "outlook.com",
      "proton.me",
      "fastmail.com",
      "apple.com",
      "company.io",
    ][Math.floor(Math.random() * 7)];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${Math.floor(Math.random() * 89 + 10)}@${domain}`;

    // Weight towards recent days
    const day = Math.min(27, Math.floor(Math.pow(Math.random(), 1.4) * 28));
    const created = subDays(day, Math.floor(Math.random() * 23), Math.floor(Math.random() * 59));
    const loc = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const src = SOURCES[Math.floor(Math.random() * SOURCES.length)];
    const dev = DEVICES[Math.floor(Math.random() * DEVICES.length)];

    let referredById = null;
    const points = 5; // base verified signup points

    if (topReferrers[refPoolIdx] && topReferrers[refPoolIdx].remaining > 0) {
      referredById = topReferrers[refPoolIdx].id;
      topReferrers[refPoolIdx].remaining--;
      if (topReferrers[refPoolIdx].remaining === 0) refPoolIdx++;
    }

    const signupId = cuid("s");
    await pool.query(
      `
      INSERT INTO sign_ups (
        id, "uniqueUserId", "referralCode", email, "emailNormalized",
        "waitListId", points, rank, device, "deviceType",
        city, country, latitude, longitude,
        "utmSource", "utmMedium", referrer,
        "signUpEmailSent", "verifiedAt", "marketingConsentAt",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17,
        true, $18, $18,
        $18, $18
      )
    `,
      [
        signupId,
        cuid("u"),
        crypto.randomUUID(),
        email,
        email.toLowerCase(),
        novaId,
        points,
        currentRank++,
        dev.device,
        dev.deviceType,
        loc.city,
        loc.code,
        loc.lat,
        loc.lng,
        src.utmSource,
        src.utmMedium,
        src.referrer,
        created,
      ],
    );

    if (referredById) {
      await pool.query(
        `
        INSERT INTO referrals (id, "signUpId", "referredById", "reviewStatus", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'CLEAR', $4, $4)
      `,
        [cuid("r"), signupId, referredById, created],
      );
    }

    subscribers.push({ id: signupId, email, created });
  }

  // 7. Seed ~1,850 impressions to produce a realistic ~17.6% conversion rate
  console.log("Generating impressions for analytics trends...");
  for (let day = 29; day >= 0; day--) {
    // Generate ~50-80 impressions per day, peaking on launch week
    const dailyCount = Math.floor(55 + (29 - day) * 1.5 + Math.sin(day) * 15);
    for (let k = 0; k < dailyCount; k++) {
      const created = subDays(day, Math.floor(Math.random() * 23), Math.floor(Math.random() * 59));
      const loc = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      const src = SOURCES[Math.floor(Math.random() * SOURCES.length)];
      const dev = DEVICES[Math.floor(Math.random() * DEVICES.length)];

      await pool.query(
        `
        INSERT INTO impressions (
          id, "uniqueUserId", device, "deviceType",
          city, country, latitude, longitude,
          "utmSource", "utmMedium", referrer,
          "waitListId", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11,
          $12, $13, $13
        )
      `,
        [
          cuid("i"),
          cuid("u"),
          dev.device,
          dev.deviceType,
          loc.city,
          loc.code,
          loc.lat,
          loc.lng,
          src.utmSource,
          src.utmMedium,
          src.referrer,
          novaId,
          created,
        ],
      );
    }
  }

  // 8. Seed Marketing Broadcasts
  console.log("Generating marketing broadcasts...");
  await pool.query(
    `
    INSERT INTO marketing_broadcasts (
      id, "waitListId", name, subject, "previewText", body, status, "recipientCount", segment, "sentAt", "createdAt", "updatedAt"
    ) VALUES
    (
      $1, $2, 'Welcome to Nova Studio: Wave 1 Cohort',
      'Your private access token and onboarding details are inside',
      'Welcome to early access. Explore the infinite canvas and real-time multiplayer.',
      'Hi there,\n\nWe are thrilled to welcome you to the very first Wave of Nova Studio! Over the next 48 hours, your workspace will be provisioned.\n\nUse your referral link to skip to instant priority:\nhttps://novastudio.ai/w/nova-studio\n\nCheers,\nAlex Rivera',
      'SENT', 285, 'ALL', $3, $3, $3
    ),
    (
      $4, $2, 'Sneak Peek: Generative Canvas & Component Sync',
      'Watch the live interactive demo in action',
      'See how teams build design systems 10x faster with Nova Studio.',
      'Hi team,\n\nHere is a 3-minute video overview showing our new generative layout engine in action.\n\nBest,\nNova Studio Team',
      'SENT', 210, 'VERIFIED_ONLY', $5, $5, $5
    ),
    (
      $6, $2, 'Beta Cohort 2: Priority Rollout & Roadmap',
      'Expanding access to our top leaderboard supporters',
      'Thank you for sharing Nova Studio with your community.',
      'Hi everyone,\n\nCohort 2 rollout begins this Friday.',
      'DRAFT', 0, 'TOP_REFERRERS', null, $7, $7
    )
  `,
    [cuid("b"), novaId, subDays(3), cuid("b"), subDays(10), cuid("b"), subDays(1)],
  );

  // 9. Seed Automation Recipes
  console.log("Generating automation recipes...");
  await pool.query(
    `
    INSERT INTO automation_recipes (
      id, "waitListId", type, status, "createdAt", "updatedAt"
    ) VALUES
    ($1, $2, 'WELCOME', 'ENABLED', $5, $5),
    ($3, $2, 'REFERRAL_MILESTONE', 'ENABLED', $5, $5),
    ($4, $2, 'REFERRAL_REMINDER', 'ENABLED', $5, $5)
  `,
    [cuid("a"), novaId, cuid("a"), cuid("a"), subDays(25)],
  );

  // 10. Seed Webhook Subscription & API Key
  await pool.query(
    `
    INSERT INTO webhook_subscriptions (
      id, "waitListId", name, url, "eventTypes", enabled,
      "secretCiphertext", "secretIv", "secretTag", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, 'Nova Production Webhook', 'https://api.novastudio.ai/v1/webhooks/waitlyze',
      ARRAY['signup.created', 'signup.verified', 'referral.completed'],
      true, 'samplecipher', 'sampleiv', 'sampletag', $3, $3
    )
  `,
    [cuid("wh"), novaId, subDays(20)],
  );

  await pool.query(`DELETE FROM api_keys WHERE "userId" = $1`, [user.id]);
  await pool.query(
    `
    INSERT INTO api_keys (
      id, name, "keyHash", "keyId", "userId", "waitlistId", "createdAt", "updatedAt"
    ) VALUES (
      $1, 'Production Server-Side Ingestion',
      '9a8f4c2e1b7d5a3f6e8c0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a',
      'wl_live_9a8f', $2, $3, $4, $4
    )
  `,
    [cuid("k"), user.id, novaId, subDays(15)],
  );

  // 11. Also add 45 subscribers to HyperFocus
  await pool.query(`DELETE FROM sign_ups WHERE "waitListId" = $1`, [actualHyperFocusId]);
  for (let j = 1; j <= 45; j++) {
    const fn = FIRST_NAMES[j % FIRST_NAMES.length];
    const ln = LAST_NAMES[j % LAST_NAMES.length];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@hyperfocus.test`;
    await pool.query(
      `
      INSERT INTO sign_ups (
        id, "uniqueUserId", "referralCode", email, "emailNormalized",
        "waitListId", points, rank, "signUpEmailSent", "verifiedAt",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, true, $9,
        $9, $9
      )
    `,
      [
        cuid("s"),
        cuid("u"),
        crypto.randomUUID(),
        email,
        email.toLowerCase(),
        actualHyperFocusId,
        5,
        j,
        subDays(Math.floor(j / 3)),
      ],
    );
  }

  console.log("Successfully seeded rich showcase data for Nova Studio & Waitlyze!");
  await pool.end();
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  pool.end();
  process.exit(1);
});
